import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types";
import { R2 } from "@/lib/r2";

type TrackRow = Database["public"]["Tables"]["tracks"]["Row"];

// ============ SongAPI Client (duplicated from generate/route.ts to avoid circular imports) ============
const SONG_API_BASE = process.env.SONG_API_BASE_URL ?? "https://api.songapi.dev";
const SONG_API_KEY = process.env.SONG_API_KEY ?? "";

interface SongApiClip {
  id: string;
  audio_url?: string;
  title?: string;
  duration_seconds?: number;
}
interface SongApiGeneration {
  id: string;
  status: "queued" | "processing" | "complete" | "failed";
  prompt?: string;
  audio_url?: string;
  title?: string;
  duration_seconds?: number;
  error_message?: string;
  clips?: SongApiClip[];
}

function songApiHeaders(): Record<string, string> {
  if (!SONG_API_KEY) throw new Error("Missing SONG_API_KEY env var");
  return {
    Authorization: "Bearer " + SONG_API_KEY,
    "Content-Type": "application/json",
  };
}

async function getGeneration(id: string): Promise<SongApiGeneration> {
  const url = SONG_API_BASE + "/v1/generations/" + id;
  const res = await fetch(url, {
    headers: songApiHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("SongAPI get failed [" + res.status + "]");
  return res.json() as Promise<SongApiGeneration>;
}

/**
 * Process a single generating track: check SongAPI status, download audio,
 * upload to R2, and update DB record. Returns the (possibly updated) track row.
 */
async function processGeneratingTrack(
  tracksTable: any,
  track: TrackRow,
): Promise<TrackRow> {
  if (track.status !== "generating" || !track.suno_job_id) {
    return track;
  }

  let gen: SongApiGeneration;
  try {
    gen = await getGeneration(track.suno_job_id);
  } catch (err: any) {
    // If SongAPI temporarily fails, keep status as generating and try again next poll
    console.warn("[tracks] SongAPI poll failed for track", track.id, ":", err?.message);
    return track;
  }

  if (gen.status === "queued" || gen.status === "processing") {
    // Still generating — nothing to update
    return track;
  }

  if (gen.status === "failed") {
    const { data } = await tracksTable
      .update({ status: "failed", error_message: gen.error_message ?? "SongAPI failed" })
      .eq("id", track.id)
      .select()
      .single();
    return (data ?? track) as TrackRow;
  }

  // Status is "complete" — process audio
  let finalAudioUrl: string | null = null;
  let duration: number | null = gen.duration_seconds ?? null;
  const clip0 = gen.clips && gen.clips[0];
  const sourceAudioUrl: string | undefined = gen.audio_url ?? clip0?.audio_url;

  if (sourceAudioUrl) {
    try {
      const audioResp = await fetch(sourceAudioUrl, { cache: "no-store" });
      if (!audioResp.ok) throw new Error("Audio download failed [" + audioResp.status + "]");
      const audioBuf = await audioResp.arrayBuffer();
      const contentType = audioResp.headers.get("content-type") ?? "audio/mpeg";
      const ext = contentType.includes("wav") ? "wav" : contentType.includes("ogg") ? "ogg" : "mp3";
      const r2Key = track.user_id + "/" + track.id + "." + ext;
      const uploaded = await R2.put(r2Key, Buffer.from(audioBuf), contentType);
      finalAudioUrl = uploaded;
      if (!duration && clip0?.duration_seconds) duration = clip0.duration_seconds;
    } catch (r2Err: any) {
      console.warn("[tracks] R2 upload failed, fallback to source URL:", r2Err?.message);
      finalAudioUrl = sourceAudioUrl;
    }
  }

  const finalUpd = {
    status: "success",
    audio_url: finalAudioUrl,
    duration_sec: duration,
    title: gen.title ?? track.title,
  };
  const { data: finalTrack, error: updErr } = await tracksTable
    .update(finalUpd)
    .eq("id", track.id)
    .select()
    .single();

  if (updErr) {
    console.error("[tracks] DB update failed:", updErr.message);
    return track;
  }

  return (finalTrack ?? track) as TrackRow;
}

// ============ Route Handler ============
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tracksTable = supabase.from("tracks") as any;

    // Fetch all user tracks ordered by created_at desc
    const { data: tracks, error } = await tracksTable
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "DB query failed: " + error.message }, { status: 500 });
    }

    const rows = (tracks ?? []) as TrackRow[];

    // Process generating tracks (check SongAPI + upload to R2)
    // Process sequentially to avoid hitting rate limits / timeout
    const processed: TrackRow[] = [];
    for (const t of rows) {
      processed.push(await processGeneratingTrack(tracksTable, t));
    }

    return NextResponse.json({ ok: true, tracks: processed });
  } catch (err: any) {
    console.error("[api/tracks] error:", err);
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}  

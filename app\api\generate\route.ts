import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types";
import { R2 } from "@/lib/r2";

type TrackRow = Database["public"]["Tables"]["tracks"]["Row"];

// ============ SongAPI Client ============
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

async function submitGeneration(prompt: string, instrumental = false): Promise<SongApiGeneration> {
  const url = SONG_API_BASE + "/v1/generate";
  const res = await fetch(url, {
    method: "POST",
    headers: songApiHeaders(),
    body: JSON.stringify({ prompt, instrumental }),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error("SongAPI submit failed [" + res.status + "]: " + (err.error ?? res.statusText));
  }
  return res.json() as Promise<SongApiGeneration>;
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

async function waitForGeneration(id: string, timeoutSec = 90, pollMs = 2000): Promise<SongApiGeneration> {
  const start = Date.now();
  while (Date.now() - start < timeoutSec * 1000) {
    const gen = await getGeneration(id);
    if (gen.status === "complete" || gen.status === "failed") return gen;
    await new Promise((r) => setTimeout(r, pollMs));
  }
  throw new Error("Generation timed out after " + timeoutSec + "s");
}

// ============ Route Handler ============
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as {
      prompt?: string;
      style?: string;
      withVocal?: boolean;
    };
    const prompt = body.prompt?.trim();
    if (!prompt) return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    if (prompt.length > 3000) return NextResponse.json({ error: "Prompt too long (max 3000 chars)" }, { status: 400 });

    const instrumental = body.withVocal === false;
    const fullPrompt = body.style ? ("[" + body.style + "] " + prompt) : prompt;

    // ---- 1. Submit SongAPI job ----
    const submitted = await submitGeneration(fullPrompt, instrumental);

    // ---- 2. Insert track record (status = generating) ----
    const tracksTable = supabase.from("tracks") as any;
    const insertPayload = {
      user_id: user.id,
      title: submitted.title ?? prompt.slice(0, 60),
      prompt: fullPrompt,
      style: body.style ?? null,
      lyrics: null,
      duration_sec: null,
      audio_url: null,
      cover_url: null,
      status: "generating",
      suno_job_id: submitted.id,
      error_message: null,
      is_public: false,
    };
    const { data: track, error: insertErr } = await tracksTable
      .insert(insertPayload)
      .select()
      .single();
    if (insertErr || !track) {
      return NextResponse.json({ error: "DB insert failed: " + (insertErr?.message ?? "unknown") }, { status: 500 });
    }
    const trackRow = track as TrackRow;

    // ---- 3. Wait for generation to finish ----
    let finished: SongApiGeneration;
    try {
      finished = await waitForGeneration(submitted.id, 120);
    } catch (waitErr: any) {
      await tracksTable
        .update({ status: "failed", error_message: waitErr?.message ?? "Timed out" })
        .eq("id", trackRow.id);
      return NextResponse.json({ error: waitErr?.message ?? "Generation timed out" }, { status: 504 });
    }

    if (finished.status === "failed") {
      await tracksTable
        .update({ status: "failed", error_message: finished.error_message ?? "SongAPI failed" })
        .eq("id", trackRow.id);
      return NextResponse.json({ error: finished.error_message ?? "Generation failed" }, { status: 500 });
    }

    // ---- 4. Download audio & upload to Cloudflare R2 ----
    let finalAudioUrl: string | null = null;
    let duration: number | null = finished.duration_seconds ?? null;
    const clip0 = finished.clips && finished.clips[0];
    const sourceAudioUrl: string | undefined = finished.audio_url ?? clip0?.audio_url;

    if (sourceAudioUrl) {
      try {
        const audioResp = await fetch(sourceAudioUrl, { cache: "no-store" });
        if (!audioResp.ok) throw new Error("Audio download failed [" + audioResp.status + "]");
        const audioBuf = await audioResp.arrayBuffer();
        const contentType = audioResp.headers.get("content-type") ?? "audio/mpeg";
        const ext = contentType.includes("wav") ? "wav" : contentType.includes("ogg") ? "ogg" : "mp3";
        const r2Key = user.id + "/" + trackRow.id + "." + ext;
        const uploaded = await R2.put(r2Key, Buffer.from(audioBuf), contentType);
        finalAudioUrl = uploaded;
        if (!duration && clip0?.duration_seconds) duration = clip0.duration_seconds;
      } catch (r2Err: any) {
        console.warn("[R2 upload failed, fallback to source URL]", r2Err?.message);
        finalAudioUrl = sourceAudioUrl;
      }
    }

    // ---- 5. Update tracks to success ----
    const finalUpd = {
      status: "success",
      audio_url: finalAudioUrl,
      duration_sec: duration,
      title: finished.title ?? trackRow.title,
    };
    const { data: finalTrack, error: updErr } = await tracksTable
      .update(finalUpd)
      .select()
      .single();

    if (updErr) {
      return NextResponse.json({ error: "DB update failed: " + updErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, track: finalTrack });
  } catch (err: any) {
    console.error("[api/generate] error:", err);
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}
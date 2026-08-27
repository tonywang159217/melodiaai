completeimport { createClient } from "@/lib/supabase/server"createClient
import { NextResponse } from "next/server";
import { MusicTrack } from "@/types";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const SONG_API_BASE = process.env.SONG_API_BASE ?? "https://api.songapi.dev";
const SONG_API_KEY = process.env.SONG_API_KEY ?? "";

const R2_ACCOUNT = process.env.R2_ACCOUNT_ID ?? "";
const R2_ACCESS = process.env.R2_ACCESS_KEY_ID ?? "";
const R2_SECRET = process.env.R2_SECRET_ACCESS_KEY ?? "";
const R2_BUCKET = process.env.R2_BUCKET ?? "";
const R2_PUBLIC = (process.env.R2_PUBLIC_BUCKET_URL ?? "").replace(/\/$/, "");

const s3 = R2_ACCOUNT && R2_ACCESS && R2_SECRET
  ? new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_ACCESS, secretAccessKey: R2_SECRET },
    })
  : null;

type TrackRow = MusicTrack;

interface SongApiGeneration {
  id: string;
  status: "queued" | "processing" | "complete" | "failed";
  audio_url?: string;
  image_url?: string;
  title?: string;
  duration?: number;
  error_message?: string;
}

async function getGeneration(id: string): Promise<SongApiGeneration> {
  const res = await fetch(`${SONG_API_BASE}/v1/generations/${id}`, {
    headers: { Authorization: `Bearer ${SONG_API_KEY}` },
  });
  if (!res.ok) throw new Error(`SongAPI get failed: ${res.status}`);
  return res.json();
}

async function processGeneratingTrack(tracksTable: any, track: TrackRow): Promise<TrackRow> {
  if (track.status !== "generating" || !track.suno_job_id) return track;

  let gen: SongApiGeneration;
  try {
    gen = await getGeneration(track.suno_job_id);
  } catch (err) {
    console.warn("[tracks] SongAPI poll failed:", err);
    return track;
  }

  if (gen.status === "queued" || gen.status === "processing") {
    return track;
  }

  if (gen.status === "failed") {
    await tracksTable
      .update({
        status: "failed",
        error_message: gen.error_message ?? "SongAPI failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", track.id);
    return { ...track, status: "failed", error_message: gen.error_message ?? null };
  }

  if (gen.status === "complete") {
    let audioUrl: string | null = null;
    let coverUrl: string | null = null;

    if (s3 && R2_BUCKET && gen.audio_url) {
      try {
        const ab = await fetch(gen.audio_url).then(r => {
          if (!r.ok) throw new Error("audio fetch " + r.status);
          return r.arrayBuffer();
        });
        const key = `tracks/${track.id}/audio.mp3`;
        await s3.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: new Uint8Array(ab),
            ContentType: "audio/mpeg",
          })
        );
        audioUrl = R2_PUBLIC ? `${R2_PUBLIC}/${key}` : null;
      } catch (e) {
        console.warn("[tracks] audio upload failed:", e);
        audioUrl = gen.audio_url;
      }
    } else if (gen.audio_url) {
      audioUrl = gen.audio_url;
    }

    if (s3 && R2_BUCKET && gen.image_url) {
      try {
        const ab = await fetch(gen.image_url).then(r => {
          if (!r.ok) throw new Error("image fetch " + r.status);
          return r.arrayBuffer();
        });
        const key = `tracks/${track.id}/cover.jpg`;
        await s3.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: new Uint8Array(ab),
            ContentType: "image/jpeg",
          })
        );
        coverUrl = R2_PUBLIC ? `${R2_PUBLIC}/${key}` : null;
      } catch (e) {
        console.warn("[tracks] cover upload failed:", e);
        coverUrl = gen.image_url ?? null;
      }
    } else if (gen.image_url) {
      coverUrl = gen.image_url;
    }

    const patch = {
      status: "success" as const,
      audio_url: audioUrl,
      cover_url: coverUrl,
      title: gen.title ?? track.title,
      duration_sec: gen.duration ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data } = await tracksTable.update(patch).eq("id", track.id).select().single();
    return (data ?? { ...track, ...patch }) as TrackRow;
  }

  return track;
}

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const tracksTable = supabase.from("tracks") as any;

    const { data: rows, error: listErr } = await tracksTable
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (listErr) {
      return NextResponse.json({ error: "List failed: " + listErr.message }, { status: 500 });
    }

    const tracks: TrackRow[] = (rows ?? []) as TrackRow[];
    const stillGenerating = tracks.filter(t => t.status === "generating" && t.suno_job_id);

    if (stillGenerating.length > 0) {
      for (const t of stillGenerating) {
        try {
          await processGeneratingTrack(tracksTable, t);
        } catch (e) {
          console.warn("[tracks] process error for", t.id, e);
        }
      }
      const { data: fresh } = await tracksTable
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return NextResponse.json({ ok: true, tracks: (fresh ?? []) as TrackRow[] });
    }

    return NextResponse.json({ ok: true, tracks });
  } catch (err: any) {
    console.error("[api/tracks] error:", err);
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
      }

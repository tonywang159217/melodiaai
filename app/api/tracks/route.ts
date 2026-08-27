import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types";
import { R2 } from "@/lib/r2";

type TrackRow = Database["public"]["Tables"]["tracks"]["Row"];

const SONG_API_BASE = process.env.SONG_API_BASE_URL ?? "https://api.songapi.dev";
const SONG_API_KEY = process.env.SONG_API_KEY ?? "";

async function getGeneration(id: string) {
  const res = await fetch(`${SONG_API_BASE}/v1/generations/${id}`, {
    headers: { Authorization: `Bearer ${SONG_API_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`SongAPI get failed [${res.status}]`);
  return res.json();
}

async function processTrack(tt: any, t: TrackRow): Promise<TrackRow> {
  if (t.status !== "generating" || !t.suno_job_id) return t;
  let gen: any;
  try { gen = await getGeneration(t.suno_job_id); } catch (e) {
    console.warn("[tracks] poll failed:", e); return t;
  }
  if (gen.status === "queued" || gen.status === "processing") return t;
  if (gen.status === "failed") {
    const { data } = await tt.update({ status: "failed", error_message: gen.error_message ?? "Failed" }).eq("id", t.id).select().single();
    return (data ?? t) as TrackRow;
  }
  if (gen.status === "complete") {
    let audioUrl: string | null = null;
    const src = gen.audio_url ?? gen.clips?.[0]?.audio_url;
    if (src) {
      try {
        const r = await fetch(src, { cache: "no-store" });
        const buf = await r.arrayBuffer();
        const ct = r.headers.get("content-type") ?? "audio/mpeg";
        const ext = ct.includes("wav") ? "wav" : "mp3";
        audioUrl = await R2.put(`${t.user_id}/${t.id}.${ext}`, Buffer.from(buf), ct);
      } catch { audioUrl = src; }
    }
    const upd = { status: "success", audio_url: audioUrl, duration_sec: gen.duration_seconds ?? null, title: gen.title ?? t.title };
    const { data } = await tt.update(upd).eq("id", t.id).select().single();
    return (data ?? { ...t, ...upd }) as TrackRow;
  }
  return t;
}

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tt = supabase.from("tracks") as any;
    const { data: tracks, error } = await tt.select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    if (error) return NextResponse.json({ error: "DB query failed: " + error.message }, { status: 500 });
    const rows = (tracks ?? []) as TrackRow[];
    const processing = rows.filter(t => t.status === "generating" && t.suno_job_id);
    if (processing.length > 0) {
      for (const t of processing) { try { await processTrack(tt, t); } catch (e) { console.warn("[tracks] error:", t.id, e); } }
      const { data: fresh } = await tt.select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
      return NextResponse.json({ ok: true, tracks: (fresh ?? []) as TrackRow[] });
    }
    return NextResponse.json({ ok: true, tracks: rows });
  } catch (err: any) {
    console.error("[api/tracks] error:", err);
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}

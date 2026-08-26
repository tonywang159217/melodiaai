import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { MusicTrack } from "@/types";

type TrackRow = MusicTrack;

const SONG_API_BASE = process.env.SONG_API_BASE ?? "https://api.songapi.dev";
const SONG_API_KEY = process.env.SONG_API_KEY ?? "";

async function submitGeneration(prompt: string, instrumental: boolean) {
  const body = instrumental
    ? { prompt, make_instrumental: true, wait_for_generation: false }
    : { prompt, make_instrumental: false, wait_for_generation: false };
  const res = await fetch(`${SONG_API_BASE}/v1/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SONG_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SongAPI submit failed: ${res.status} ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  return json as { id: string; status: string };
}

export const runtime = "nodejs";
export const maxDuration = 10;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { prompt, style, instrumental } = (await req.json()) as {
      prompt?: string;
      style?: string;
      instrumental?: boolean;
    };
    if (!prompt || prompt.trim().length < 3) {
      return NextResponse.json({ error: "Prompt too short" }, { status: 400 });
    }
    if (prompt.length > 500) {
      return NextResponse.json({ error: "Prompt too long" }, { status: 400 });
    }

    const fullPrompt = style ? `[${style}] ${prompt}` : prompt;

    const profiles = supabase.from("profiles") as any;
    const { data: profile, error: profileErr } = await profiles
      .select("id, plan_id, credits")
      .eq("id", user.id)
      .maybeSingle();
    if (profileErr) {
      return NextResponse.json({ error: "Profile load failed: " + profileErr.message }, { status: 500 });
    }
    if (!profile) {
      return NextResponse.json({ error: "No profile" }, { status: 404 });
    }
    if ((profile.credits ?? 0) < 1) {
      return NextResponse.json({ error: "Not enough credits — please upgrade plan" }, { status: 402 });
    }

    let submitted: { id: string; status: string };
    try {
      submitted = await submitGeneration(fullPrompt, !!instrumental);
    } catch (err: any) {
      return NextResponse.json(
        { error: "SongAPI error: " + (err?.message ?? String(err).slice(0, 200)) },
        { status: 502 }
      );
    }

    const sunoJobId = submitted?.id ?? null;
    const initialStatus: MusicTrack["status"] = sunoJobId ? "generating" : "failed";

    const tracksTable = supabase.from("tracks") as any;
    const insertPayload = {
      user_id: user.id,
      title: (prompt.slice(0, 60).trim() || "Untitled"),
      prompt: fullPrompt,
      style: style ?? null,
      lyrics: null,
      duration_sec: null,
      audio_url: null,
      cover_url: null,
      status: initialStatus,
      suno_job_id: sunoJobId,
      error_message: sunoJobId ? null : "SongAPI returned no job id",
      is_public: false,
    };

    const { data: track, error: insertErr } = await tracksTable
      .insert(insertPayload)
      .select()
      .single();
    if (insertErr || !track) {
      return NextResponse.json({ error: "DB insert failed: " + (insertErr?.message ?? "unknown") }, { status: 500 });
    }

    if (initialStatus === "generating") {
      const credits = (profile.credits ?? 0) - 1;
      const { error: updateErr } = await profiles
        .update({ credits, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (updateErr) console.warn("[api/generate] credits deduct failed:", updateErr);
    }

    return NextResponse.json({ ok: true, track: track as TrackRow });
  } catch (err: any) {
    console.error("[api/generate] error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}

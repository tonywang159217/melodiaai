"use client";

import { useEffect, useRef, useState } from "react";

interface Track {
  id: string;
  user_id: string;
  title: string;
  prompt: string;
  style: string | null;
  lyrics: string | null;
  duration_sec: number | null;
  audio_url: string | null;
  cover_url: string | null;
  status: "queued" | "generating" | "success" | "failed";
  suno_job_id: string | null;
  error_message: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

function fmtDuration(sec: number | null): string {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const STATUS_LABEL: Record<Track["status"], string> = {
  queued: "Queued",
  generating: "Generating",
  success: "Ready",
  failed: "Failed",
};

const STATUS_BADGE: Record<Track["status"], string> = {
  queued: "bg-yellow-100 text-yellow-800 border-yellow-200",
  generating: "bg-blue-100 text-blue-800 border-blue-200",
  success: "bg-emerald-100 text-emerald-800 border-emerald-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

export function TrackList() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const stopped = useRef(false);

  async function refresh() {
    try {
      const res = await fetch("/api/tracks", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "加载失败");
      } else {
        setError(null);
        setTracks(Array.isArray(json.tracks) ? json.tracks : []);
      }
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    let timer: any;
    const tick = () => {
      if (stopped.current) return;
      const anyGenerating = tracks.some(t => t.status === "generating" || t.status === "queued");
      if (anyGenerating) {
        refresh();
      }
      timer = setTimeout(tick, 5000);
    };
    timer = setTimeout(tick, 5000);
    return () => {
      stopped.current = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks.map(t => `${t.id}:${t.status}`).join("|")]);

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">Your recent tracks</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Generations usually take 30–90 seconds. We&apos;ll keep this list fresh.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          Loading your tracks…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : tracks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          No tracks yet — generate your first one above →
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tracks.map(t => (
            <div
              key={t.id}
              className="group overflow-hidden rounded-2xl border border-border/60 bg-card/50 shadow-sm transition hover:shadow-md"
            >
              {t.cover_url ? (
                <div className="relative aspect-square w-full overflow-hidden bg-muted">
                  <img
                    src={t.cover_url}
                    alt={t.title}
                    className="h-full w-full object-cover"
                    onError={e => ((e.target as HTMLImageElement).style.display = "none")}
                  />
                </div>
              ) : (
                <div className="aspect-square w-full bg-gradient-to-br from-primary/20 via-primary/10 to-accent" />
              )}
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="line-clamp-1 font-semibold tracking-tight">{t.title}</h4>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{t.prompt}</p>
                  </div>
                  <span
                    className={
                      "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium " +
                      STATUS_BADGE[t.status]
                    }
                  >
                    {STATUS_LABEL[t.status]}
                  </span>
                </div>

                {t.audio_url && t.status === "success" ? (
                  <audio controls className="w-full" preload="none">
                    <source src={t.audio_url} type="audio/mpeg" />
                  </audio>
                ) : null}

                {t.status === "failed" && t.error_message ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {t.error_message}
                  </div>
                ) : null}

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{new Date(t.created_at).toLocaleString()}</span>
                  <span>{t.duration_sec ? fmtDuration(t.duration_sec) : ""}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

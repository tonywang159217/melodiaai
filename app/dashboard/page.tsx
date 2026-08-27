import { Music, Sparkles } from "lucide-react";
import Link from "next/link";
import MusicGenerator from "@/components/MusicGenerator";
import { TrackList } from "@/components/TrackList";

export default function DashboardPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your studio</h1>
          <p className="mt-1 text-muted-foreground">
            Pick up where you left off, or start a new idea.
          </p>
        </div>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background px-4 py-2 text-sm transition hover:bg-accent/60"
        >
          <Sparkles size={15} />
          Upgrade plan
        </Link>
      </div>
      <div className="space-y-6">
        <MusicGenerator />
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-border/70 bg-card p-6">
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Music size={16} /> Your recent tracks
            </div>
            <TrackList />
          </div>
          <div className="rounded-3xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">
            No tracks found.
          </div>
        </div>
      </div>
    </section>
  );
}

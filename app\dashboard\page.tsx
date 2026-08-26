import { Music, Sparkles } from "lucide-react";
import Link from "next/link";

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

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-3xl border border-border/70 bg-card p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Music size={16} /> Your recent tracks
          </div>
          <div className="mt-4 flex h-60 items-center justify-center rounded-2xl border border-dashed border-border/70 text-sm text-muted-foreground">
            No tracks yet — generate your first one &rarr;
          </div>
        </div>

        <div className="rounded-3xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">
          <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground/80">
            Plan usage
          </div>
          <div className="text-2xl font-semibold text-foreground">
            0 / 5 generations
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Free plan</div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-0 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
          </div>
        </div>
      </div>
    </section>
  );
}
import { createClient } from "@/lib/supabase/server";
import MusicGenerator from "@/components/MusicGenerator";
import { TrackList } from "@/components/TrackList";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const profiles = supabase.from("profiles") as any;
  const { data: profile } = await profiles
    .select("id, plan_id, full_name, credits, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.full_name || user.email?.split("@")[0] || "You";
  const planId = profile?.plan_id || "free";
  const credits = profile?.credits ?? 0;
  const monthlyLimit = planId === "pro" ? 200 : planId === "basic" ? 50 : 5;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Welcome back, {displayName}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Your studio</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Pick up where you left off, or start a new idea.</p>
        </div>
        <Link href="/pricing" className="inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">Upgrade plan</Link>
      </div>

      <MusicGenerator />

      <TrackList />

      <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight">Plan usage</h3>
          <span className="text-sm text-muted-foreground">{credits} / {monthlyLimit} generations</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all" style={{ width: `${Math.min(100, (credits / monthlyLimit) * 100)}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{planId === "free" ? "Free plan" : planId === "basic" ? "Basic plan" : "Pro plan"}</p>
      </div>
    </div>
  );
}

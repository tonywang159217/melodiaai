"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Button from "@/components/Button";
import { getSupabase } from "@/lib/supabase/client";

function isError(e: unknown): e is { message: string } {
  return typeof e === "object" && e !== null && "message" in e;
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push(next.startsWith("/") ? next : "/dashboard");
    } catch (e: unknown) {
      setErr(isError(e) ? e.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-14rem)] max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to continue creating.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-11 rounded-xl border border-border/80 bg-background px-4 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-11 rounded-xl border border-border/80 bg-background px-4 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
            />
          </div>

          {err && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {err}
            </div>
          )}

          <Button full size="lg" loading={loading} type="submit">
            Sign in
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="font-medium text-foreground underline-offset-2 hover:underline">
            Create one
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import { getSupabase } from "@/lib/supabase/client";

function isError(e: unknown): e is { message: string } {
  return typeof e === "object" && e !== null && "message" in e;
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      const { error } = await getSupabase().auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name || email.split("@")[0] },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });
      if (error) throw error;
      setMsg("Check your inbox to confirm your email address.");
    } catch (e: unknown) {
      setErr(isError(e) ? e.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-14rem)] max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start with 5 free generations per month.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 rounded-xl border border-border/80 bg-background px-4 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 rounded-xl border border-border/80 bg-background px-4 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 rounded-xl border border-border/80 bg-background px-4 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
            />
          </div>

          {err && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {err}
            </div>
          )}
          {msg && (
            <div className="rounded-xl bg-violet-500/10 border border-violet-500/30 px-3 py-2 text-sm text-violet-700 dark:text-violet-300">
              {msg}
            </div>
          )}

          <Button full size="lg" loading={loading} type="submit">
            Create account
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-foreground underline-offset-2 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
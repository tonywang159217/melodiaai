"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";
import Button from "@/components/Button";

type SupabaseOtpType =
  | "signup"
  | "invite"
  | "magiclink"
  | "recovery"
  | "email"
  | "email_change"
  | "phone"
  | "phone_change"
  | "reauthentication";

function isError(e: unknown): e is { message: string } {
  return typeof e === "object" && e !== null && "message" in e;
}

function AuthConfirmInner() {
  const params = useSearchParams();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const token_hash = params.get("token_hash");
      const rawType = params.get("type");
      const type = rawType as SupabaseOtpType;
      if (!token_hash || !type) {
        setStatus("error");
        setErr("Invalid confirmation link.");
        return;
      }
      try {
        const { error } = await getSupabase().auth.verifyOtp({ token_hash, type });
        if (error) throw error;
        setStatus("ok");
      } catch (e: unknown) {
        setStatus("error");
        setErr(isError(e) ? e.message : "Verification failed.");
      }
    })();
  }, [params]);

  return (
    <section className="mx-auto flex min-h-[calc(100vh-14rem)] max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-3xl border border-border/70 bg-card p-8 text-center shadow-sm">
        {status === "loading" && <div className="py-8">Verifying your email…</div>}
        {status === "ok" && (
          <>
            <h1 className="text-2xl font-bold">Email confirmed!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account is ready.
            </p>
            <Link href="/dashboard" className="mt-6 inline-block">
              <Button size="lg">Go to dashboard</Button>
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Oops</h1>
            <p className="mt-2 text-sm">{err}</p>
            <Link href="/auth/login" className="mt-6 inline-block">
              <Button variant="outline">Back to sign in</Button>
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <AuthConfirmInner />
    </Suspense>
  );
}
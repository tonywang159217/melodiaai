"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

let _browserSupabase: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (typeof window === "undefined") return createClient();
  if (!_browserSupabase) _browserSupabase = createClient();
  return _browserSupabase;
}
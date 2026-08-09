/**
 * Browser-side Supabase client using the publishable (anon) key.
 * All queries go through RLS. Never import server-only helpers here.
 */

"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "./env";
import type { Database } from "./types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getBrowserSupabase() {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
  );
  return browserClient;
}

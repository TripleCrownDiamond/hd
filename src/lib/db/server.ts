/**
 * Server-side Supabase clients. Two flavours:
 *   - getServerSupabase()   → user-scoped, respects RLS via cookies
 *   - getServiceSupabase()  → bypasses RLS; only inside privileged server use-cases
 *
 * Neither is allowed to leak into the browser bundle.
 */

import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "./env";
import type { Database } from "./types";

export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(items) {
          try {
            items.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options });
            });
          } catch {
            // Called from a Server Component render — cookies are read-only here.
            // The refresh will be handled by middleware.
          }
        },
      },
    },
  );
}

/**
 * Public, sessionless catalog client. It uses the publishable key and remains
 * constrained by the anonymous RLS policies.
 */
export function getPublicSupabase() {
  return createClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * PRIVILEGED. Use only inside server use-cases that:
 *   - already checked the caller's role/permission,
 *   - audit the mutation via public.audit_logs,
 *   - never expose the result blindly to the client.
 */
export function getServiceSupabase() {
  const env = serverEnv();
  const key = env.supabaseSecretKey ?? env.supabaseServiceRoleKey;
  if (!key) {
    throw new Error(
      "SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) is required for privileged operations.",
    );
  }
  return createClient<Database>(env.supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Temporary migration-aware clients for tables added after the last hosted
 * type generation. Every mutation using these clients must validate with Zod.
 * Replace them with the typed clients after `pnpm db:types` can be regenerated.
 */
export async function getMigrationAwareServerSupabase(): Promise<SupabaseClient> {
  return (await getServerSupabase()) as unknown as SupabaseClient;
}

export function getMigrationAwarePublicSupabase(): SupabaseClient {
  return getPublicSupabase() as unknown as SupabaseClient;
}

export function getMigrationAwareServiceSupabase(): SupabaseClient {
  return getServiceSupabase() as unknown as SupabaseClient;
}

/**
 * Runtime env validation for Supabase. Fails fast on missing vars in
 * server contexts. Client vars must be prefixed NEXT_PUBLIC_.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optional(value: string | undefined): string | undefined {
  return value && value.trim() !== "" ? value : undefined;
}

export const publicEnv = {
  supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
};

/**
 * Server-only. Never import from a "use client" file.
 */
export function serverEnv() {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() must not be called in the browser");
  }
  return {
    ...publicEnv,
    supabaseServiceRoleKey: optional(process.env.SUPABASE_SERVICE_ROLE_KEY),
    supabaseSecretKey: optional(process.env.SUPABASE_SECRET_KEY),
  };
}

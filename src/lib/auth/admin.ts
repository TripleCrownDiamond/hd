import "server-only";

import { redirect } from "next/navigation";
import { getMigrationAwareServerSupabase, getMigrationAwareServiceSupabase } from "@/lib/db/server";
import type { Database } from "@/lib/db/types";

type AppRole = Database["public"]["Enums"]["app_role"];

type AdminAccess = { userId: string; role: AppRole };

/**
 * One retry on a transient network failure.
 *
 * The first Supabase call after a login or a cold worker start can reject once
 * while the session itself is valid. Without the retry, a single hiccup turns
 * the whole admin layout into the generic error boundary; with it, the second
 * attempt usually succeeds. A confirmed absence of user or role still redirects
 * exactly as before, and a genuine repeated failure fails closed (redirects to
 * the login page) instead of crashing the render.
 */
async function readAdminAccess(
  supabase: Awaited<ReturnType<typeof getMigrationAwareServerSupabase>>,
  allowed: AppRole[],
): Promise<{ kind: "ok"; access: AdminAccess } | { kind: "anonymous" } | { kind: "forbidden" } | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { kind: "anonymous" };

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("profile_id", user.id)
        .in("role", allowed)
        .limit(1)
        .maybeSingle();

      if (!data) return { kind: "forbidden" };
      return { kind: "ok", access: { userId: user.id, role: data.role } };
    } catch (error) {
      // Transient network failure — retry once, then fail closed. The login
      // redirect stays reachable because a null user (supabase-js resolves
      // some network failures instead of throwing) also fails closed.
      if (attempt === 1) {
        console.error("Admin-Zugriffsprüfung fehlgeschlagen.", error);
      }
    }
  }
  return null;
}

export async function requireAdminAccess(
  allowed: AppRole[] = ["admin"],
): Promise<AdminAccess> {
  const supabase = await getMigrationAwareServerSupabase();
  const result = await readAdminAccess(supabase, allowed);

  if (result?.kind === "ok") return result.access;
  if (result?.kind === "forbidden") redirect("/konto?admin=forbidden");
  // Anonymous or unreachable: the login page (with a retry of its own) is a
  // better destination than the generic error boundary.
  redirect("/konto/anmelden?next=/admin");
}

export async function auditAdminAction(input: {
  actorId: string;
  role: AppRole;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  const service = getMigrationAwareServiceSupabase();
  await service.from("audit_logs").insert({
    actor_id: input.actorId,
    actor_role: input.role,
    action: input.action,
    entity: input.entity,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });
}

import "server-only";

import { redirect } from "next/navigation";
import { getMigrationAwareServerSupabase, getMigrationAwareServiceSupabase } from "@/lib/db/server";
import type { Database } from "@/lib/db/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export async function requireAdminAccess(
  allowed: AppRole[] = ["admin"],
): Promise<{ userId: string; role: AppRole }> {
  const supabase = await getMigrationAwareServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/konto/anmelden?next=/admin");

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("profile_id", user.id)
    .in("role", allowed)
    .limit(1)
    .maybeSingle();

  if (!data) redirect("/konto?admin=forbidden");
  return { userId: user.id, role: data.role };
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

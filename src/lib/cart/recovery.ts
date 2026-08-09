import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { getMigrationAwareServiceSupabase } from "@/lib/db/server";

export const cartSessionHash = (token: string) => createHash("sha256").update(token).digest("hex");
const secret = () => process.env.CART_RECOVERY_SECRET || process.env.CRON_SECRET || null;
export function signRecovery(cartId: string) { const key = secret(); if (!key) return null; return `${cartId}.${createHmac("sha256", key).update(cartId).digest("hex")}`; }
export function verifyRecovery(token: string) { const [cartId, signature] = token.split("."); const key = secret(); if (!cartId || !signature || !key) return null; const expected = createHmac("sha256", key).update(cartId).digest("hex"); try { return timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ? cartId : null; } catch { return null; } }

export async function saveRecoverableCart(input: { sessionToken: string; email: string; name?: string; items: unknown[]; subtotalCents: number; promotionCode?: string | null }) {
  const supabase = getMigrationAwareServiceSupabase(); const { data: settings } = await supabase.from("site_settings").select("cart_recovery_enabled,cart_recovery_first_delay_minutes").eq("id", 1).maybeSingle();
  if (!settings?.cart_recovery_enabled) return { enabled: false };
  const now = new Date(); const next = new Date(now.getTime() + Number(settings.cart_recovery_first_delay_minutes ?? 60) * 60_000);
  const { error } = await supabase.from("abandoned_carts").upsert({ session_token_hash: cartSessionHash(input.sessionToken), customer_email: input.email, customer_name: input.name || null, items: input.items, subtotal_cents: input.subtotalCents, promotion_code: input.promotionCode || null, consent_at: now.toISOString(), last_activity_at: now.toISOString(), next_reminder_at: next.toISOString(), reminder_count: 0, status: "active" }, { onConflict: "session_token_hash" });
  if (error) throw new Error("Cart recovery could not be saved"); return { enabled: true };
}

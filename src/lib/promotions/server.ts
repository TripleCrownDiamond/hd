import "server-only";

import { getMigrationAwareServiceSupabase } from "@/lib/db/server";
import { calculateDiscount, type DiscountLine } from "./calculate";

export class PromotionError extends Error {
  constructor(message: string, readonly status = 409) {
    super(message);
    this.name = "PromotionError";
  }
}

export async function evaluatePromotion(code: string | null | undefined, lines: DiscountLine[]) {
  if (!code?.trim()) return { code: null, promotionId: null, discountCents: 0, lineDiscounts: lines.map(() => 0) };
  const normalized = code.trim().toUpperCase();
  const supabase = getMigrationAwareServiceSupabase();
  const { data: promotion, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("code", normalized)
    .maybeSingle();
  if (error) throw new PromotionError("Der Rabattcode konnte nicht geprüft werden.", 500);
  if (!promotion || !promotion.is_active) throw new PromotionError("Dieser Rabattcode ist ungültig.");

  const now = Date.now();
  if (promotion.starts_at && new Date(promotion.starts_at).getTime() > now) throw new PromotionError("Dieser Rabattcode ist noch nicht gültig.");
  if (promotion.ends_at && new Date(promotion.ends_at).getTime() < now) throw new PromotionError("Dieser Rabattcode ist abgelaufen.");
  if (promotion.usage_limit != null && promotion.times_redeemed >= promotion.usage_limit) throw new PromotionError("Dieser Rabattcode wurde bereits vollständig eingelöst.");

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("promotion_products").select("product_id").eq("promotion_id", promotion.id),
    supabase.from("promotion_categories").select("category_id").eq("promotion_id", promotion.id),
  ]);
  const result = calculateDiscount(lines, {
    discountType: promotion.discount_type,
    discountValue: promotion.discount_value,
    scope: promotion.scope,
    minimumOrderCents: promotion.minimum_subtotal_cents,
    maximumDiscountCents: promotion.maximum_discount_cents,
    productIds: new Set((products ?? []).map((row) => row.product_id as string)),
    categoryIds: new Set((categories ?? []).map((row) => row.category_id as string)),
  });
  if (result.eligibleSubtotalCents === 0) throw new PromotionError("Der Rabattcode gilt nicht für die Artikel im Warenkorb.");
  if (result.discountCents === 0) throw new PromotionError("Der Mindestbestellwert für diesen Rabattcode ist nicht erreicht.");
  return { code: normalized, promotionId: promotion.id as string, discountCents: result.discountCents, lineDiscounts: result.lineDiscounts };
}

export async function quotePromotionForCart(code: string, items: { slug: string; quantity: number }[]) {
  const supabase = getMigrationAwareServiceSupabase();
  const slugs = [...new Set(items.map((item) => item.slug))];
  const { data, error } = await supabase.from("products").select("id,slug,category_id,price_cents_public,review_status,is_published").in("slug", slugs);
  if (error) throw new PromotionError("Produkte konnten nicht geladen werden.", 500);
  const bySlug = new Map((data ?? []).map((row) => [row.slug as string, row]));
  const lines = items.map((item) => {
    const product = bySlug.get(item.slug);
    if (!product || !product.is_published || product.review_status !== "approved" || !product.price_cents_public) throw new PromotionError("Ein Artikel ist nicht mehr rabattfähig.");
    return { productId: product.id as string, categoryId: product.category_id as string | null, quantity: item.quantity, unitPriceCents: product.price_cents_public as number };
  });
  return evaluatePromotion(code, lines);
}

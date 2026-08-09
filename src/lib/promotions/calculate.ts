export interface DiscountLine {
  productId: string;
  categoryId: string | null;
  quantity: number;
  unitPriceCents: number;
}

export interface DiscountRule {
  discountType: "percentage" | "fixed";
  discountValue: number;
  scope: "all" | "products" | "categories";
  minimumOrderCents: number;
  maximumDiscountCents: number | null;
  productIds: ReadonlySet<string>;
  categoryIds: ReadonlySet<string>;
}

export interface DiscountResult {
  discountCents: number;
  lineDiscounts: number[];
  eligibleSubtotalCents: number;
}

export function calculateDiscount(lines: DiscountLine[], rule: DiscountRule): DiscountResult {
  const subtotal = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
  if (subtotal < rule.minimumOrderCents) {
    return { discountCents: 0, lineDiscounts: lines.map(() => 0), eligibleSubtotalCents: 0 };
  }

  const eligible = lines.map((line) =>
    rule.scope === "all" ||
    (rule.scope === "products" && rule.productIds.has(line.productId)) ||
    (rule.scope === "categories" && !!line.categoryId && rule.categoryIds.has(line.categoryId)),
  );
  const eligibleSubtotalCents = lines.reduce(
    (sum, line, index) => sum + (eligible[index] ? line.unitPriceCents * line.quantity : 0),
    0,
  );
  if (eligibleSubtotalCents === 0) {
    return { discountCents: 0, lineDiscounts: lines.map(() => 0), eligibleSubtotalCents };
  }

  const raw = rule.discountType === "percentage"
    ? Math.floor((eligibleSubtotalCents * rule.discountValue) / 10_000)
    : Math.min(rule.discountValue, eligibleSubtotalCents);
  const discountCents = Math.max(
    0,
    Math.min(raw, rule.maximumDiscountCents ?? Number.MAX_SAFE_INTEGER, eligibleSubtotalCents),
  );

  let allocated = 0;
  const lineDiscounts = lines.map((line, index) => {
    if (!eligible[index]) return 0;
    const lineTotal = line.unitPriceCents * line.quantity;
    const amount = Math.floor((discountCents * lineTotal) / eligibleSubtotalCents);
    allocated += amount;
    return amount;
  });
  const lastEligible = eligible.lastIndexOf(true);
  if (lastEligible >= 0) lineDiscounts[lastEligible] = (lineDiscounts[lastEligible] ?? 0) + discountCents - allocated;

  return { discountCents, lineDiscounts, eligibleSubtotalCents };
}

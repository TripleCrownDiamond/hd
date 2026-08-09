import { describe, expect, it } from "vitest";
import { calculateDiscount } from "./calculate";

const lines = [
  { productId: "a", categoryId: "wood", quantity: 2, unitPriceCents: 1000 },
  { productId: "b", categoryId: "stove", quantity: 1, unitPriceCents: 3000 },
];

describe("calculateDiscount", () => {
  it("applies a percentage only to selected products", () => {
    expect(calculateDiscount(lines, { discountType: "percentage", discountValue: 1000, scope: "products", minimumOrderCents: 0, maximumDiscountCents: null, productIds: new Set(["a"]), categoryIds: new Set() })).toMatchObject({ discountCents: 200, lineDiscounts: [200, 0] });
  });

  it("caps fixed discounts at the eligible subtotal", () => {
    expect(calculateDiscount(lines, { discountType: "fixed", discountValue: 9999, scope: "categories", minimumOrderCents: 0, maximumDiscountCents: null, productIds: new Set(), categoryIds: new Set(["stove"]) }).discountCents).toBe(3000);
  });
});

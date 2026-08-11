import { describe, expect, it } from "vitest";
import { hasVariantPriceRange, type ScrapedVariant } from "./scraped";

function variant(surchargeCents: number | null): ScrapedVariant {
  return {
    axis: "farbe",
    code: "x",
    label_de: "X",
    swatch_url_source: null,
    main_image_url_source: null,
    video_url_source: null,
    surcharge_cents: surchargeCents,
  };
}

describe("hasVariantPriceRange", () => {
  it("is false with no variants", () => {
    expect(hasVariantPriceRange([])).toBe(false);
  });

  it("is false when every variant shares the same price", () => {
    expect(hasVariantPriceRange([variant(0), variant(0), variant(null)])).toBe(false);
    expect(hasVariantPriceRange([variant(null), variant(null)])).toBe(false);
    expect(hasVariantPriceRange([variant(5000)])).toBe(false);
  });

  it("is true when variants carry at least two different prices", () => {
    expect(hasVariantPriceRange([variant(0), variant(2500)])).toBe(true);
    expect(hasVariantPriceRange([variant(null), variant(3000), variant(0)])).toBe(true);
  });
});

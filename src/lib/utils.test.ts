import { describe, it, expect } from "vitest";
import { cn, computeBasePriceCents, formatPrice, formatBasePrice } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("resolves conflicting Tailwind utilities", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("ignores falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });
});

describe("formatPrice", () => {
  it("formats cents to German EUR", () => {
    expect(formatPrice(4999).replace(/ /g, " ")).toBe("49,99 €");
  });

  it("formats thousand separators", () => {
    expect(formatPrice(129900).replace(/ /g, " ")).toBe("1.299,00 €");
  });

  it("formats zero", () => {
    expect(formatPrice(0).replace(/ /g, " ")).toBe("0,00 €");
  });
});

describe("formatBasePrice", () => {
  it("appends the unit", () => {
    expect(formatBasePrice(149, "kg").replace(/ /g, " ")).toBe("1,49 € / kg");
  });
});

describe("computeBasePriceCents", () => {
  it("quotes a pallet price per tonne", () => {
    // 449,00 € for 990 kg -> 453,54 €/t
    expect(computeBasePriceCents(44900, 990, "kg", "t")).toBe(45354);
  });

  it("quotes a single sack per kilogram", () => {
    // 7,38 € for 15 kg -> 0,49 €/kg
    expect(computeBasePriceCents(738, 15, "kg", "kg")).toBe(49);
  });

  it("quotes per 100 kg", () => {
    expect(computeBasePriceCents(44900, 990, "kg", "100kg")).toBe(4535);
  });

  it("converts from tonnes as well as to them", () => {
    expect(computeBasePriceCents(45000, 1, "t", "kg")).toBe(45);
  });

  it("surfaces a pallet price mislabelled as a single sack", () => {
    // 499,68 € against a declared 15 kg is 33.312 €/t — the number that makes
    // the data error obvious on the card.
    expect(computeBasePriceCents(49968, 15, "kg", "t")).toBe(3331200);
  });

  it("divides volume units by themselves", () => {
    expect(computeBasePriceCents(33900, 1.5, "rm", "rm")).toBe(22600);
  });

  it("refuses to convert between volume units", () => {
    expect(computeBasePriceCents(33900, 1.5, "srm", "fm")).toBeNull();
  });

  it("refuses to mix mass and volume", () => {
    expect(computeBasePriceCents(33900, 1.5, "srm", "t")).toBeNull();
  });

  it("returns null when anything is missing", () => {
    expect(computeBasePriceCents(44900, null, "kg", "t")).toBeNull();
    expect(computeBasePriceCents(44900, 990, null, "t")).toBeNull();
    expect(computeBasePriceCents(44900, 990, "kg", null)).toBeNull();
    expect(computeBasePriceCents(0, 990, "kg", "t")).toBeNull();
    expect(computeBasePriceCents(44900, 0, "kg", "t")).toBeNull();
  });
});

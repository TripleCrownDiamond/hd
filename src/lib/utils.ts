import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format price in EUR cents to locale German string.
 *
 * @example
 *   formatPrice(4999) // "49,99 €"
 *   formatPrice(129900) // "1.299,00 €"
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Convert English-style decimal separators in supplier text to the German
 * comma ("548.5 kg" -> "548,5 kg", "1.85 cm" -> "1,85 cm").
 *
 * Retailers publish spec tables that mix separators — one row says
 * "548,50 kg", the next "548.5 kg". A dot followed by exactly one or two
 * digits is a decimal separator in German; a dot followed by three digits is a
 * thousands separator and must stay ("1.234"). A dot followed by another dot
 * is a date and is left alone ("01.05.2026").
 */
export function normalizeGermanNumbers(value: string): string {
  return value.replace(/(\d{1,3})\.(\d{1,2})(?![\d.])/g, "$1,$2");
}

/**
 * Format a base price (e.g., per kg or per m³).
 *
 * @example
 *   formatBasePrice(149, "kg") // "1,49 €/kg"
 */
export function formatBasePrice(
  cents: number,
  unit: string,
): string {
  const price = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(cents / 100);
  return `${price} / ${unit}`;
}

/** Units a product's sold quantity can be counted in. */
export type QuantityUnit = "kg" | "t" | "srm" | "rm" | "fm" | "l" | "stk";
/** Units a Grundpreis can be quoted in. */
export type BasePriceUnit = "kg" | "100kg" | "t" | "srm" | "rm" | "fm" | "l" | "stk";

/** How many of the smallest mass unit (kg) each mass unit holds. */
const MASS_IN_KG: Partial<Record<BasePriceUnit, number>> = { kg: 1, "100kg": 100, t: 1000 };

export const BASE_PRICE_UNIT_LABEL: Record<BasePriceUnit, string> = {
  kg: "kg",
  "100kg": "100 kg",
  t: "t",
  srm: "SRM",
  rm: "RM",
  fm: "FM",
  l: "l",
  stk: "Stück",
};

/**
 * Grundpreis in cents: what the product costs per `basePriceUnit`.
 *
 * § 4 PAngV requires this next to the price for anything sold by weight, and
 * for solid fuels the trade quotes it per tonne. Deriving it here rather than
 * storing it means it can never contradict the price it sits beside.
 *
 * Mass units convert into one another. Volume units do not: turning
 * Schüttraummeter into Festmeter needs a species- and split-dependent factor
 * the catalogue does not hold, so a mismatched pair returns null rather than a
 * confident wrong number.
 *
 * @example
 *   computeBasePriceCents(44900, 990, "kg", "t")  // 45354 -> 453,54 €/t
 *   computeBasePriceCents(738, 15, "kg", "kg")    //   492 ->   4,92 €/kg
 */
export function computeBasePriceCents(
  priceCents: number,
  quantityAmount: number | null | undefined,
  quantityUnit: QuantityUnit | null | undefined,
  basePriceUnit: BasePriceUnit | null | undefined,
): number | null {
  if (!priceCents || priceCents <= 0) return null;
  if (!quantityAmount || quantityAmount <= 0) return null;
  if (!quantityUnit || !basePriceUnit) return null;

  const fromKg = MASS_IN_KG[quantityUnit as BasePriceUnit];
  const toKg = MASS_IN_KG[basePriceUnit];
  if (fromKg && toKg) {
    return Math.round((priceCents / (quantityAmount * fromKg)) * toKg);
  }
  // Everything else only works against itself.
  if (quantityUnit !== basePriceUnit) return null;
  return Math.round(priceCents / quantityAmount);
}

/**
 * Delay for animations / simulated loading.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

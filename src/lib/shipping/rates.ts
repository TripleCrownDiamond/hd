/**
 * What delivery costs, and when it is free.
 *
 * Deliberately free of any data file so it can run in the browser and be unit
 * tested: postcode lookup lives in ./postcodes (server only) and zoning in
 * ./zones.
 *
 * The tariff mirrors how these goods actually ship in Germany. Firewood,
 * pellets, briquettes and coal travel on a pallet by forwarder; a stove is a
 * single heavy item needing a tail lift; everything else fits a parcel. One
 * order is one shipment, so the order pays the dearest class it contains, once
 * — not a fee per line.
 */

import type { ProductKind } from "@/lib/db/types";

export type ShippingClass = "parcel" | "freight" | "bulky";
export type DeliveryZone = "mainland" | "island";

/** Order value from which delivery to the door is free. */
export const FREE_SHIPPING_FROM_CENTS = 99_900;

export const SHIPPING_RATES: Record<ShippingClass, number> = {
  // DHL parcel up to 31.5 kg.
  parcel: 690,
  // Forwarder, pallet, kerbside delivery on the German mainland.
  freight: 6_900,
  // Stove: tail lift and a two-person handover.
  bulky: 8_900,
};

/**
 * Islands without a road link. A forwarder has to book a ferry or the Sylt car
 * train, which is charged on top of the mainland rate.
 */
export const ISLAND_SURCHARGE_CENTS = 4_900;

/** A parcel still ships to an island, so only freight pays the ferry. */
export function surchargeFor(zone: DeliveryZone, shippingClass: ShippingClass): number {
  if (zone !== "island") return 0;
  return shippingClass === "parcel" ? 0 : ISLAND_SURCHARGE_CENTS;
}

export function shippingClassFor(kind: ProductKind | string): ShippingClass {
  switch (kind) {
    case "stove":
      return "bulky";
    case "wood":
    case "pellet":
    case "briquette":
    case "coal":
      return "freight";
    // Kindling and accessories are parcel goods.
    default:
      return "parcel";
  }
}

const CLASS_ORDER: ShippingClass[] = ["parcel", "freight", "bulky"];

/** The dearest class in the basket: one shipment, charged once. */
export function dominantClass(classes: ShippingClass[]): ShippingClass {
  let dominant: ShippingClass = "parcel";
  for (const candidate of classes) {
    if (CLASS_ORDER.indexOf(candidate) > CLASS_ORDER.indexOf(dominant)) dominant = candidate;
  }
  return dominant;
}

export interface ShippingQuote {
  /** What the customer pays, surcharge included. */
  totalCents: number;
  baseCents: number;
  surchargeCents: number;
  shippingClass: ShippingClass;
  zone: DeliveryZone;
  free: boolean;
  /** Missing to reach free delivery, or 0 once reached. */
  remainingForFreeCents: number;
}

export function quoteShipping({
  subtotalCents,
  kinds,
  zone,
}: {
  subtotalCents: number;
  kinds: Array<ProductKind | string>;
  zone: DeliveryZone;
}): ShippingQuote {
  const shippingClass = dominantClass(kinds.map(shippingClassFor));
  const baseCents = SHIPPING_RATES[shippingClass];
  const surchargeCents = surchargeFor(zone, shippingClass);
  const free = subtotalCents >= FREE_SHIPPING_FROM_CENTS;

  return {
    // Free delivery covers the island ferry too: the promise is "free to your
    // door", and a surprise surcharge at the end would break it.
    totalCents: free ? 0 : baseCents + surchargeCents,
    baseCents,
    surchargeCents,
    shippingClass,
    zone,
    free,
    remainingForFreeCents: Math.max(0, FREE_SHIPPING_FROM_CENTS - subtotalCents),
  };
}

export const SHIPPING_CLASS_LABEL: Record<ShippingClass, string> = {
  parcel: "Paketversand",
  freight: "Speditionsversand (Palette, frei Bordsteinkante)",
  bulky: "Speditionsversand mit Hebebühne",
};

/**
 * Order status vocabulary shared by the admin, the emails and the tracking page.
 *
 * Kept free of server imports so the tracking page and the status email can
 * both label a status the same way.
 */

export const ORDER_STATUSES = [
  "draft",
  "pending_payment",
  "paid",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  draft: "Entwurf",
  pending_payment: "Zahlung ausstehend",
  paid: "Bezahlt",
  confirmed: "Bestätigt",
  processing: "In Bearbeitung",
  shipped: "Versandt",
  delivered: "Zugestellt",
  cancelled: "Storniert",
  refunded: "Erstattet",
};

/** The sentence the customer reads in the status email for each status. */
export const STATUS_MESSAGE: Record<OrderStatus, string> = {
  draft: "Ihre Bestellung wurde angelegt.",
  pending_payment: "Wir warten auf Ihren Zahlungseingang.",
  paid: "Ihre Zahlung ist eingegangen — vielen Dank!",
  confirmed: "Wir haben Ihre Bestellung bestätigt und bereiten sie vor.",
  processing: "Ihre Bestellung wird kommissioniert.",
  shipped: "Ihre Bestellung ist unterwegs zu Ihnen.",
  delivered: "Ihre Bestellung wurde zugestellt. Viel Freude damit!",
  cancelled: "Ihre Bestellung wurde storniert.",
  refunded: "Ihre Bestellung wurde erstattet.",
};

/** Statuses the customer should be emailed about; internal ones stay silent. */
export const NOTIFY_ON: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  "paid",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

/** Known carriers and how to build a tracking link from a number. */
const CARRIER_URLS: Record<string, (number: string) => string> = {
  DHL: (n) => `https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=${encodeURIComponent(n)}`,
  DPD: (n) => `https://tracking.dpd.de/status/de_DE/parcel/${encodeURIComponent(n)}`,
  GLS: (n) => `https://gls-group.com/DE/de/paketverfolgung?match=${encodeURIComponent(n)}`,
  Hermes: (n) => `https://www.myhermes.de/empfangen/sendungsverfolgung/sendungsinformation/#${encodeURIComponent(n)}`,
  UPS: (n) => `https://www.ups.com/track?loc=de_DE&tracknum=${encodeURIComponent(n)}`,
};

export const KNOWN_CARRIERS = Object.keys(CARRIER_URLS);

/** A tracking URL for a known carrier, or null (e.g. a forwarder without one). */
export function trackingUrl(carrier: string | null, number: string | null): string | null {
  if (!carrier || !number) return null;
  const build = CARRIER_URLS[carrier];
  return build ? build(number) : null;
}

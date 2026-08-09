/**
 * Browser-side access to the delivery check.
 *
 * One place defines the request and response shape so the postcode field, the
 * cart summary and the checkout cannot drift apart.
 */

import type { ShippingQuote, DeliveryZone } from "./rates";

export interface DeliveryPlace {
  postcode: string;
  city: string;
  stateCode: string;
  state: string;
}

export type DeliveryCheck =
  | {
      ok: true;
      place: DeliveryPlace;
      zone: DeliveryZone;
      zoneLabel: string;
      shipping: ShippingQuote;
      shippingLabel: string;
      freeFromCents: number;
    }
  | { ok: false; reason: "format" | "unknown" | "network"; message: string };

export async function checkDelivery(
  postcode: string,
  { subtotalCents = 0, kinds = [] }: { subtotalCents?: number; kinds?: string[] } = {},
  signal?: AbortSignal,
): Promise<DeliveryCheck> {
  try {
    const response = await fetch("/api/lieferung", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ postcode, subtotalCents, kinds }),
      signal,
    });
    if (!response.ok) {
      return {
        ok: false,
        reason: "network",
        message: "Die Prüfung ist fehlgeschlagen. Bitte versuchen Sie es erneut.",
      };
    }
    return (await response.json()) as DeliveryCheck;
  } catch (error) {
    // An aborted request is a newer keystroke, not a failure: let the caller
    // ignore it rather than flash an error.
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return {
      ok: false,
      reason: "network",
      message: "Die Prüfung ist fehlgeschlagen. Bitte versuchen Sie es erneut.",
    };
  }
}

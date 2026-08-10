import { NextResponse } from "next/server";
import { z } from "zod";
import { lookupPostcode } from "@/lib/shipping/postcodes";
import { zoneForPostcode, ZONE_LABEL } from "@/lib/shipping/zones";
import {
  FREE_SHIPPING_FROM_CENTS,
  quoteShipping,
  SHIPPING_CLASS_LABEL,
} from "@/lib/shipping/rates";

/**
 * Confirm a delivery address and price its shipment.
 *
 * The postcode table is 330 kB and stays on the server, so the browser asks
 * here rather than shipping the data to every visitor. The answer carries the
 * town it resolved to, which is what lets the checkout tell a typo ("10015")
 * from a real address.
 */

const bodySchema = z.object({
  postcode: z.string().trim().min(1),
  subtotalCents: z.number().int().nonnegative().default(0),
  kinds: z.array(z.string()).default([]),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { postcode, subtotalCents, kinds } = parsed.data;

  if (!/^\d{5}$/.test(postcode)) {
    return NextResponse.json(
      { ok: false, reason: "format", message: "Bitte geben Sie eine 5-stellige Postleitzahl ein." },
      { status: 200 },
    );
  }

  const place = lookupPostcode(postcode);

  const zone = zoneForPostcode(postcode);
  const quote = quoteShipping({ subtotalCents, kinds, zone });

  // A postcode missing from the German directory no longer blocks the order:
  // the checkout is allowed to continue and prices the shipment with the
  // standard mainland tariff, telling the customer it used a fallback. The
  // reply still carries the quote so the summary never shows an empty figure.
  if (!place) {
    return NextResponse.json(
      {
        ok: false,
        reason: "unknown",
        message: `${postcode} wurde nicht im deutschen Postleitzahlenverzeichnis gefunden — der Standardversand wird berechnet.`,
        zone,
        zoneLabel: ZONE_LABEL[zone],
        shipping: quote,
        shippingLabel: SHIPPING_CLASS_LABEL[quote.shippingClass],
        freeFromCents: FREE_SHIPPING_FROM_CENTS,
      },
      { status: 200 },
    );
  }

  return NextResponse.json({
    ok: true,
    place,
    zone,
    zoneLabel: ZONE_LABEL[zone],
    shipping: quote,
    shippingLabel: SHIPPING_CLASS_LABEL[quote.shippingClass],
    freeFromCents: FREE_SHIPPING_FROM_CENTS,
  });
}

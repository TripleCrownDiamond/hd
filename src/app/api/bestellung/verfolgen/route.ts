import { NextResponse } from "next/server";
import { z } from "zod";
import { getMigrationAwareServiceSupabase } from "@/lib/db/server";
import { STATUS_LABEL, type OrderStatus } from "@/lib/orders/status";

/**
 * Look up an order for the customer tracking page.
 *
 * Guest orders have no account, so RLS cannot scope them to a user. The order
 * number plus the email is the shared secret: both must match, and only then is
 * a minimal, non-sensitive view returned. The lookup runs with the service
 * client because the public role cannot read guest orders, but the match on
 * both fields is what authorises the read.
 */

const schema = z.object({
  orderNumber: z.string().trim().min(3).max(40),
  email: z.string().trim().email(),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Bitte Bestellnummer und E-Mail angeben." }, { status: 200 });
  }

  const { orderNumber, email } = parsed.data;
  const supabase = getMigrationAwareServiceSupabase();
  const { data } = await supabase
    .from("orders")
    .select("order_number,customer_email,status,tracking_carrier,tracking_number,tracking_url,shipped_at,delivered_at,created_at,total_cents")
    .eq("order_number", orderNumber)
    .maybeSingle();

  // One generic answer whether the number is unknown or the email does not
  // match, so the endpoint cannot be used to probe which orders exist.
  if (!data || (data.customer_email as string).toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({
      ok: false,
      message: "Keine Bestellung mit dieser Nummer und E-Mail gefunden.",
    });
  }

  const status = data.status as OrderStatus;
  return NextResponse.json({
    ok: true,
    order: {
      orderNumber: data.order_number,
      status,
      statusLabel: STATUS_LABEL[status] ?? status,
      createdAt: data.created_at,
      shippedAt: data.shipped_at,
      deliveredAt: data.delivered_at,
      totalCents: data.total_cents,
      tracking:
        data.tracking_carrier && data.tracking_number
          ? {
              carrier: data.tracking_carrier as string,
              number: data.tracking_number as string,
              url: (data.tracking_url as string | null) ?? null,
            }
          : null,
    },
  });
}

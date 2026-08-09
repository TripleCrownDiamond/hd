import { NextResponse } from "next/server";
import { placeOrder, placeOrderSchema, OrderError } from "@/lib/payments/orders";

/**
 * Place an order.
 *
 * Everything that decides the price — line prices, shipping, the payable total
 * and the available payment methods — is recomputed on the server from the
 * database inside `placeOrder`, so the request body only supplies intent, never
 * amounts.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const parsed = placeOrderSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const order = await placeOrder(parsed.data);
    return NextResponse.json({ ok: true, order });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    console.error("placeOrder failed", error);
    return NextResponse.json(
      { ok: false, message: "Unerwarteter Fehler bei der Bestellung." },
      { status: 500 },
    );
  }
}

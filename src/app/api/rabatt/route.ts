import { NextResponse } from "next/server";
import { z } from "zod";
import { PromotionError, quotePromotionForCart } from "@/lib/promotions/server";

const schema = z.object({ code: z.string().trim().min(2).max(64), items: z.array(z.object({ slug: z.string().min(1), quantity: z.number().int().positive().max(999) })).min(1) });

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const result = await quotePromotionForCart(input.code, input.items);
    return NextResponse.json({ ok: true, code: result.code, discountCents: result.discountCents });
  } catch (error) {
    if (error instanceof PromotionError) return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    return NextResponse.json({ ok: false, message: "Der Rabattcode konnte nicht geprüft werden." }, { status: 400 });
  }
}

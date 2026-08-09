import { NextResponse } from "next/server";
import { z } from "zod";
import { saveRecoverableCart } from "@/lib/cart/recovery";

const schema = z.object({ consent: z.literal(true), sessionToken: z.string().min(24).max(200), email: z.string().email(), name: z.string().max(160).optional(), subtotalCents: z.number().int().nonnegative(), promotionCode: z.string().max(64).nullable().optional(), items: z.array(z.object({ slug: z.string().min(1), name: z.string().min(1).max(300), quantity: z.number().int().positive(), priceCents: z.number().int().nonnegative(), image: z.string().optional(), imageKind: z.string() })).min(1).max(100) });
export async function POST(request: Request) { try { const input = schema.parse(await request.json()); return NextResponse.json({ ok: true, ...(await saveRecoverableCart(input)) }); } catch { return NextResponse.json({ ok: false }, { status: 400 }); } }

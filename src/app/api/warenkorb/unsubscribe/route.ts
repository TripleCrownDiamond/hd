import { NextResponse } from "next/server";
import { getMigrationAwareServiceSupabase } from "@/lib/db/server";
import { verifyRecovery } from "@/lib/cart/recovery";
export async function GET(request: Request) { const id = verifyRecovery(new URL(request.url).searchParams.get("token") ?? ""); if (!id) return new NextResponse("Ungültiger Link", { status: 400 }); const supabase = getMigrationAwareServiceSupabase(); await supabase.from("abandoned_carts").update({ status: "unsubscribed", next_reminder_at: null }).eq("id", id); return NextResponse.redirect(new URL("/warenkorb?reminders=off", request.url)); }

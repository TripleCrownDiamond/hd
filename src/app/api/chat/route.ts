import { NextResponse } from "next/server";
import { z } from "zod";
import { answerChat } from "@/lib/chat/server";

const schema = z.object({ sessionToken: z.string().min(24).max(200), message: z.string().trim().min(2).max(1200), path: z.string().max(300).default("/") });
const attempts = new Map<string, { count: number; reset: number }>();

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json()); const key = input.sessionToken.slice(0, 32); const now = Date.now(); const current = attempts.get(key);
    if (current && current.reset > now && current.count >= 12) return NextResponse.json({ ok: false, message: "Bitte warten Sie einen Moment, bevor Sie weitere Nachrichten senden." }, { status: 429 });
    attempts.set(key, !current || current.reset <= now ? { count: 1, reset: now + 60_000 } : { ...current, count: current.count + 1 });
    return NextResponse.json({ ok: true, ...(await answerChat(input)) });
  } catch { return NextResponse.json({ ok: false, message: "Der Assistent ist gerade nicht erreichbar. Bitte versuchen Sie es später erneut." }, { status: 500 }); }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getMigrationAwarePublicSupabase } from "@/lib/db/server";

const schema = z.object({
  email: z.string().trim().email().max(320),
  consent: z.literal(true),
  source: z.enum(["home", "footer"]).default("footer"),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Bitte prüfen Sie E-Mail-Adresse und Einwilligung." }, { status: 400 });

  const { error } = await getMigrationAwarePublicSupabase().from("newsletter_subscribers").insert({
    email: parsed.data.email.toLowerCase(), status: "pending", source: parsed.data.source,
    consent_at: new Date().toISOString(),
  });
  // A duplicate must not reveal whether an address is already registered.
  if (error && error.code !== "23505") return NextResponse.json({ message: "Die Anmeldung konnte nicht gespeichert werden. Bitte versuchen Sie es später erneut." }, { status: 503 });
  return NextResponse.json({ message: "Ihre Anmeldung wurde gespeichert. Die Freischaltung erfolgt erst nach Bestätigung." });
}

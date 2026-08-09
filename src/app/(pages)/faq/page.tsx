import type { Metadata } from "next";
import { getMigrationAwarePublicSupabase } from "@/lib/db/server";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Häufige Fragen", description: "Antworten zu Produkten, Bestellung, Lieferung und Service." };

export default async function FaqPage() {
  const { data } = await getMigrationAwarePublicSupabase().from("faq_entries").select("id,question,answer,category").eq("status", "published").order("category").order("position");
  const groups = new Map<string, typeof data>(); for (const row of data ?? []) groups.set(row.category, [...(groups.get(row.category) ?? []), row]);
  return <div className="container-site py-12 md:py-16"><header className="max-w-3xl"><p className="eyebrow">Hilfe & Service</p><h1 className="mt-3 font-display text-4xl font-semibold">Häufige Fragen</h1><p className="text-muted mt-4">Geprüfte Antworten zu Sortiment, Lieferung, Zahlung und Bestellung.</p></header>
    {groups.size === 0 ? <Card className="mt-10"><CardContent className="py-10 text-center text-muted">Zurzeit sind keine FAQ-Einträge veröffentlicht. Nutzen Sie bitte unsere Kontaktseite.</CardContent></Card> : <div className="mt-10 space-y-10">{[...groups].map(([category, entries]) => <section key={category}><h2 className="font-display text-2xl font-semibold">{category}</h2><div className="mt-4 divide-y rounded-xl border">{entries?.map((entry) => <details key={entry.id} className="group p-5"><summary className="cursor-pointer list-none pr-8 font-semibold">{entry.question}</summary><div className="text-muted mt-3 whitespace-pre-line text-sm leading-7">{entry.answer}</div></details>)}</div></section>)}</div>}
  </div>;
}

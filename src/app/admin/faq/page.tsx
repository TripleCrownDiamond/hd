import { Archive, MessageCircleQuestion } from "lucide-react";
import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { AdminHeader, EmptyAdmin, Field, fieldClass, areaClass } from "@/components/admin/admin-ui";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { archiveFaq, saveFaq } from "../actions";

function FaqForm({ entry, products }: { entry?: Record<string, unknown>; products: { id: string; model: string }[] }) {
  return <form action={saveFaq} className="grid gap-4 md:grid-cols-2">{entry?.id ? <input type="hidden" name="id" value={String(entry.id)} /> : null}
    <Field label="Frage"><input className={fieldClass} name="question" required defaultValue={String(entry?.question ?? "")} /></Field>
    <Field label="Kategorie"><input className={fieldClass} name="category" required defaultValue={String(entry?.category ?? "Allgemein")} /></Field>
    <Field label="Produkt (optional)"><select className={fieldClass} name="product_id" defaultValue={String(entry?.product_id ?? "")}><option value="">Allgemein</option>{products.map((p) => <option key={p.id} value={p.id}>{p.model}</option>)}</select></Field>
    <Field label="Status"><select className={fieldClass} name="status" defaultValue={String(entry?.status ?? "draft")}><option value="draft">Entwurf</option><option value="published">Veröffentlicht</option><option value="archived">Archiviert</option></select></Field>
    <Field label="Position"><input className={fieldClass} name="position" type="number" min="0" defaultValue={Number(entry?.position ?? 0)} /></Field>
    <div className="md:col-span-2"><Field label="Antwort"><textarea className={`${areaClass} min-h-40`} name="answer" required defaultValue={String(entry?.answer ?? "")} /></Field></div>
    <div className="md:col-span-2"><Button><MessageCircleQuestion className="size-4" />Speichern</Button></div>
  </form>;
}

export default async function FaqAdminPage() {
  const supabase = await getMigrationAwareServerSupabase(); const [{ data: entries }, { data: products }] = await Promise.all([supabase.from("faq_entries").select("*").order("position"), supabase.from("products").select("id,model").eq("is_published", true).order("model")]);
  const p = (products ?? []) as { id: string; model: string }[];
  return <div className="space-y-8"><AdminHeader eyebrow="Wissen" title="FAQ & Chat-Wissensbasis" description="Nur veröffentlichte Antworten werden im Store und als belegter Kontext für den Assistenten verwendet." />
    <Card><CardContent className="pt-6"><details><summary className="cursor-pointer font-semibold">Neue Frage</summary><div className="mt-6"><FaqForm products={p} /></div></details></CardContent></Card>
    {!entries?.length ? <EmptyAdmin>Noch keine FAQ-Einträge.</EmptyAdmin> : entries.map((entry) => <Card key={entry.id}><CardContent className="pt-6"><details><summary className="flex cursor-pointer justify-between gap-4"><strong>{entry.question}</strong><span className="text-muted text-sm">{entry.category} · {entry.status}</span></summary><div className="mt-6"><FaqForm entry={entry} products={p} /><form action={archiveFaq} className="mt-4"><input type="hidden" name="id" value={entry.id} /><Button variant="destructive" size="sm"><Archive className="size-4" />Archivieren</Button></form></div></details></CardContent></Card>)}</div>;
}

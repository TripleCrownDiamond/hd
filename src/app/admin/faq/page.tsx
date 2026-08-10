import { Archive, MessageCircleQuestion } from "lucide-react";
import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { AdminHeader, EmptyAdmin, Field, fieldClass, areaClass } from "@/components/admin/admin-ui";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { archiveFaq, saveFaq } from "../actions";

function FaqForm({ entry, products }: { entry?: Record<string, unknown>; products: { id: string; model: string }[] }) {
  return <form action={saveFaq} className="grid gap-4 md:grid-cols-2">{entry?.id ? <input type="hidden" name="id" value={String(entry.id)} /> : null}
    <Field label="Question"><input className={fieldClass} name="question" required defaultValue={String(entry?.question ?? "")} /></Field>
    <Field label="Catégorie"><input className={fieldClass} name="category" required defaultValue={String(entry?.category ?? "Général")} /></Field>
    <Field label="Produit (facultatif)"><select className={fieldClass} name="product_id" defaultValue={String(entry?.product_id ?? "")}><option value="">Général</option>{products.map((p) => <option key={p.id} value={p.id}>{p.model}</option>)}</select></Field>
    <Field label="Statut"><select className={fieldClass} name="status" defaultValue={String(entry?.status ?? "draft")}><option value="draft">Brouillon</option><option value="published">Publié</option><option value="archived">Archivé</option></select></Field>
    <Field label="Position"><input className={fieldClass} name="position" type="number" min="0" defaultValue={Number(entry?.position ?? 0)} /></Field>
    <div className="md:col-span-2"><Field label="Réponse"><textarea className={`${areaClass} min-h-40`} name="answer" required defaultValue={String(entry?.answer ?? "")} /></Field></div>
    <div className="md:col-span-2"><Button><MessageCircleQuestion className="size-4" />Enregistrer</Button></div>
  </form>;
}

export default async function FaqAdminPage() {
  const supabase = await getMigrationAwareServerSupabase(); const [{ data: entries }, { data: products }] = await Promise.all([supabase.from("faq_entries").select("*").order("position"), supabase.from("products").select("id,model").eq("is_published", true).order("model")]);
  const p = (products ?? []) as { id: string; model: string }[];
  return <div className="space-y-8"><AdminHeader eyebrow="Connaissances" title="FAQ & base de connaissances du chat" description="Seules les réponses publiées sont utilisées dans la boutique et comme contexte sourcé pour l'assistant." />
    <Card><CardContent className="pt-6"><details><summary className="cursor-pointer font-semibold">Nouvelle question</summary><div className="mt-6"><FaqForm products={p} /></div></details></CardContent></Card>
    {!entries?.length ? <EmptyAdmin>Aucune entrée FAQ pour le moment.</EmptyAdmin> : entries.map((entry) => <Card key={entry.id}><CardContent className="pt-6"><details><summary className="flex cursor-pointer justify-between gap-4"><strong className="min-w-0">{entry.question}</strong><span className="text-muted shrink-0 text-sm">{entry.category} · {entry.status}</span></summary><div className="mt-6"><FaqForm entry={entry} products={p} /><form action={archiveFaq} className="mt-4"><input type="hidden" name="id" value={entry.id} /><Button variant="destructive" size="sm"><Archive className="size-4" />Archiver</Button></form></div></details></CardContent></Card>)}</div>;
}

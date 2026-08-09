import Link from "next/link";
import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { AdminHeader, EmptyAdmin, Field, fieldClass } from "@/components/admin/admin-ui";
import { ContentEditor } from "@/components/admin/content-editor";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveContent } from "../actions";

export default async function ContentAdminPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const supabase = await getMigrationAwareServerSupabase();
  const [{ data: entries }, { data: selected }] = await Promise.all([
    supabase.from("content_entries").select("*").order("updated_at", { ascending: false }).limit(100),
    edit ? supabase.from("content_entries").select("*").eq("id", edit).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return <div className="space-y-8"><AdminHeader eyebrow="CMS" title="Seiten & Artikel" description="Rich Text, Markdown oder HTML bearbeiten und vor der Veröffentlichung in einer isolierten Vorschau prüfen." />
    <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]"><Card><CardContent className="pt-6"><Button asChild fullWidth><Link href="/admin/inhalte">Neuer Inhalt</Link></Button><div className="mt-4 space-y-1">{!entries?.length ? <p className="text-muted text-sm">Noch keine Inhalte.</p> : entries.map((entry) => <Link key={entry.id} href={`/admin/inhalte?edit=${entry.id}`} className="hover:bg-elevated block rounded-md p-3"><span className="block text-sm font-medium">{entry.title}</span><span className="text-muted text-xs">{entry.kind} · {entry.status}</span></Link>)}</div></CardContent></Card>
      <Card><CardContent className="pt-6"><form action={saveContent} className="space-y-5">{selected ? <input type="hidden" name="id" value={selected.id} /> : null}<div className="grid gap-4 md:grid-cols-2"><Field label="Titel"><input name="title" required defaultValue={selected?.title ?? ""} className={fieldClass} /></Field><Field label="Slug"><input name="slug" required defaultValue={selected?.slug ?? ""} className={fieldClass} /></Field><Field label="Inhaltstyp"><select name="kind" defaultValue={selected?.kind ?? "page"} className={fieldClass}><option value="page">Seite</option><option value="article">Artikel</option><option value="legal">Rechtstext</option></select></Field><Field label="Status"><select name="status" defaultValue={selected?.status ?? "draft"} className={fieldClass}><option value="draft">Entwurf</option><option value="review">In Prüfung</option><option value="published">Veröffentlicht</option><option value="archived">Archiviert</option></select></Field><Field label="SEO-Titel"><input name="seo_title" defaultValue={selected?.seo_title ?? ""} className={fieldClass} /></Field><Field label="SEO-Beschreibung"><input name="seo_description" defaultValue={selected?.seo_description ?? ""} className={fieldClass} /></Field></div><input type="hidden" name="excerpt" value={selected?.excerpt ?? ""} /><ContentEditor initialBody={selected?.body} initialFormat={selected?.format} /><Button type="submit">Inhalt speichern</Button></form></CardContent></Card>
    </div>{entries === null ? <EmptyAdmin>CMS-Migration noch nicht angewendet oder keine Berechtigung.</EmptyAdmin> : null}</div>;
}

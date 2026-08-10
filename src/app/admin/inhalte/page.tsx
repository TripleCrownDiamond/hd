import Link from "next/link";
import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { AdminHeader, EmptyAdmin, Field, fieldClass } from "@/components/admin/admin-ui";
import { ContentEditor } from "@/components/admin/content-editor";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AVAILABLE_SHORTCODES } from "@/lib/content/shortcodes";
import { LEGAL_DEFAULTS } from "@/lib/legal/defaults";
import { saveContent, seedLegalContent } from "../actions";

const CONTENT_KINDS: Array<[string, string]> = [
  ["page", "Page"],
  ["article", "Article"],
  ["legal", "Texte juridique"],
];
const CONTENT_STATUSES: Array<[string, string]> = [
  ["draft", "Brouillon"],
  ["review", "En révision"],
  ["published", "Publié"],
  ["archived", "Archivé"],
];

export default async function ContentAdminPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const supabase = await getMigrationAwareServerSupabase();
  const [{ data: entries }, { data: selected }] = await Promise.all([
    supabase.from("content_entries").select("*").order("updated_at", { ascending: false }).limit(100),
    edit ? supabase.from("content_entries").select("*").eq("id", edit).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  // Which shipped texts are not yet editable entries.
  const present = new Set((entries ?? []).map((entry) => String(entry.slug).toLowerCase()));
  const notSeeded = LEGAL_DEFAULTS.filter((entry) => !present.has(entry.slug));

  return <div className="space-y-8"><AdminHeader eyebrow="CMS" title="Pages & Articles" description="Modifier en Rich Text, Markdown ou HTML et prévisualiser dans un environnement isolé avant publication." />
    {notSeeded.length > 0 ? <Card><CardContent className="pt-6">
      <h2 className="text-text font-display text-lg font-semibold">Reprendre les textes juridiques dans le CMS</h2>
      <p className="text-muted mt-2 max-w-3xl text-sm">Ces {notSeeded.length} pages sont actuellement servies depuis le code et ne sont pas modifiables ici. En les reprenant, elles sont créées en <strong>brouillon</strong> — rien ne part en ligne sans vérification. Les slugs existants restent intacts.</p>
      <p className="text-muted mt-2 font-mono text-xs">{notSeeded.map((entry) => entry.slug).join(" · ")}</p>
      <form action={seedLegalContent} className="mt-4"><Button type="submit">Créer comme brouillons</Button></form>
    </CardContent></Card> : null}
    <Card><CardContent className="pt-6">
      <h2 className="text-text font-display text-lg font-semibold">Placeholders</h2>
      <p className="text-muted mt-2 max-w-3xl text-sm">Ne jamais retaper les données de l’entreprise, le compte bancaire ou les frais de port : ces placeholders sont remplis depuis les réglages à l’affichage, de sorte qu’une modification s’applique partout en même temps.</p>
      <p className="text-muted mt-2 font-mono text-xs leading-relaxed">{AVAILABLE_SHORTCODES.map((code) => `[${code}]`).join(" ")}</p>
    </CardContent></Card>
    <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]"><Card><CardContent className="pt-6"><Button asChild fullWidth><Link href="/admin/inhalte">Nouveau contenu</Link></Button><div className="mt-4 space-y-1">{!entries?.length ? <p className="text-muted text-sm">Aucun contenu pour le moment.</p> : entries.map((entry) => <Link key={entry.id} href={`/admin/inhalte?edit=${entry.id}`} className="hover:bg-elevated block rounded-md p-3"><span className="block text-sm font-medium">{entry.title}</span><span className="text-muted text-xs">{entry.kind} · {entry.status}</span></Link>)}</div></CardContent></Card>
      <Card><CardContent className="pt-6"><form action={saveContent} className="space-y-5">{selected ? <input type="hidden" name="id" value={selected.id} /> : null}<div className="grid gap-4 md:grid-cols-2"><Field label="Titre"><input name="title" required defaultValue={selected?.title ?? ""} className={fieldClass} /></Field><Field label="Slug"><input name="slug" required defaultValue={selected?.slug ?? ""} className={fieldClass} /></Field><Field label="Type de contenu"><select name="kind" defaultValue={selected?.kind ?? "page"} className={fieldClass}>{CONTENT_KINDS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Statut"><select name="status" defaultValue={selected?.status ?? "draft"} className={fieldClass}>{CONTENT_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Titre SEO"><input name="seo_title" defaultValue={selected?.seo_title ?? ""} className={fieldClass} /></Field><Field label="Description SEO"><input name="seo_description" defaultValue={selected?.seo_description ?? ""} className={fieldClass} /></Field></div><input type="hidden" name="excerpt" value={selected?.excerpt ?? ""} /><ContentEditor initialBody={selected?.body} initialFormat={selected?.format} /><Button type="submit">Enregistrer le contenu</Button></form></CardContent></Card>
    </div>{entries === null ? <EmptyAdmin>Migration CMS non appliquée ou accès non autorisé.</EmptyAdmin> : null}</div>;
}

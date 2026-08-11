import Link from "next/link";
import { Pencil, Plus, Archive, Search } from "lucide-react";
import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminHeader, EmptyAdmin, Field, fieldClass, areaClass } from "@/components/admin/admin-ui";
import { GrundpreisFields } from "@/components/admin/grundpreis-fields";
import type { BasePriceUnit, QuantityUnit } from "@/lib/utils";
import { archiveProduct, saveProduct } from "../actions";

/**
 * The catalogue is ~2 700 products. A flat `.limit(100)` silently hid 96 % of
 * them with nothing on screen to say so — an admin looking for a product simply
 * concluded it had not been imported. Everything is reachable now: a filter
 * narrows the set server-side, and the pager walks whatever is left.
 */
const PAGE_SIZE = 100;

const KINDS = [
  ["wood", "Bois de chauffage"], ["log", "Grumes & bois au mètre"], ["kindling", "Allume-feu"],
  ["pellet", "Granulés"], ["briquette", "Briquettes"], ["coal", "Charbon"],
  ["stove", "Poêle à bois"], ["accessory", "Accessoires"],
] as const;

const STATUSES = [
  ["pending", "En attente"], ["approved", "Approuvé"],
  ["rejected", "Rejeté"], ["superseded", "Archivé"],
] as const;

function ProductForm({ product }: { product?: Record<string, unknown> }) {
  return <form action={saveProduct} className="grid gap-4 md:grid-cols-2">
    {product?.id ? <input type="hidden" name="id" value={String(product.id)} /> : null}
    <Field label="Slug"><input name="slug" required defaultValue={String(product?.slug ?? "")} className={fieldClass} /></Field>
    <Field label="Nom du produit / modèle"><input name="model" required defaultValue={String(product?.model ?? "")} className={fieldClass} /></Field>
    <Field label="Type"><select name="kind" defaultValue={String(product?.kind ?? "wood")} className={fieldClass}>{KINDS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
    <GrundpreisFields
      priceCents={product?.price_cents_public == null ? null : Number(product.price_cents_public)}
      quantityAmount={product?.quantity_amount == null ? null : Number(product.quantity_amount)}
      quantityUnit={(product?.quantity_unit as QuantityUnit | undefined) ?? null}
      basePriceUnit={(product?.base_price_unit as BasePriceUnit | undefined) ?? null}
    />
    <Field label="Sous-titre"><input name="subtitle" defaultValue={String(product?.subtitle ?? "")} className={fieldClass} /></Field>
    <Field label="Statut de validation"><select name="review_status" defaultValue={String(product?.review_status ?? "pending")} className={fieldClass}>{STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
    <label className="text-text flex items-center gap-2 text-sm"><input type="checkbox" name="is_published" defaultChecked={Boolean(product?.is_published)} /> Publier dans la boutique</label>
    <Field label="Description courte"><textarea name="short_description" defaultValue={String(product?.short_description ?? "")} className={areaClass} /></Field>
    <div className="md:col-span-2"><Button type="submit"><Pencil className="size-4" />{product ? "Enregistrer les modifications" : "Créer le produit"}</Button></div>
  </form>;
}

/** Keeps the active filter while moving between pages. */
function pageHref(params: { q: string; kind: string; status: string }, page: number): string {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.kind) query.set("kind", params.kind);
  if (params.status) query.set("status", params.status);
  if (page > 1) query.set("page", String(page));
  const suffix = query.toString();
  return suffix ? `/admin/produkte?${suffix}` : "/admin/produkte";
}

export default async function ProductsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  };
  const q = one("q");
  const kind = KINDS.some(([value]) => value === one("kind")) ? one("kind") : "";
  const status = STATUSES.some(([value]) => value === one("status")) ? one("status") : "";
  const page = Math.max(1, Number.parseInt(one("page"), 10) || 1);

  const supabase = await getMigrationAwareServerSupabase();
  let query = supabase
    .from("products")
    .select(
      "id,slug,model,kind,subtitle,short_description,price_cents_public,quantity_amount,quantity_unit,base_price_unit,review_status,is_published,updated_at",
      { count: "exact" },
    )
    .order("updated_at", { ascending: false });
  // `or` with two ilike patterns lets one box search both the display name and
  // the slug, which is what an admin actually has to hand.
  if (q) query = query.or(`model.ilike.%${q}%,slug.ilike.%${q}%`);
  if (kind) query = query.eq("kind", kind);
  if (status) query = query.eq("review_status", status);

  const { data: products, count } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const total = count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return <div className="space-y-8"><AdminHeader eyebrow="Catalogue" title="Produits" description="Créer, modifier, publier ou archiver des produits avec traçabilité complète." />
    <Card><CardContent className="pt-6"><details><summary className="text-text flex cursor-pointer items-center gap-2 font-semibold"><Plus className="size-4" />Nouveau produit</summary><div className="mt-6"><ProductForm /></div></details></CardContent></Card>

    <Card><CardContent className="pt-6"><form className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
      <Field label="Rechercher"><input name="q" defaultValue={q} placeholder="Nom du modèle ou slug" className={fieldClass} /></Field>
      <Field label="Type"><select name="kind" defaultValue={kind} className={fieldClass}><option value="">Tous les types</option>{KINDS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      <Field label="Statut"><select name="status" defaultValue={status} className={fieldClass}><option value="">Tous les statuts</option>{STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      <Button type="submit"><Search className="size-4" />Filtrer</Button>
    </form></CardContent></Card>

    <p className="text-muted text-sm" role="status">{total === 0 ? "Aucun produit ne correspond." : <>{from}–{to} sur <strong className="text-text">{total}</strong> produits{q || kind || status ? " (filtrés)" : ""}</>}</p>

    {!products?.length ? <EmptyAdmin>Aucun produit ou accès non autorisé.</EmptyAdmin> : <div className="space-y-3">{products.map((product) => <Card key={product.id}><CardContent className="pt-6"><details><summary className="flex cursor-pointer items-center justify-between gap-4"><span className="min-w-0"><strong className="text-text">{product.model}</strong><span className="text-muted ml-2 font-mono text-xs">{product.kind} · {product.review_status}</span></span><span className="text-muted shrink-0 text-xs">{product.is_published ? "En ligne" : "Hors ligne"}</span></summary><div className="mt-6"><ProductForm product={product} /><form action={archiveProduct} className="mt-4 border-t pt-4"><input type="hidden" name="id" value={product.id} /><Button variant="destructive" size="sm"><Archive className="size-4" />Archiver</Button></form></div></details></CardContent></Card>)}</div>}

    {lastPage > 1 && <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
      {page > 1 ? <Button asChild variant="secondary"><Link href={pageHref({ q, kind, status }, page - 1)}>Précédent</Link></Button> : <span />}
      <span className="text-muted text-sm">Page {page} sur {lastPage}</span>
      {page < lastPage ? <Button asChild variant="secondary"><Link href={pageHref({ q, kind, status }, page + 1)}>Suivant</Link></Button> : <span />}
    </nav>}
  </div>;
}

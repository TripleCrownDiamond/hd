import Link from "next/link";
import Image from "next/image";
import { ImageOff, Pencil, Plus } from "lucide-react";
import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminHeader, EmptyAdmin, Field, fieldClass, areaClass } from "@/components/admin/admin-ui";
import { AdminNotice, readFeedback } from "@/components/admin/admin-notice";
import { GrundpreisFields } from "@/components/admin/grundpreis-fields";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { BulkActionsBar } from "@/components/admin/bulk-actions-bar";
import { SearchField } from "@/components/admin/search-field";
import { FilterSelect } from "@/components/admin/filter-select";
import { media } from "@/lib/media";
import { formatPrice, type BasePriceUnit, type QuantityUnit } from "@/lib/utils";
import { saveProduct } from "../actions";

/**
 * The catalogue is ~2 700 products. A flat `.limit(100)` silently hid 96 % of
 * them with nothing on screen to say so — an admin looking for a product simply
 * concluded it had not been imported. Everything is reachable now: a filter
 * narrows the set server-side, and the pager walks whatever is left.
 */
const PAGE_SIZE = 100;

/** Thumbnail edge in CSS pixels; requested from the CDN at 2x for retina. */
const THUMB = 56;

const KINDS = [
  ["wood", "Bois de chauffage"], ["log", "Grumes & bois au mètre"], ["kindling", "Allume-feu"],
  ["pellet", "Granulés"], ["briquette", "Briquettes"], ["coal", "Charbon"],
  ["stove", "Poêle à bois"], ["accessory", "Accessoires"],
] as const;

const STATUSES = [
  ["pending", "En attente"], ["approved", "Approuvé"],
  ["rejected", "Rejeté"], ["superseded", "Archivé"],
] as const;

const PUBLISHED = [
  ["1", "En ligne"], ["0", "Hors ligne"],
] as const;

const KIND_LABEL = new Map<string, string>(KINDS.map(([value, label]) => [value, label]));

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
function pageHref(params: { q: string; kind: string; status: string; published: string }, page: number): string {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.kind) query.set("kind", params.kind);
  if (params.status) query.set("status", params.status);
  if (params.published) query.set("published", params.published);
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
  const published = PUBLISHED.some(([value]) => value === one("published")) ? one("published") : "";
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
  if (published === "1") query = query.eq("is_published", true);
  if (published === "0") query = query.eq("is_published", false);

  const { data: products, count } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const total = count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  /**
   * Hero images for this page only, in one round trip. `position: 0` is the
   * main shot — the same one the storefront card shows, so what the admin
   * recognises here is what a customer sees.
   */
  const ids = (products ?? []).map((product) => product.id as string);
  const { data: heroRows } = ids.length
    ? await supabase
        .from("product_media")
        .select("product_id,cloudinary_public_id")
        .in("product_id", ids)
        .eq("kind", "image")
        .eq("position", 0)
    : { data: [] };
  const heroById = new Map(
    (heroRows ?? []).map((row) => [row.product_id as string, row.cloudinary_public_id as string]),
  );

  const filtered = Boolean(q || kind || status || published);
  const { notice, error } = readFeedback(params);

  return <div className="space-y-8"><AdminHeader eyebrow="Catalogue" title="Produits" description="Créer, modifier, publier ou archiver des produits avec traçabilité complète." />
    <AdminNotice notice={notice} error={error} />
    <Card><CardContent className="pt-6"><details><summary className="text-text flex cursor-pointer items-center gap-2 font-semibold"><Plus className="size-4" />Nouveau produit</summary><div className="mt-6"><ProductForm /></div></details></CardContent></Card>

    <Card><CardContent className="grid gap-4 pt-6 md:grid-cols-[2fr_1fr_1fr_1fr] md:items-start">
      <SearchField label="Rechercher" placeholder="Nom du modèle ou slug…" />
      <FilterSelect name="kind" label="Type" value={kind} options={KINDS} allLabel="Tous les types" />
      <FilterSelect name="status" label="Statut" value={status} options={STATUSES} allLabel="Tous les statuts" />
      <FilterSelect name="published" label="Visibilité" value={published} options={PUBLISHED} allLabel="Tous" />
    </CardContent></Card>

    <p className="text-muted text-sm" role="status" aria-live="polite">{total === 0 ? "Aucun produit ne correspond." : <>{from}–{to} sur <strong className="text-text">{total}</strong> produits{filtered ? " (filtrés)" : ""}</>}</p>

    {!products?.length ? <EmptyAdmin>Aucun produit ou accès non autorisé.</EmptyAdmin> : <form className="space-y-2">
      <BulkActionsBar totalLabel={`${total} produits au total`} />
      {products.map((product) => {
        const heroId = heroById.get(product.id as string);
        const price = product.price_cents_public == null ? null : Number(product.price_cents_public);
        return <Card
          key={product.id}
          // Unpublished rows are tinted with the same `warning` token the badge
          // uses, instead of the raw orange-50/orange-950 pair that ignored the
          // palette and read as a different product in dark mode.
          className={product.is_published ? "" : "border-warning/40 bg-warning/5"}
        ><CardContent className="py-3">
          <div className="flex items-center gap-3">
            <input type="checkbox" name="pid" value={product.id} aria-label={`Sélectionner ${product.model}`} className="accent-accent size-4 shrink-0 cursor-pointer" />

            <Link href={`/admin/produkte/${product.id}`} tabIndex={-1} aria-hidden="true" className="border-border bg-elevated relative size-14 shrink-0 overflow-hidden rounded-md border">
              {heroId ? (
                <Image src={media(heroId, { width: THUMB * 2, height: THUMB * 2, crop: "fill" })} alt="" fill sizes={`${THUMB}px`} className="object-cover" />
              ) : (
                <span className="text-muted flex size-full items-center justify-center"><ImageOff className="size-5" /></span>
              )}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Link href={`/admin/produkte/${product.id}`} className="text-text hover:text-accent truncate font-semibold transition-colors">{product.model}</Link>
              <p className="text-muted flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                <span>{KIND_LABEL.get(String(product.kind)) ?? String(product.kind)}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{price == null ? "Sur devis" : formatPrice(price)}</span>
                {!heroId ? <><span aria-hidden="true">·</span><span className="text-warning">Sans image</span></> : null}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={product.is_published ? "success" : "warning"} className="text-xs">{product.is_published ? "En ligne" : "Hors ligne"}</Badge>
              <Button asChild size="sm" variant="secondary"><Link href={`/admin/produkte/${product.id}`}><Pencil className="size-3.5" />Modifier</Link></Button>
              <DeleteProductButton productId={product.id} productName={product.model} />
            </div>
          </div>
        </CardContent></Card>;
      })}
    </form>}

    {lastPage > 1 && <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
      {page > 1 ? <Button asChild variant="secondary"><Link href={pageHref({ q, kind, status, published }, page - 1)}>Précédent</Link></Button> : <span />}
      <span className="text-muted text-sm">Page {page} sur {lastPage}</span>
      {page < lastPage ? <Button asChild variant="secondary"><Link href={pageHref({ q, kind, status, published }, page + 1)}>Suivant</Link></Button> : <span />}
    </nav>}
  </div>;
}

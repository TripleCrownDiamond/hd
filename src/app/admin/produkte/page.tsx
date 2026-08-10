import { Pencil, Plus, Archive } from "lucide-react";
import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminHeader, EmptyAdmin, Field, fieldClass, areaClass } from "@/components/admin/admin-ui";
import { GrundpreisFields } from "@/components/admin/grundpreis-fields";
import type { BasePriceUnit, QuantityUnit } from "@/lib/utils";
import { archiveProduct, saveProduct } from "../actions";

function ProductForm({ product }: { product?: Record<string, unknown> }) {
  return <form action={saveProduct} className="grid gap-4 md:grid-cols-2">
    {product?.id ? <input type="hidden" name="id" value={String(product.id)} /> : null}
    <Field label="Slug"><input name="slug" required defaultValue={String(product?.slug ?? "")} className={fieldClass} /></Field>
    <Field label="Nom du produit / modèle"><input name="model" required defaultValue={String(product?.model ?? "")} className={fieldClass} /></Field>
    <Field label="Type"><select name="kind" defaultValue={String(product?.kind ?? "wood")} className={fieldClass}><option value="wood">Bois de chauffage</option><option value="log">Grumes & bois au mètre</option><option value="kindling">Allume-feu</option><option value="pellet">Granulés</option><option value="briquette">Briquettes</option><option value="coal">Charbon</option><option value="stove">Poêle à bois</option><option value="accessory">Accessoires</option></select></Field>
    <GrundpreisFields
      priceCents={product?.price_cents_public == null ? null : Number(product.price_cents_public)}
      quantityAmount={product?.quantity_amount == null ? null : Number(product.quantity_amount)}
      quantityUnit={(product?.quantity_unit as QuantityUnit | undefined) ?? null}
      basePriceUnit={(product?.base_price_unit as BasePriceUnit | undefined) ?? null}
    />
    <Field label="Sous-titre"><input name="subtitle" defaultValue={String(product?.subtitle ?? "")} className={fieldClass} /></Field>
    <Field label="Statut de validation"><select name="review_status" defaultValue={String(product?.review_status ?? "pending")} className={fieldClass}><option value="pending">En attente</option><option value="approved">Approuvé</option><option value="rejected">Rejeté</option><option value="superseded">Archivé</option></select></Field>
    <label className="text-text flex items-center gap-2 text-sm"><input type="checkbox" name="is_published" defaultChecked={Boolean(product?.is_published)} /> Publier dans la boutique</label>
    <Field label="Description courte"><textarea name="short_description" defaultValue={String(product?.short_description ?? "")} className={areaClass} /></Field>
    <div className="md:col-span-2"><Button type="submit"><Pencil className="size-4" />{product ? "Enregistrer les modifications" : "Créer le produit"}</Button></div>
  </form>;
}

export default async function ProductsAdminPage() {
  const supabase = await getMigrationAwareServerSupabase();
  const { data: products } = await supabase.from("products").select("id,slug,model,kind,subtitle,short_description,price_cents_public,quantity_amount,quantity_unit,base_price_unit,review_status,is_published,updated_at").order("updated_at", { ascending: false }).limit(100);
  return <div className="space-y-8"><AdminHeader eyebrow="Catalogue" title="Produits" description="Créer, modifier, publier ou archiver des produits avec traçabilité complète." />
    <Card><CardContent className="pt-6"><details><summary className="text-text flex cursor-pointer items-center gap-2 font-semibold"><Plus className="size-4" />Nouveau produit</summary><div className="mt-6"><ProductForm /></div></details></CardContent></Card>
    {!products?.length ? <EmptyAdmin>Aucun produit ou accès non autorisé.</EmptyAdmin> : <div className="space-y-3">{products.map((product) => <Card key={product.id}><CardContent className="pt-6"><details><summary className="flex cursor-pointer items-center justify-between gap-4"><span className="min-w-0"><strong className="text-text">{product.model}</strong><span className="text-muted ml-2 font-mono text-xs">{product.kind} · {product.review_status}</span></span><span className="text-muted shrink-0 text-xs">{product.is_published ? "En ligne" : "Hors ligne"}</span></summary><div className="mt-6"><ProductForm product={product} /><form action={archiveProduct} className="mt-4 border-t pt-4"><input type="hidden" name="id" value={product.id} /><Button variant="destructive" size="sm"><Archive className="size-4" />Archiver</Button></form></div></details></CardContent></Card>)}</div>}
  </div>;
}

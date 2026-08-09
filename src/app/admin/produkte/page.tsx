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
    <Field label="Produktname / Modell"><input name="model" required defaultValue={String(product?.model ?? "")} className={fieldClass} /></Field>
    <Field label="Typ"><select name="kind" defaultValue={String(product?.kind ?? "wood")} className={fieldClass}><option value="wood">Brennholz</option><option value="log">Stammholz &amp; Meterholz</option><option value="kindling">Anzündholz</option><option value="pellet">Pellets</option><option value="briquette">Briketts</option><option value="coal">Kohle</option><option value="stove">Kaminofen</option><option value="accessory">Zubehör</option></select></Field>
    <GrundpreisFields
      priceCents={product?.price_cents_public == null ? null : Number(product.price_cents_public)}
      quantityAmount={product?.quantity_amount == null ? null : Number(product.quantity_amount)}
      quantityUnit={(product?.quantity_unit as QuantityUnit | undefined) ?? null}
      basePriceUnit={(product?.base_price_unit as BasePriceUnit | undefined) ?? null}
    />
    <Field label="Untertitel"><input name="subtitle" defaultValue={String(product?.subtitle ?? "")} className={fieldClass} /></Field>
    <Field label="Prüfstatus"><select name="review_status" defaultValue={String(product?.review_status ?? "pending")} className={fieldClass}><option value="pending">Ausstehend</option><option value="approved">Freigegeben</option><option value="rejected">Abgelehnt</option><option value="superseded">Archiviert</option></select></Field>
    <label className="text-text flex items-center gap-2 text-sm"><input type="checkbox" name="is_published" defaultChecked={Boolean(product?.is_published)} /> Im Store veröffentlichen</label>
    <Field label="Kurzbeschreibung"><textarea name="short_description" defaultValue={String(product?.short_description ?? "")} className={areaClass} /></Field>
    <div className="md:col-span-2"><Button type="submit"><Pencil className="size-4" />{product ? "Änderungen speichern" : "Produkt anlegen"}</Button></div>
  </form>;
}

export default async function ProductsAdminPage() {
  const supabase = await getMigrationAwareServerSupabase();
  const { data: products } = await supabase.from("products").select("id,slug,model,kind,subtitle,short_description,price_cents_public,quantity_amount,quantity_unit,base_price_unit,review_status,is_published,updated_at").order("updated_at", { ascending: false }).limit(100);
  return <div className="space-y-8"><AdminHeader eyebrow="Katalog" title="Produkte" description="Produkte anlegen, bearbeiten, freigeben oder revisionssicher archivieren." />
    <Card><CardContent className="pt-6"><details><summary className="text-text flex cursor-pointer items-center gap-2 font-semibold"><Plus className="size-4" />Neues Produkt</summary><div className="mt-6"><ProductForm /></div></details></CardContent></Card>
    {!products?.length ? <EmptyAdmin>Keine Produkte vorhanden oder keine Berechtigung.</EmptyAdmin> : <div className="space-y-3">{products.map((product) => <Card key={product.id}><CardContent className="pt-6"><details><summary className="flex cursor-pointer items-center justify-between gap-4"><span><strong className="text-text">{product.model}</strong><span className="text-muted ml-2 font-mono text-xs">{product.kind} · {product.review_status}</span></span><span className="text-muted text-xs">{product.is_published ? "Online" : "Offline"}</span></summary><div className="mt-6"><ProductForm product={product} /><form action={archiveProduct} className="mt-4 border-t pt-4"><input type="hidden" name="id" value={product.id} /><Button variant="destructive" size="sm"><Archive className="size-4" />Archivieren</Button></form></div></details></CardContent></Card>)}</div>}
  </div>;
}

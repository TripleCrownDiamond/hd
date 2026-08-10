import { Percent, Archive } from "lucide-react";
import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { AdminHeader, EmptyAdmin, Field, fieldClass, areaClass } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { archivePromotion, savePromotion } from "../actions";

function PromotionForm({ promotion, products, categories, selectedProducts, selectedCategories }: { promotion?: Record<string, unknown>; products: { id: string; model: string }[]; categories: { id: string; name: string }[]; selectedProducts: Set<string>; selectedCategories: Set<string> }) {
  const type = String(promotion?.discount_type ?? "percentage");
  const value = Number(promotion?.discount_value ?? 1000) / (type === "percentage" ? 100 : 1);
  return <form action={savePromotion} className="grid gap-4 md:grid-cols-2">
    {promotion?.id ? <input type="hidden" name="id" value={String(promotion.id)} /> : null}
    <Field label="Code"><input className={fieldClass} name="code" required defaultValue={String(promotion?.code ?? "")} placeholder="HIVER10" /></Field>
    <Field label="Nom interne"><input className={fieldClass} name="name" required defaultValue={String(promotion?.name ?? "")} /></Field>
    <Field label="Type de remise"><select className={fieldClass} name="discount_type" defaultValue={type}><option value="percentage">Pourcentage</option><option value="fixed">Montant fixe (centimes)</option></select></Field>
    <Field label="Valeur" hint="Pourcentage (ex. 10) ou centimes"><input className={fieldClass} name="discount_value" type="number" min="0.01" step="0.01" defaultValue={value} required /></Field>
    <Field label="Périmètre"><select className={fieldClass} name="scope" defaultValue={String(promotion?.scope ?? "all")}><option value="all">Tout le catalogue</option><option value="products">Produits sélectionnés</option><option value="categories">Catégories sélectionnées</option></select></Field>
    <Field label="Montant minimum d'achat (centimes)"><input className={fieldClass} name="minimum_subtotal_cents" type="number" min="0" defaultValue={Number(promotion?.minimum_subtotal_cents ?? 0)} /></Field>
    <Field label="Remise maximale (centimes)"><input className={fieldClass} name="maximum_discount_cents" type="number" min="1" defaultValue={promotion?.maximum_discount_cents == null ? "" : Number(promotion.maximum_discount_cents)} /></Field>
    <Field label="Limite d'utilisation"><input className={fieldClass} name="usage_limit" type="number" min="1" defaultValue={promotion?.usage_limit == null ? "" : Number(promotion.usage_limit)} /></Field>
    <Field label="Début"><input className={fieldClass} name="starts_at" type="datetime-local" defaultValue={promotion?.starts_at ? String(promotion.starts_at).slice(0,16) : ""} /></Field>
    <Field label="Fin"><input className={fieldClass} name="ends_at" type="datetime-local" defaultValue={promotion?.ends_at ? String(promotion.ends_at).slice(0,16) : ""} /></Field>
    <Field label="Produits"><select className={`${fieldClass} min-h-36`} name="product_ids" multiple defaultValue={[...selectedProducts]}>{products.map((p) => <option key={p.id} value={p.id}>{p.model}</option>)}</select></Field>
    <Field label="Catégories"><select className={`${fieldClass} min-h-36`} name="category_ids" multiple defaultValue={[...selectedCategories]}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
    <Field label="Description"><textarea className={areaClass} name="description" defaultValue={String(promotion?.description ?? "")} /></Field>
    <label className="flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked={promotion ? Boolean(promotion.is_active) : true} /> Actif</label>
    <div className="md:col-span-2"><Button><Percent className="size-4" />Enregistrer la remise</Button></div>
  </form>;
}

export default async function DiscountsAdminPage() {
  const supabase = await getMigrationAwareServerSupabase();
  const [{ data: promotions }, { data: products }, { data: categories }, { data: pp }, { data: pc }] = await Promise.all([
    supabase.from("promotions").select("*").order("created_at", { ascending: false }),
    supabase.from("products").select("id,model").order("model"), supabase.from("categories").select("id,name").order("name"),
    supabase.from("promotion_products").select("promotion_id,product_id"), supabase.from("promotion_categories").select("promotion_id,category_id"),
  ]);
  const pRows = (products ?? []) as { id: string; model: string }[]; const cRows = (categories ?? []) as { id: string; name: string }[];
  const sets = (id?: unknown) => ({ products: new Set((pp ?? []).filter((x) => x.promotion_id === id).map((x) => x.product_id as string)), categories: new Set((pc ?? []).filter((x) => x.promotion_id === id).map((x) => x.category_id as string)) });
  return <div className="space-y-8"><AdminHeader eyebrow="Marketing" title="Remises & codes promo" description="Remises limitées dans le temps pour toute la boutique, des produits ou des catégories. Le calcul est vérifié côté serveur." />
    <Card><CardContent className="pt-6"><details><summary className="cursor-pointer font-semibold">Créer une remise</summary><div className="mt-6"><PromotionForm products={pRows} categories={cRows} selectedProducts={new Set()} selectedCategories={new Set()} /></div></details></CardContent></Card>
    {!promotions?.length ? <EmptyAdmin>Aucune remise pour le moment.</EmptyAdmin> : promotions.map((promotion) => { const selected = sets(promotion.id); return <Card key={promotion.id}><CardContent className="pt-6"><details><summary className="flex cursor-pointer justify-between gap-3"><strong className="min-w-0">{promotion.code} · {promotion.name}</strong><span className="text-muted shrink-0 text-sm">{promotion.is_active ? "Actif" : "Inactif"} · {promotion.times_redeemed} utilisations</span></summary><div className="mt-6"><PromotionForm promotion={promotion} products={pRows} categories={cRows} selectedProducts={selected.products} selectedCategories={selected.categories} /><form action={archivePromotion} className="mt-4"><input type="hidden" name="id" value={promotion.id} /><Button variant="destructive" size="sm"><Archive className="size-4" />Désactiver</Button></form></div></details></CardContent></Card>; })}
  </div>;
}

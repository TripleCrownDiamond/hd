import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Archive,
  ExternalLink,
} from "lucide-react";
import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AdminHeader,
  Field,
  fieldClass,
  areaClass,
} from "@/components/admin/admin-ui";
import { GrundpreisFields } from "@/components/admin/grundpreis-fields";
import { ImageUploader } from "@/components/admin/image-uploader";
import { ProductImageGallery } from "@/components/admin/product-image-gallery";
import { saveProduct, archiveProduct } from "../../actions";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import type { BasePriceUnit, QuantityUnit } from "@/lib/utils";

const KINDS: Array<[string, string]> = [
  ["wood", "Brennholz"],
  ["log", "Stammholz"],
  ["kindling", "Anzündholz"],
  ["pellet", "Holzpellets"],
  ["briquette", "Holzbriketts"],
  ["coal", "Kohle"],
  ["stove", "Kaminofen"],
  ["accessory", "Zubehör"],
];

const STATUSES: Array<[string, string]> = [
  ["pending", "Ausstehend"],
  ["approved", "Freigegeben"],
  ["rejected", "Abgelehnt"],
  ["superseded", "Archiviert"],
];

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getMigrationAwareServerSupabase();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) notFound();

  const { data: images } = await supabase
    .from("product_media")
    .select("id,cloudinary_public_id,alt_de,position,kind")
    .eq("product_id", id)
    .order("position", { ascending: true });

  const { data: variants } = await supabase
    .from("product_variants")
    .select("id,axis,code,label,surcharge_cents,position,is_active")
    .eq("product_id", id)
    .order("position", { ascending: true });

  const { data: documents } = await supabase
    .from("product_documents")
    .select("id,kind,title,language,version")
    .eq("product_id", id);

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Catalogue"
        title={product.model}
        description={`Produkt ${product.is_published ? "online" : "offline"} · ${product.review_status}`}
        actions={
          <div className="flex gap-2">
            {product.is_published && (
              <Button asChild variant="secondary" size="sm">
                <Link href={`/produkt/${product.slug}`} target="_blank">
                  <ExternalLink className="size-4" />
                  Ansehen
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {/* Status badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant={product.is_published ? "success" : "default"}>
          {product.is_published ? "Online" : "Offline"}
        </Badge>
        <Badge
          variant={
            product.review_status === "approved"
              ? "success"
              : product.review_status === "rejected"
                ? "danger"
                : "default"
          }
        >
          {STATUSES.find(([v]) => v === product.review_status)?.[1] ??
            product.review_status}
        </Badge>
        <Badge variant="default">{product.kind}</Badge>
      </div>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pencil className="size-4" />
            Produkt bearbeiten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveProduct} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="id" value={product.id} />

            <Field label="Slug" hint="URL-freundlicher Bezeichner">
              <input
                name="slug"
                required
                defaultValue={product.slug}
                className={fieldClass}
              />
            </Field>

            <Field label="Modell / Name">
              <input
                name="model"
                required
                defaultValue={product.model}
                className={fieldClass}
              />
            </Field>

            <Field label="Kategorie">
              <select name="kind" defaultValue={product.kind} className={fieldClass}>
                {KINDS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Untertitel">
              <input
                name="subtitle"
                defaultValue={product.subtitle ?? ""}
                className={fieldClass}
              />
            </Field>

            <GrundpreisFields
              priceCents={
                product.price_cents_public == null
                  ? null
                  : Number(product.price_cents_public)
              }
              quantityAmount={
                product.quantity_amount == null
                  ? null
                  : Number(product.quantity_amount)
              }
              quantityUnit={(product.quantity_unit as QuantityUnit | undefined) ?? null}
              basePriceUnit={(product.base_price_unit as BasePriceUnit | undefined) ?? null}
            />

            <Field label="Validierungsstatus">
              <select
                name="review_status"
                defaultValue={product.review_status}
                className={fieldClass}
              >
                {STATUSES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <div className="flex items-end">
              <label className="text-text flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="is_published"
                  defaultChecked={product.is_published}
                  className="accent-accent"
                />
                In der Boutique veröffentlichen
              </label>
            </div>

            <div className="md:col-span-2">
              <Field label="Kurzbeschreibung">
                <textarea
                  name="short_description"
                  defaultValue={product.short_description ?? ""}
                  className={areaClass}
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Langbeschreibung">
                <textarea
                  name="long_description"
                  defaultValue={product.long_description ?? ""}
                  className={areaClass}
                  rows={8}
                />
              </Field>
            </div>

            {/* Technical specs for stoves */}
            {product.kind === "stove" && (
              <>
                <Field label="Nennleistung (kW)">
                  <input
                    type="number"
                    step="0.1"
                    name="power_kw_nominal"
                    defaultValue={product.power_kw_nominal ?? ""}
                    className={fieldClass}
                  />
                </Field>
                <Field label="Wirkungsgrad (%)">
                  <input
                    type="number"
                    step="0.1"
                    name="efficiency_pct"
                    defaultValue={product.efficiency_pct ?? ""}
                    className={fieldClass}
                  />
                </Field>
                <Field label="Energieeffizienzklasse">
                  <input
                    name="energy_class"
                    defaultValue={product.energy_class ?? ""}
                    className={fieldClass}
                    placeholder="A+, A, B, …"
                  />
                </Field>
                <Field label="Brennstoff">
                  <input
                    name="fuel"
                    defaultValue={product.fuel ?? ""}
                    className={fieldClass}
                    placeholder="Holz, Pellets, …"
                  />
                </Field>
                <Field label="Rauchrohr Ø (mm)">
                  <input
                    type="number"
                    name="flue_diameter_mm"
                    defaultValue={product.flue_diameter_mm ?? ""}
                    className={fieldClass}
                  />
                </Field>
                <Field label="Höhe (mm)">
                  <input
                    type="number"
                    name="height_mm"
                    defaultValue={product.height_mm ?? ""}
                    className={fieldClass}
                  />
                </Field>
                <Field label="Breite (mm)">
                  <input
                    type="number"
                    name="width_mm"
                    defaultValue={product.width_mm ?? ""}
                    className={fieldClass}
                  />
                </Field>
                <Field label="Tiefe (mm)">
                  <input
                    type="number"
                    name="depth_mm"
                    defaultValue={product.depth_mm ?? ""}
                    className={fieldClass}
                  />
                </Field>
                <Field label="Gewicht (kg)">
                  <input
                    type="number"
                    step="0.1"
                    name="weight_kg"
                    defaultValue={product.weight_kg ?? ""}
                    className={fieldClass}
                  />
                </Field>
              </>
            )}

            <div className="md:col-span-2">
              <Button type="submit">
                <Pencil className="size-4" />
                Änderungen speichern
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Bilder ({images?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ImageUploader productId={product.id} />
          {images && images.length > 0 && (
            <ProductImageGallery
              productId={product.id}
              images={images}
            />
          )}
        </CardContent>
      </Card>

      {/* Variants */}
      {variants && variants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Varianten ({variants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-border border-b text-left">
                    <th className="text-muted p-2 text-xs font-semibold uppercase">Achse</th>
                    <th className="text-muted p-2 text-xs font-semibold uppercase">Code</th>
                    <th className="text-muted p-2 text-xs font-semibold uppercase">Bezeichnung</th>
                    <th className="text-muted p-2 text-xs font-semibold uppercase text-right">Aufschlag</th>
                    <th className="text-muted p-2 text-xs font-semibold uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.id} className="border-border border-b">
                      <td className="text-text p-2 font-mono text-xs">{v.axis}</td>
                      <td className="text-text p-2 font-mono text-xs">{v.code}</td>
                      <td className="text-text p-2">{v.label}</td>
                      <td className="text-text p-2 text-right font-mono">
                        {v.surcharge_cents > 0
                          ? `+${(v.surcharge_cents / 100).toFixed(2)} €`
                          : "—"}
                      </td>
                      <td className="p-2">
                        <Badge variant={v.is_active ? "success" : "default"}>
                          {v.is_active ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {documents && documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dokumente ({documents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id} className="text-text flex items-center gap-2 text-sm">
                  <Badge variant="default" className="text-xs">
                    {doc.kind}
                  </Badge>
                  {doc.title}
                  {doc.language && (
                    <span className="text-muted text-xs">({doc.language})</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadaten</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-3">
            <div>
              <dt className="text-muted">ID</dt>
              <dd className="text-text font-mono text-xs">{product.id}</dd>
            </div>
            <div>
              <dt className="text-muted">Erstellt</dt>
              <dd className="text-text">
                {new Date(product.created_at).toLocaleDateString("de-DE")}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Aktualisiert</dt>
              <dd className="text-text">
                {new Date(product.updated_at).toLocaleDateString("de-DE")}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Zitiermodus</dt>
              <dd className="text-text">{product.quote_mode ? "Ja" : "Nein"}</dd>
            </div>
            <div>
              <dt className="text-muted">Hervorgehoben</dt>
              <dd className="text-text">{product.is_featured ? "Ja" : "Nein"}</dd>
            </div>
            <div>
              <dt className="text-muted">Quelle</dt>
              <dd className="text-text font-mono text-xs">{product.source ?? "—"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <form action={archiveProduct}>
          <input type="hidden" name="id" value={product.id} />
          <Button variant="secondary" type="submit">
            <Archive className="size-4" />
            Archivieren
          </Button>
        </form>
        <DeleteProductButton productId={product.id} productName={product.model} />
        <Button asChild variant="ghost">
          <Link href="/admin/produkte">
            <ArrowLeft className="size-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
      </div>
    </div>
  );
}

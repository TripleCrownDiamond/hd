#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i.exec(line);
    if (!match) continue;
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

function latestInput() {
  const dir = resolve(process.cwd(), "data/scraped/hark");
  const published = resolve(dir, "published.jsonl");
  if (existsSync(published)) return published;
  const file = readdirSync(dir)
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(name))
    .sort()
    .at(-1);
  if (!file) throw new Error("No HARK JSONL scrape found.");
  return resolve(dir, file);
}

function numberFrom(value) {
  if (value == null) return null;
  const parsed = Number.parseFloat(
    String(value)
      .replace(/[^\d,.-]/g, "")
      .replace(",", "."),
  );
  return Number.isFinite(parsed) ? parsed : null;
}

function yes(specs, key) {
  return specs[key]?.toLocaleLowerCase("de-DE") === "ja";
}

function productRow(record, brandId, categoryId, operatorId) {
  const specs = record.technical.specs ?? {};
  const fuel = [
    yes(specs, "Brennstoff Scheitholz") ? "Scheitholz" : null,
    yes(specs, "Brennstoff Braunkohlebriketts") ? "Braunkohlebriketts" : null,
    yes(specs, "Brennstoff Steinkohle") ? "Steinkohle" : null,
  ].filter(Boolean);
  const power = numberFrom(specs["Nennwärmeleistung (kW)"]);
  const efficiency = numberFrom(specs["Wirkungsgrad (%)"]);
  const heightCm = numberFrom(specs["Höhe (cm)"]);
  const widthCm = numberFrom(specs["Breite (cm)"]);
  const depthCm = numberFrom(specs["Tiefe (cm)"]);
  const featureLabels = Object.entries(specs)
    .filter(([, value]) => String(value).toLocaleLowerCase("de-DE") === "ja")
    .map(([label]) => label);

  const shortDescription = [
    power != null ? `${power} kW Nennwärmeleistung` : null,
    efficiency != null ? `${efficiency} % Wirkungsgrad` : null,
    record.technical.energy_class
      ? `Energieklasse ${record.technical.energy_class}`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    slug: record.slug,
    kind: "stove",
    brand_id: brandId,
    category_id: categoryId,
    economic_operator_id: operatorId,
    model: record.model,
    subtitle: null,
    short_description: shortDescription || null,
    long_description: record.descriptions.long_de_raw,
    description_authorized: record.descriptions.long_de_authorized === true,
    power_kw_min: null,
    power_kw_max: null,
    power_kw_nominal: power,
    efficiency_pct: efficiency,
    energy_class: record.technical.energy_class,
    fuel: fuel.join(", ") || null,
    flue_diameter_mm: numberFrom(specs["Durchmesser Rauchrohr (mm)"]),
    connection_position: specs["Rauchrohranschluss"] ?? null,
    height_mm: heightCm != null ? Math.round(heightCm * 10) : null,
    width_mm: widthCm != null ? Math.round(widthCm * 10) : null,
    depth_mm: depthCm != null ? Math.round(depthCm * 10) : null,
    weight_kg: numberFrom(specs["Gewicht (kg)"]),
    co_mg_nm3:
      numberFrom(specs["CO-Emission (g/Nm³)"]) != null
        ? numberFrom(specs["CO-Emission (g/Nm³)"]) * 1000
        : null,
    ogc_mg_nm3: numberFrom(specs["CnHm (Kohlenwasserstoffe) (mg/Nm³)"]),
    particulates_mg_nm3: numberFrom(specs["Staub (mg/Nm³)"]),
    raw_air_independent: yes(specs, "Raumluftunabhängig") ? "ja" : null,
    extra: {
      sku: record.identifiers.sku,
      price_cents_min: record.pricing.price_cents_min,
      price_cents_max: record.pricing.price_cents_max,
      vat_included: record.pricing.vat_included,
      variation_axes: record.variations,
      technical_specs: specs,
      feature_labels: featureLabels,
      source_image_urls: record.media.image_urls_source,
      source_documents: record.documents.sources,
      supplier_contacts_excluded: true,
    },
    price_cents_public:
      record.pricing.price_cents_min ?? record.pricing.price_cents_selected ?? null,
    quote_mode: false,
    ecodesign_2022: null,
    bimschv_stufe: yes(specs, "BImSchV 2. Stufe") ? "2" : null,
    compliance_verified_at: null,
    source: "hark",
    source_url: record.source_url,
    source_scraped_at: record.scraped_at,
    is_published: false,
    is_featured: false,
    review_status: "pending",
    reviewed_at: null,
    reviewed_by: null,
  };
}

async function main() {
  const env = loadEnv(resolve(process.cwd(), ".env.local"));
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local.",
    );
  }
  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const input = latestInput();
  const records = readFileSync(input, "utf8")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map(JSON.parse);
  if (records.length === 0) throw new Error(`No records in ${input}.`);

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .upsert(
      {
        slug: "hark",
        name: "HARK",
        country_code: "DE",
        website: "https://www.hark.de",
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (brandError) throw new Error(`brand: ${brandError.message}`);

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", "kaminoefen")
    .single();
  if (categoryError) throw new Error(`category: ${categoryError.message}`);

  const rows = records.map((record) => productRow(record, brand.id, category.id, null));
  const { error: productsError } = await supabase
    .from("products")
    .upsert(rows, { onConflict: "slug" });
  if (productsError) throw new Error(`products: ${productsError.message}`);

  const { data: importedProducts, error: importedProductsError } = await supabase
    .from("products")
    .select("id,slug")
    .in(
      "slug",
      records.map((record) => record.slug),
    );
  if (importedProductsError) {
    throw new Error(`product ids: ${importedProductsError.message}`);
  }
  const idBySlug = new Map(importedProducts.map((product) => [product.slug, product.id]));

  let mediaCount = 0;
  for (const record of records) {
    const productId = idBySlug.get(record.slug);
    if (!productId) continue;
    const gallery = [
      ...(record.media_cloudinary?.hero
        ? [
            {
              public_id: record.media_cloudinary.hero,
              source_url: record.media.image_urls_source[0] ?? null,
            },
          ]
        : []),
      ...(record.media_cloudinary?.gallery ?? []),
    ];
    if (gallery.length === 0) continue;

    const { error: deleteError } = await supabase
      .from("product_media")
      .delete()
      .eq("product_id", productId);
    if (deleteError) {
      throw new Error(`delete media ${record.slug}: ${deleteError.message}`);
    }
    const { error: mediaError } = await supabase.from("product_media").insert(
      gallery.map((image, position) => ({
        product_id: productId,
        kind: "image",
        cloudinary_public_id: image.public_id,
        source_url: image.source_url,
        alt_de: `${record.brand} ${record.model}`,
        position,
      })),
    );
    if (mediaError) {
      throw new Error(`media ${record.slug}: ${mediaError.message}`);
    }
    mediaCount += gallery.length;
  }

  console.log(
    `Imported ${rows.length} HARK products with authorized text and ${mediaCount} media rows. ` +
      "Regulatory review status was preserved.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

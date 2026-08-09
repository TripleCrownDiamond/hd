#!/usr/bin/env node
/**
 * Import reviewed Spartherm scrape records into Supabase staging.
 *   Reads data/scraped/spartherm/published.jsonl
 *   Uses SUPABASE_SECRET_KEY (service_role) — bypasses RLS.
 *
 * Also seeds the 6 core categories and the Spartherm brand if absent.
 * Products remain pending and unpublished until compliance is verified.
 *
 * Idempotent: run again to update. Products keyed by slug.
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i.exec(line);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

const env = loadEnv(resolve(process.cwd(), ".env.local"));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

const INPUT = resolve(process.cwd(), "data/scraped/spartherm/published.jsonl");

async function upsertBrand() {
  const { data, error } = await supabase
    .from("brands")
    .upsert(
      {
        slug: "spartherm",
        name: "Spartherm",
        country_code: "DE",
        website: "https://www.spartherm.com",
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (error) throw new Error(`brand upsert: ${error.message}`);
  return data.id;
}

async function upsertCategories() {
  const rows = [
    { slug: "brennholz", name: "Brennholz", position: 1 },
    { slug: "kaminoefen", name: "Kaminöfen", position: 2 },
    { slug: "holzpellets", name: "Holzpellets", position: 3 },
    { slug: "holzbriketts", name: "Holzbriketts", position: 4 },
    { slug: "anzuendholz", name: "Anzündholz", position: 5 },
    { slug: "zubehoer", name: "Ofenzubehör", position: 6 },
  ].map((r) => ({ ...r, is_published: true }));
  const { error } = await supabase.from("categories").upsert(rows, { onConflict: "slug" });
  if (error) throw new Error(`categories upsert: ${error.message}`);
  const { data } = await supabase.from("categories").select("id,slug");
  return new Map(data.map((c) => [c.slug, c.id]));
}

async function upsertOperator() {
  const { data: existing } = await supabase
    .from("economic_operators")
    .select("id")
    .eq("legal_name", "Spartherm Feuerungstechnik GmbH")
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from("economic_operators")
    .insert({
      legal_name: "Spartherm Feuerungstechnik GmbH",
      role: "manufacturer",
      address: "Maschweg 38",
      postal_code: "49324",
      city: "Melle",
      country_code: "DE",
      contact_email: "info@spartherm.com",
    })
    .select("id")
    .single();
  if (error) throw new Error(`operator upsert: ${error.message}`);
  return data.id;
}

function mapProductRow(p, brandId, categoryId, operatorId) {
  const t = p.technical;
  return {
    slug: p.slug,
    kind: "stove",
    brand_id: brandId,
    category_id: categoryId,
    economic_operator_id: operatorId,
    model: p.model,
    subtitle: p.descriptions.subtitle_de ?? null,
    short_description: p.descriptions.short_de ?? null,
    long_description: p.descriptions.long_de_raw ?? null,
    description_authorized: !!p.descriptions.long_de_authorized,
    power_kw_min: t.power_kw_min,
    power_kw_max: t.power_kw_max,
    power_kw_nominal: t.power_kw_nominal,
    efficiency_pct: t.efficiency_pct,
    energy_class: t.energy_class,
    fuel: t.fuel,
    flue_diameter_mm: t.flue_diameter_mm,
    connection_position: t.connection,
    height_mm: t.dimensions_mm?.height ?? null,
    width_mm: t.dimensions_mm?.width ?? null,
    depth_mm: t.dimensions_mm?.depth ?? null,
    weight_kg: t.weight_kg,
    co_mg_nm3: t.co_mg_nm3,
    ogc_mg_nm3: t.ogc_mg_nm3,
    particulates_mg_nm3: t.particulates_mg_nm3,
    raw_air_independent: t.raw_air_independent,
    extra: t.extra ?? {},
    price_cents_public: p.pricing?.price_cents_public ?? null,
    quote_mode: p.pricing?.quote_mode ?? true,
    source: p.source,
    source_url: p.source_url,
    source_scraped_at: p.scraped_at,
    is_published: false,
    review_status: "pending",
    reviewed_at: null,
  };
}

async function main() {
  if (!existsSync(INPUT)) {
    console.error(`Input not found: ${INPUT}. Run pnpm run publish:spartherm first.`);
    process.exit(1);
  }
  const products = readFileSync(INPUT, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
  console.log(`Importing ${products.length} products…`);

  const brandId = await upsertBrand();
  console.log("  brand.id =", brandId);
  const cats = await upsertCategories();
  const operatorId = await upsertOperator();
  const catKaminoefen = cats.get("kaminoefen");
  console.log("  category kaminoefen.id =", catKaminoefen);
  console.log("  operator.id =", operatorId);

  const rows = products.map((p) => mapProductRow(p, brandId, catKaminoefen, operatorId));
  const { error: upErr } = await supabase
    .from("products")
    .upsert(rows, { onConflict: "slug" });
  if (upErr) throw new Error(`products upsert: ${upErr.message}`);
  console.log(`  ✓ ${rows.length} products upserted`);

  // Map slug → id
  const { data: prodRows, error: prodErr } = await supabase
    .from("products")
    .select("id,slug")
    .in("slug", rows.map((r) => r.slug));
  if (prodErr) throw new Error(prodErr.message);
  const idBySlug = new Map(prodRows.map((r) => [r.slug, r.id]));

  const complianceRows = [...idBySlug.values()].flatMap((productId) => [
    {
      product_id: productId,
      standard: "Ecodesign 2022",
      status: "pending",
      notes: "Awaiting model match and evidence from HKI CERT or manufacturer documentation.",
    },
    {
      product_id: productId,
      standard: "1. BImSchV Stufe 2",
      status: "pending",
      notes: "Awaiting model match and evidence from HKI CERT or manufacturer documentation.",
    },
  ]);
  const { error: complianceError } = await supabase
    .from("product_compliance_checks")
    .upsert(complianceRows, { onConflict: "product_id,standard" });
  if (complianceError) {
    throw new Error(`compliance checks upsert: ${complianceError.message}`);
  }
  console.log(`  ✓ ${complianceRows.length} pending compliance checks upserted`);

  // Variants
  let variantCount = 0;
  for (const p of products) {
    const productId = idBySlug.get(p.slug);
    if (!productId) continue;
    const cldMap = new Map((p.media_cloudinary?.variants ?? []).map((v) => [v.code, v]));
    const variantRows = (p.variants ?? [])
      .filter((v) => {
        const c = cldMap.get(v.code);
        return c?.main; // only variants that actually have an image after publish
      })
      .map((v, position) => {
        const c = cldMap.get(v.code);
        return {
          product_id: productId,
          axis: v.axis,
          code: v.code,
          label: v.label_de,
          swatch_cloudinary_id: c?.swatch ?? null,
          main_image_cloudinary_id: c?.main ?? null,
          video_cloudinary_id: null, // videos not uploaded to Cloudinary yet
          surcharge_cents: v.surcharge_cents ?? 0,
          position,
          is_active: true,
        };
      });
    if (variantRows.length === 0) continue;
    // Delete previous variants for this product, then insert. Simpler than upserting keys.
    await supabase.from("product_variants").delete().eq("product_id", productId);
    const { error } = await supabase.from("product_variants").insert(variantRows);
    if (error) {
      console.error(`  ✗ variants for ${p.slug}: ${error.message}`);
      continue;
    }
    variantCount += variantRows.length;
  }
  console.log(`  ✓ ${variantCount} variants inserted`);

  // Product media (gallery extras + hero)
  let mediaCount = 0;
  for (const p of products) {
    const productId = idBySlug.get(p.slug);
    if (!productId) continue;
    const mediaRows = [];
    let pos = 0;
    if (p.media_cloudinary?.hero) {
      mediaRows.push({
        product_id: productId,
        kind: "image",
        cloudinary_public_id: p.media_cloudinary.hero,
        source_url: p.media?.hero_image_url_source ?? null,
        alt_de: `${p.model} – Hero`,
        position: pos++,
      });
    }
    for (const g of p.media_cloudinary?.gallery ?? []) {
      mediaRows.push({
        product_id: productId,
        kind: "image",
        cloudinary_public_id: g.public_id,
        source_url: g.source_url,
        alt_de: p.model,
        position: pos++,
      });
    }
    if (mediaRows.length === 0) continue;
    await supabase.from("product_media").delete().eq("product_id", productId);
    const { error } = await supabase.from("product_media").insert(mediaRows);
    if (error) {
      console.error(`  ✗ media for ${p.slug}: ${error.message}`);
      continue;
    }
    mediaCount += mediaRows.length;
  }
  console.log(`  ✓ ${mediaCount} media rows inserted`);

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

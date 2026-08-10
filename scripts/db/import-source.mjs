#!/usr/bin/env node
/**
 * Import any scraped source into the Supabase staging catalogue.
 *
 * Handles the two record shapes produced by scripts/scrape:
 *   - manufacturer stoves (`type: "stove"`), typed `technical.*` + `specs`
 *   - wood suppliers (`type: "wood"`), `technical.extra.*` + `product_kind`
 *
 * Everything lands with `is_published: false` and `review_status: "pending"`:
 * publication stays a human decision, per AGENTS.md. Compliance flags are never
 * inferred here — only the HKI reconciliation may set them.
 *
 * Usage:
 *   node scripts/db/import-source.mjs --source rika
 *   node scripts/db/import-source.mjs --all [--dry-run]
 */

import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "node:util";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { mapStoveSpecs } from "./_lib/stove-specs.mjs";
import { buildDescription } from "./_lib/describe.mjs";

const { values } = parseArgs({
  options: {
    source: { type: "string" },
    all: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    // Delete rows for products the source no longer lists. Off by default so a
    // partial scrape can never wipe a catalogue.
    prune: { type: "boolean", default: false },
  },
});

const SCRAPED_DIR = resolve(process.cwd(), "data/scraped");
const NOT_A_SOURCE = new Set(["hki-cert"]);

/** Display names for brands that are not simply the capitalised slug. */
const BRAND_NAMES = {
  austroflamm: "Austroflamm",
  brennio: "Brennio",
  camina: "Camina & Schmid",
  frankenbrennstoffe: "Franken Brennstoffe",
  hark: "HARK",
  holzfront: "Holzfront",
  holzhof24: "Holzhof24",
  holzmueller: "Holzmüller",
  jotul: "Jøtul",
  "jsm-brennholz": "JSM Brennholz",
  "kaminholz-berlin": "Kaminholz Berlin",
  maxblank: "Max Blank",
  areiter: "A. Reiter",
  ecoreichholz: "ECO Reichholz",
  "bri-brennholz": "BRIE Brennholz",
  ofenkoppe: "Ofen Koppe",
  rika: "RIKA",
  skantherm: "Skantherm",
  spartherm: "Spartherm",
  wodtke: "Wodtke",
};

/** product_kind (scrape) -> { kind (enum), category slug }. */
const KIND_TO_CATEGORY = {
  wood: { kind: "wood", category: "brennholz" },
  // Rundholz, Meterscheite and Polterholz: a distinct kind and category so a
  // 3-metre trunk does not sit next to a 25 cm kiln-dried sack.
  log: { kind: "log", category: "stammholz" },
  kindling: { kind: "kindling", category: "anzuendholz" },
  briquette: { kind: "briquette", category: "holzbriketts" },
  pellet: { kind: "pellet", category: "holzpellets" },
  coal: { kind: "coal", category: "kohle" },
  accessory: { kind: "accessory", category: "zubehoer" },
  stove: { kind: "stove", category: "kaminoefen" },
};

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

/** Prefer the Cloudinary-enriched snapshot when the media publisher has run. */
function inputFor(source) {
  const dir = resolve(SCRAPED_DIR, source);
  if (!existsSync(dir)) return null;
  const published = resolve(dir, "published.jsonl");
  if (existsSync(published)) return [published];
  // A source may split its scrape across several files of the same date
  // (`2026-08-01-accessory.jsonl`, `2026-08-01-stove.jsonl`); read them all.
  const dated = readdirSync(dir).filter((name) => /^\d{4}-\d{2}-\d{2}.*\.jsonl$/.test(name));
  if (dated.length === 0) return null;
  const latest = dated.map((name) => name.slice(0, 10)).sort().at(-1);
  return dated.filter((name) => name.startsWith(latest)).sort().map((name) => resolve(dir, name));
}

function listSources() {
  return readdirSync(SCRAPED_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !NOT_A_SOURCE.has(entry.name))
    .map((entry) => entry.name)
    .filter((name) => inputFor(name));
}

function num(value) {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Number.parseFloat(
    String(value).replace(/\s/g, "").replace(/[^\d,.-]/g, "").replace(",", "."),
  );
  return Number.isFinite(parsed) ? parsed : null;
}

/** Clamp to a numeric(p,s) column so one odd source value cannot fail a batch. */
function fitNumeric(value, precision, scale) {
  const parsed = num(value);
  if (parsed == null) return null;
  const max = 10 ** (precision - scale) - 1;
  if (Math.abs(parsed) > max) return null;
  return Math.round(parsed * 10 ** scale) / 10 ** scale;
}

function fitInt(value) {
  const parsed = num(value);
  if (parsed == null) return null;
  const rounded = Math.round(parsed);
  return Math.abs(rounded) <= 2147483647 ? rounded : null;
}

function stoveRow(record, source, brandId, categoryId) {
  const technical = record.technical ?? {};
  const specs = technical.specs ?? technical.extra ?? {};
  const dimensions = technical.dimensions_mm ?? {};
  // The scrapers only type a few fields; the rest of the manufacturer table is
  // parsed here so power, efficiency, dimensions and weight are not lost.
  const mapped = mapStoveSpecs(specs);

  const power = technical.power_kw_nominal ?? mapped.power_kw_nominal;
  const powerMin = technical.power_kw_min ?? mapped.power_kw_min;
  const powerMax = technical.power_kw_max ?? mapped.power_kw_max;
  const efficiency = technical.efficiency_pct ?? mapped.efficiency_pct;

  const energyClass = technical.energy_class ?? mapped.energy_class;
  const shortDescription = [
    power != null ? `${power} kW Nennwärmeleistung` : null,
    efficiency != null ? `${efficiency} % Wirkungsgrad` : null,
    energyClass ? `Energieklasse ${energyClass}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const authorized = record.descriptions?.long_de_authorized ?? record.descriptions?.description_authorized ?? false;

  return {
    slug: record.slug,
    kind: "stove",
    brand_id: brandId,
    category_id: categoryId,
    economic_operator_id: null,
    model: record.model,
    subtitle: record.descriptions?.subtitle_de ?? null,
    short_description: shortDescription || null,
    long_description: record.descriptions?.long_de_raw ?? null,
    description_authorized: authorized === true,
    power_kw_min: fitNumeric(powerMin, 5, 2),
    power_kw_max: fitNumeric(powerMax, 5, 2),
    power_kw_nominal: fitNumeric(power, 5, 2),
    efficiency_pct: fitNumeric(efficiency, 5, 2),
    energy_class: energyClass,
    fuel: technical.fuel ?? mapped.fuel,
    flue_diameter_mm: fitInt(
      technical.flue_diameter_mm ?? technical.flue_outlet_mm ?? mapped.flue_diameter_mm,
    ),
    connection_position:
      technical.connection ?? technical.flue_exit_options ?? mapped.connection_position,
    height_mm: fitInt(technical.height_mm ?? dimensions.height ?? mapped.height_mm),
    width_mm: fitInt(technical.width_mm ?? dimensions.width ?? mapped.width_mm),
    depth_mm: fitInt(technical.depth_mm ?? dimensions.depth ?? mapped.depth_mm),
    weight_kg: fitNumeric(technical.weight_kg ?? mapped.weight_kg, 6, 2),
    co_mg_nm3: fitNumeric(technical.co_mg_nm3 ?? mapped.co_mg_nm3, 6, 2),
    ogc_mg_nm3: fitNumeric(technical.ogc_mg_nm3 ?? mapped.ogc_mg_nm3, 6, 2),
    particulates_mg_nm3: fitNumeric(
      technical.particulates_mg_nm3 ?? technical.dust_mg_nm3 ?? mapped.particulates_mg_nm3,
      6,
      2,
    ),
    raw_air_independent: technical.raw_air_independent ?? null,
    extra: {
      sku: record.identifiers?.sku ?? null,
      ean: record.identifiers?.ean ?? null,
      product_number: record.product_number ?? null,
      product_type_de: record.product_type_de ?? null,
      heating_capacity_m2: technical.heating_capacity_m2 ?? null,
      log_size_mm: technical.log_size_mm ?? null,
      safety_distance: technical.safety_distance ?? null,
      nox_mg_nm3: technical.nox_mg_nm3 ?? null,
      feature_labels: record.features_de ?? [],
      certifications_seen: record.certifications ?? [],
      technical_specs: specs,
      source_image_urls: record.media?.image_urls_source ?? [],
      source_documents: record.documents?.sources ?? record.documents ?? [],
      supplier_contacts_excluded: true,
    },
    price_cents_public: record.pricing?.price_cents_public ?? record.pricing?.price_cents_min ?? null,
    quote_mode:
      record.pricing?.quote_mode ??
      (record.pricing?.price_cents_public ?? record.pricing?.price_cents_min) == null,
    ecodesign_2022: null,
    // Declared by the manufacturer's own spec table; HKI reconciliation remains
    // the authority and may overwrite this during compliance review.
    bimschv_stufe: mapped.bimschv_stufe,
    compliance_verified_at: null,
    source,
    source_url: record.source_url,
    source_scraped_at: record.scraped_at,
    is_published: false,
    is_featured: false,
    review_status: "pending",
    reviewed_at: null,
    reviewed_by: null,
  };
}

/** Keys of `technical.extra` that are the source's own spec table. */
const WOOD_DECLARATION_KEYS = new Set([
  "wood_type",
  "length_de",
  "moisture_de",
  "unit_de",
  "quantity_de",
  "origin_de",
  "packaging_de",
  "category_de",
  "description",
  "product_kind",
]);

function sourceSpecs(extra) {
  const out = {};
  for (const [key, value] of Object.entries(extra)) {
    if (WOOD_DECLARATION_KEYS.has(key)) continue;
    if (typeof value !== "string" && typeof value !== "number") continue;
    if (String(value).trim() === "") continue;
    out[key] = value;
  }
  return out;
}

function woodRow(record, source, brandId, categoryId, kind) {
  const extra = record.technical?.extra ?? {};
  const pricing = record.pricing ?? {};
  const shortDescription = [
    extra.wood_type,
    extra.length_de,
    extra.moisture_de,
    extra.unit_de,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    slug: record.slug,
    kind,
    brand_id: brandId,
    category_id: categoryId,
    economic_operator_id: null,
    model: record.model,
    subtitle: null,
    short_description: shortDescription || null,
    long_description: record.descriptions?.long_de_raw ?? null,
    description_authorized: record.descriptions?.long_de_authorized === true,
    power_kw_min: null,
    power_kw_max: null,
    power_kw_nominal: null,
    efficiency_pct: null,
    energy_class: null,
    fuel: null,
    flue_diameter_mm: null,
    connection_position: null,
    height_mm: null,
    width_mm: null,
    depth_mm: null,
    weight_kg: null,
    co_mg_nm3: null,
    ogc_mg_nm3: null,
    particulates_mg_nm3: null,
    raw_air_independent: null,
    extra: {
      wood_type: extra.wood_type ?? null,
      length_de: extra.length_de ?? null,
      moisture_de: extra.moisture_de ?? null,
      unit_de: extra.unit_de ?? null,
      quantity_de: extra.quantity_de ?? null,
      origin_de: extra.origin_de ?? null,
      packaging_de: extra.packaging_de ?? null,
      price_per_unit_cents: pricing.price_per_unit_cents ?? null,
      price_per_unit: pricing.price_per_unit ?? null,
      price_text_raw: pricing.price_text_raw ?? null,
      product_kind_source: record.product_kind ?? null,
      category_de: extra.category_de ?? null,
      // Retailers publish a real spec table for accessories (Artikel-Nr., EAN,
      // Maße, Material…). Keeping it lets the detail page show something other
      // than a wood declaration full of "Nicht angegeben".
      source_specs: sourceSpecs(extra),
      source_image_urls: record.media?.image_urls_source ?? [],
      supplier_contacts_excluded: true,
    },
    price_cents_public: pricing.price_cents_public ?? null,
    quote_mode: pricing.price_cents_public == null,
    ecodesign_2022: null,
    bimschv_stufe: null,
    compliance_verified_at: null,
    source,
    source_url: record.source_url,
    source_scraped_at: record.scraped_at,
    is_published: false,
    is_featured: false,
    review_status: "pending",
    reviewed_at: null,
    reviewed_by: null,
  };
}

async function chunked(items, size, worker) {
  for (let index = 0; index < items.length; index += size) {
    await worker(items.slice(index, index + size));
  }
}

async function importSource(supabase, source, categoryIdBySlug, dryRun) {
  const all = inputFor(source).flatMap((input) =>
    readFileSync(input, "utf8")
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line)),
  );

  // `excluded` is a notes block in the manufacturer scrapers; only `skip_import`
  // marks a listing that must not become a product (services, gift vouchers).
  const excluded = all.filter((record) => record.skip_import);
  const records = all.filter((record) => !record.skip_import);

  // A duplicate slug inside one file would make the upsert non-deterministic.
  const bySlug = new Map();
  const duplicates = [];
  for (const record of records) {
    if (bySlug.has(record.slug)) duplicates.push(record.slug);
    else bySlug.set(record.slug, record);
  }
  const unique = [...bySlug.values()];

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .upsert(
      { slug: source, name: BRAND_NAMES[source] ?? source, country_code: "DE" },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (brandError) throw new Error(`${source} brand: ${brandError.message}`);

  const rows = [];
  const unmapped = [];
  for (const record of unique) {
    // Appliance records (`stove`, `pellet_stove`, inserts…) are always stoves;
    // only supplier fuel records carry a `product_kind`.
    const isAppliance = record.type !== "wood" && /stove|insert|ofen|kamin/i.test(record.type ?? "");
    const productKind = isAppliance ? "stove" : (record.product_kind ?? "wood");
    const mapping = KIND_TO_CATEGORY[productKind];
    if (!mapping) {
      unmapped.push(`${record.slug} (${productKind})`);
      continue;
    }
    const categoryId = categoryIdBySlug.get(mapping.category);
    if (!categoryId) {
      unmapped.push(`${record.slug} (category ${mapping.category} missing)`);
      continue;
    }
    rows.push(
      mapping.kind === "stove"
        ? stoveRow(record, source, brand.id, categoryId)
        : woodRow(record, source, brand.id, categoryId, mapping.kind),
    );
  }

  // A factual description composed from the data we hold. The manufacturer's
  // own marketing copy is a literary work and must not be reused (AGENTS.md),
  // so products whose source published no authorised text get this instead of
  // an empty page.
  for (const row of rows) {
    const generated = buildDescription(row);
    if (generated) row.extra = { ...row.extra, generated_description: generated };
  }

  // An import refreshes catalogue data; it must not silently undo a review
  // decision such as a product rejected for having no identifying image.
  const { data: existing, error: existingError } = await supabase
    .from("products")
    .select("slug,review_status,reviewed_at,reviewed_by")
    .eq("source", source);
  if (existingError) throw new Error(`${source} existing review: ${existingError.message}`);
  const reviewBySlug = new Map(existing.map((row) => [row.slug, row]));
  for (const row of rows) {
    const previous = reviewBySlug.get(row.slug);
    if (previous && previous.review_status !== "pending") {
      row.review_status = previous.review_status;
      row.reviewed_at = previous.reviewed_at;
      row.reviewed_by = previous.reviewed_by;
    }
  }

  if (dryRun) {
    console.log(
      `~ ${source}: would import ${rows.length} products` +
        (excluded.length ? `, ${excluded.length} excluded` : "") +
        (duplicates.length ? `, ${duplicates.length} duplicate slugs` : "") +
        (unmapped.length ? `, ${unmapped.length} unmapped` : ""),
    );
    return { source, products: rows.length, media: 0, excluded: excluded.length, duplicates, unmapped };
  }

  await chunked(rows, 100, async (batch) => {
    const { error } = await supabase.from("products").upsert(batch, { onConflict: "slug" });
    if (error) throw new Error(`${source} products: ${error.message}`);
  });

  const { data: imported, error: importedError } = await supabase
    .from("products")
    .select("id,slug")
    .eq("source", source);
  if (importedError) throw new Error(`${source} product ids: ${importedError.message}`);
  const idBySlug = new Map(imported.map((product) => [product.slug, product.id]));

  // Media: replace the whole gallery per product so a re-import never doubles it.
  const mediaRows = [];
  const productIdsWithMedia = [];
  for (const record of unique) {
    const productId = idBySlug.get(record.slug);
    if (!productId) continue;
    const cloudinary = record.media_cloudinary;
    if (!cloudinary) continue;
    const gallery = [
      ...(cloudinary.hero
        ? [{ public_id: cloudinary.hero, source_url: cloudinary.hero_source_url ?? null }]
        : []),
      ...(cloudinary.gallery ?? []),
    ];
    if (gallery.length === 0) continue;
    productIdsWithMedia.push(productId);
    gallery.forEach((image, position) => {
      mediaRows.push({
        product_id: productId,
        kind: "image",
        cloudinary_public_id: image.public_id,
        source_url: image.source_url ?? null,
        alt_de: `${record.brand} ${record.model}`,
        position,
      });
    });
  }

  if (productIdsWithMedia.length > 0) {
    await chunked(productIdsWithMedia, 200, async (batch) => {
      const { error } = await supabase.from("product_media").delete().in("product_id", batch);
      if (error) throw new Error(`${source} media delete: ${error.message}`);
    });
    await chunked(mediaRows, 500, async (batch) => {
      const { error } = await supabase.from("product_media").insert(batch);
      if (error) throw new Error(`${source} media insert: ${error.message}`);
    });
  }

  // Variants (finish/colour axes) — only manufacturer scrapes carry them.
  const variantRows = [];
  for (const record of unique) {
    const productId = idBySlug.get(record.slug);
    if (!productId || !Array.isArray(record.variants)) continue;
    record.variants.forEach((variant, position) => {
      const code = variant.code ?? variant.label_de ?? variant.label;
      if (!code) return;
      variantRows.push({
        product_id: productId,
        axis: variant.axis ?? "finish",
        code: String(code).slice(0, 120),
        label: variant.label_de ?? variant.label ?? String(code),
        surcharge_cents: variant.surcharge_cents ?? 0,
        position,
        is_active: true,
      });
    });
  }
  if (variantRows.length > 0) {
    await chunked(variantRows, 300, async (batch) => {
      const { error } = await supabase
        .from("product_variants")
        .upsert(batch, { onConflict: "product_id,axis,code" });
      if (error) throw new Error(`${source} variants: ${error.message}`);
    });
  }

  // Entries the source dropped (or that turned out not to be products) would
  // otherwise stay in the catalogue for ever.
  const scrapedSlugs = new Set(rows.map((row) => row.slug));
  const stale = imported.filter((product) => !scrapedSlugs.has(product.slug));
  if (stale.length > 0) {
    if (values.prune) {
      await chunked(
        stale.map((product) => product.id),
        100,
        async (batch) => {
          const { error } = await supabase.from("products").delete().in("id", batch);
          if (error) throw new Error(`${source} prune: ${error.message}`);
        },
      );
      console.log(`  pruned ${stale.length} products no longer listed by ${source}`);
    } else {
      console.warn(
        `  ! ${stale.length} products in the database are no longer listed by ${source} (use --prune)`,
      );
    }
  }

  console.log(
    `✓ ${source}: ${rows.length} products, ${mediaRows.length} media, ${variantRows.length} variants` +
      (excluded.length ? `, ${excluded.length} excluded` : "") +
      (duplicates.length ? `, ${duplicates.length} duplicate slugs merged` : "") +
      (unmapped.length ? `, ${unmapped.length} UNMAPPED` : ""),
  );
  for (const item of unmapped.slice(0, 5)) console.warn(`    ! unmapped ${item}`);

  return {
    source,
    products: rows.length,
    media: mediaRows.length,
    variants: variantRows.length,
    excluded: excluded.length,
    duplicates,
    unmapped,
  };
}

async function main() {
  const env = loadEnv(resolve(process.cwd(), ".env.local"));
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local.");
  }
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id,slug");
  if (categoriesError) throw new Error(`categories: ${categoriesError.message}`);
  const categoryIdBySlug = new Map(categories.map((category) => [category.slug, category.id]));

  const sources = values.all ? listSources() : values.source ? [values.source] : [];
  if (sources.length === 0) throw new Error("Pass --source <slug> or --all.");

  const summaries = [];
  for (const source of sources) {
    summaries.push(await importSource(supabase, source, categoryIdBySlug, values["dry-run"]));
  }

  const totals = summaries.reduce(
    (acc, s) => ({
      products: acc.products + s.products,
      media: acc.media + (s.media ?? 0),
      unmapped: acc.unmapped + (s.unmapped?.length ?? 0),
    }),
    { products: 0, media: 0, unmapped: 0 },
  );
  console.log(
    `\n${summaries.length} sources — ${totals.products} products, ${totals.media} media, ${totals.unmapped} unmapped.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

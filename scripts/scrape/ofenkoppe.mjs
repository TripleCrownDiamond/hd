#!/usr/bin/env node
/**
 * Scrape Ofen Koppe Germany product catalogue from public SSR pages.
 *
 * NB: ofenkoppe.de is down; the live site is https://www.ofenkoppe.com
 * - Discover product slugs from /de/produktuebersicht (relative links, <base href>)
 * - Product pages: https://www.ofenkoppe.com/de/shops/<groupe>/<slug>
 * - Technical data: table.attributes_list (td.title + td.value)
 * - Energy class: image name Class_Arrows_<range>_<class>.png
 * - Images: CSS background-image url(...) of lazy <img>
 *
 * Output: data/scraped/ofenkoppe/{yyyy-mm-dd}.jsonl
 * Respects robots.txt, rate limit, cache (via _lib/fetcher).
 */

import { parseArgs } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import { fetchUrl, contentHash } from "./_lib/fetcher.mjs";
import { getLicense } from "./_lib/licenses.mjs";

const SOURCE = "ofenkoppe";
const BASE = "https://www.ofenkoppe.com";
const OUT_DIR = `data/scraped/${SOURCE}`;
const CACHE_DIR = `${OUT_DIR}/_cache`;

const { values } = parseArgs({
  options: {
    limit: { type: "string" },
    all: { type: "boolean", default: false },
  },
  allowPositionals: true,
});

function clean(value) {
  return value
    ?.replace(/\u00ad/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&auml;/g, "ä")
    .replace(/&ouml;/g, "ö")
    .replace(/&uuml;/g, "ü")
    .replace(/&Auml;/g, "Ä")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&szlig;/g, "ß")
    .replace(/&nbsp;/g, " ")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/[\s\u00a0]+/g, " ")
    .trim() ?? "";
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/æ/g, "ae")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toNumber(value) {
  if (value == null || value === "") return null;
  const parsed = Number.parseFloat(String(value).replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function abs(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return BASE + url;
}

async function discoverProducts() {
  const products = new Map();
  const { body } = await fetchUrl(`${BASE}/de/produktuebersicht`, {
    cacheDir: CACHE_DIR,
    intervalMs: 2000,
  });
  const links = [...body.matchAll(/href="([^"]*de\/shops\/[^"]+)"/g)].map((m) => m[1]);
  for (const link of links) {
    const [path] = link.split("#");
    const parts = path.replace(/\/$/, "").split("/");
    const slug = parts.at(-1);
    const group = parts.at(-2);
    if (!slug || products.has(slug)) continue;
    products.set(slug, { url: new URL(path, BASE).toString(), group });
  }
  return products;
}

function extractSpecs(html) {
  const specs = {};
  const rows = [...html.matchAll(/<td class="title">([\s\S]*?)<\/td>\s*<td class="value">([\s\S]*?)<\/td>/g)];
  for (const r of rows) {
    const k = clean(r[1]);
    const v = clean(r[2]);
    if (k && v) specs[k] = v;
  }
  return specs;
}

function recordFromPage(page) {
  const licenseTxt = getLicense(SOURCE, "specs");
  const licenseImg = getLicense(SOURCE, "images");
  const licensePdf = getLicense(SOURCE, "pdf");
  const specs = extractSpecs(page.html);
  const energyClassMatch = page.html.match(/Class_Arrows_[A-G0-9+%\-]+_([A-G](?:\+\+|\+|-)?)\.png/);
  const energyClass = energyClassMatch ? energyClassMatch[1] : null;

  const certifications = [];
  if (/BImSchV|1\.\s*BImSchV/i.test(page.html)) certifications.push("BImSchV");
  if (/Ökodesign/i.test(page.html)) certifications.push("Ecodesign");

  const images = [];
  for (const m of page.html.matchAll(/background-image:\s*url\(['"]?([^)'"]+)/g)) {
    const url = abs(m[1]);
    if (url && !url.includes("logo") && !images.includes(url)) images.push(url);
  }

  const title = page.html.match(/<title>([\s\S]*?)<\/title>/);
  const h2 = page.html.match(/<h2 class="name">([\s\S]*?)<\/h2>/);
  const model = clean(h2?.[1] || title?.[1] || page.slug);

  return {
    source: SOURCE,
    source_url: page.url,
    scraped_at: new Date().toISOString(),
    content_hash: contentHash(page.html),
    type: "stove",
    brand: "Ofen Koppe",
    model,
    slug: `ofenkoppe-${page.slug}`,
    identifiers: {
      sku: null,
      ean: null,
      hki_id: null,
    },
    product_type_key: null,
    product_type_de: page.group,
    product_number: null,
    descriptions: {
      long_de_raw: null,
      bullets_de_raw: null,
      description_authorized: licenseTxt.authorized,
    },
    features_de: null,
    technical: {
      energy_class: energyClass,
      power_kw_nominal: toNumber(specs["Nennwärmeleistung"]),
      power_kw_min: null,
      power_kw_max: null,
      efficiency_pct: null,
      heating_capacity_m2: null,
      log_size_mm: toNumber(specs["empfohlene Scheitholzlänge"]),
      flue_outlet_mm: toNumber(specs["Rauchrohrdurchmesser"]?.match(/[\d.,]+/)?.[0]),
      flue_exit_options: specs["Rauchrohranschluss"] ?? null,
      safety_distance: null,
      height_mm: toNumber(specs["Höhe"]),
      width_mm: toNumber(specs["Breite"]),
      depth_mm: toNumber(specs["Tiefe"]),
      weight_kg: toNumber(specs["Gewicht"]),
      co_emission: null,
      co_mg_nm3: null,
      ogc_mg_nm3: null,
      nox_mg_nm3: null,
      dust_mg_nm3: null,
      specs,
    },
    certifications,
    variants: [],
    media: {
      image_urls_source: images,
      licensed_to_download: licenseImg.authorized,
      downloaded_local_paths: [],
    },
    documents: {
      sources: [],
      licensed_to_download: licensePdf.authorized,
      downloaded_local_paths: [],
    },
    excluded: {
      manufacturer_contacts: true,
      prices: "No prices on product pages.",
      description: "Marketing copy not captured.",
    },
    authorized: licenseTxt.authorized && licenseImg.authorized,
    review_status: "pending",
  };
}

async function fetchProduct(url) {
  const { body } = await fetchUrl(url, { cacheDir: CACHE_DIR, intervalMs: 2000 });
  return { url, html: body, slug: url.split("/").filter(Boolean).pop() };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(CACHE_DIR, { recursive: true });

  console.log("Discovering products…");
  const products = await discoverProducts();
  console.log(`Discovered ${products.size} products`);

  const entries = [...products.entries()];
  const targetCount = values.limit
    ? Number.parseInt(values.limit, 10)
    : values.all
      ? entries.length
      : 10;

  const records = [];
  for (const [slug, meta] of entries.slice(0, targetCount)) {
    const page = await fetchProduct(meta.url);
    const record = recordFromPage({ ...page, slug, group: meta.group });
    records.push(record);
    console.log(`  ✓ ${record.model} (${record.product_type_de}) — ${record.technical.power_kw_nominal ?? "-"} kW`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const outFile = `${OUT_DIR}/${today}.jsonl`;
  await writeFile(
    outFile,
    records.map((r) => JSON.stringify(r)).join("\n") + (records.length > 0 ? "\n" : ""),
  );
  console.log(`Saved ${records.length}/${targetCount} records to ${outFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Scrape RIKA Germany product catalogue from public SSR pages.
 *
 * - Discover product slugs from the 7 category pages (/stoves/woodburning, ...)
 * - Product pages: https://www.rika.de/<slug>
 * - Technical data: .techdetails__label / .techdetails__value pairs
 * - Documents: PDF data sheets, tech docs, DoP links in the page
 * - Images: from the category listing cards (product cut-outs)
 *
 * Output: data/scraped/rika/{yyyy-mm-dd}.jsonl
 * Respects robots.txt, rate limit, cache (via _lib/fetcher).
 * No prices published by RIKA (image site).
 */

import { parseArgs } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import { fetchUrl, contentHash } from "./_lib/fetcher.mjs";
import { getLicense } from "./_lib/licenses.mjs";

const SOURCE = "rika";
const BASE = "https://www.rika.de";
const OUT_DIR = `data/scraped/${SOURCE}`;
const CACHE_DIR = `${OUT_DIR}/_cache`;

const CATEGORIES = [
  "woodburning",
  "pellet",
  "combi",
  "design",
  "heatinginserts",
  "outdoor",
  "modulare-oefen",
];

const NON_PRODUCT = new Set([
  "blog", "catalog", "company", "configurator", "contact", "customer-service",
  "dealers", "design", "downloads", "faqs", "imprint", "jobs", "press",
  "privacy", "production", "stores", "stoves", "stovetypetest", "sustainability",
  "technology",
]);

const { values } = parseArgs({
  options: {
    limit: { type: "string" },
    all: { type: "boolean", default: false },
  },
  allowPositionals: true,
});

const de = (obj) => obj?.deDE ?? null;

function clean(value) {
  return value
    ?.replace(/\u00ad/g, "")
    .replace(/&amp;/g, "&")
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

function techPairs(html) {
  const pairs = [];
  const re =
    /techdetails__label">[\s\S]*?<h5>([\s\S]*?)<\/h5>[\s\S]*?techdetails__value">[\s\S]*?<p>([\s\S]*?)<\/p>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const label = clean(m[1]);
    const value = clean(m[2]);
    if (label) pairs.push({ label, value });
  }
  return pairs;
}

function featureLabels(html) {
  const labels = [];
  const re = /features__feature[^>]*>[\s\S]*?<h5[^>]*>([\s\S]*?)<\/h5>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const label = clean(m[1]);
    if (label) labels.push(label);
  }
  return [...new Set(labels)];
}

function pdfDocuments(html) {
  const docs = [];
  const re = /<a[^>]*href="([^"]*\.pdf[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    if (!href.startsWith("http")) continue;
    const title = clean(m[2]).replace(/^.*?<svg/, "").trim();
    if (title) docs.push({ url: href, title });
  }
  return docs;
}

async function discoverProducts() {
  const products = new Map(); // slug -> {category, image}
  for (const cat of CATEGORIES) {
    const { body } = await fetchUrl(`${BASE}/stoves/${cat}`, {
      cacheDir: CACHE_DIR,
      intervalMs: 2000,
    });
    const cards = [...body.matchAll(/<div class="column is-one-third js-product">[\s\S]*?<a href="([^"]+)" class="products__product">[\s\S]*?<img src="([^"]+)"/g)];
    for (const m of cards) {
      const href = m[1];
      const img = m[2];
      const slug = new URL(href).pathname.replace(/^\//, "").split("/")[0];
      if (!slug || NON_PRODUCT.has(slug) || products.has(slug)) continue;
      products.set(slug, { category: cat, image: img });
    }
  }
  return products;
}

function recordFromPage(page) {
  const licenseTxt = getLicense(SOURCE, "specs");
  const licenseImg = getLicense(SOURCE, "images");
  const licensePdf = getLicense(SOURCE, "pdf");
  const pairs = techPairs(page.html);
  const specs = {};
  for (const p of pairs) specs[p.label] = p.value;
  const features = featureLabels(page.html);
  const images = page.image ? [page.image] : [];

  const certifications = [];
  let energyClass = null;
  for (const f of features) {
    if (/BImSchV/i.test(f)) certifications.push("BImSchV");
    if (/Ökodesign|Ecodesign/i.test(f)) certifications.push("Ecodesign");
    const eco = f.match(/Energieeffizienzklasse\s*(A\+\+|A\+|A|B|C|D)/i);
    if (eco) energyClass = eco[1].toUpperCase();
  }

  const docs = pdfDocuments(page.html).filter((d) => !/rikastatic|\.svg$/i.test(d.url));

  return {
    source: SOURCE,
    source_url: page.url,
    scraped_at: new Date().toISOString(),
    content_hash: contentHash(page.html),
    type: "stove",
    brand: "RIKA",
    model: page.title,
    slug: `rika-${page.slug}`,
    identifiers: {
      sku: null,
      ean: null,
      hki_id: null,
    },
    product_type_key: null,
    product_type_de: page.category,
    product_number: null,
    descriptions: {
      long_de_raw: null,
      bullets_de_raw: null,
      description_authorized: licenseTxt.authorized,
    },
    features_de: features,
    technical: {
      energy_class: energyClass,
      power_kw_nominal: toNumber(specs["Nennwärmeleistung"]),
      power_kw_min: null,
      power_kw_max: null,
      efficiency_pct: null,
      heating_capacity_m2: null,
      log_size_mm: null,
      flue_outlet_mm: null,
      flue_exit_options: null,
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
      sources: docs,
      licensed_to_download: licensePdf.authorized,
      downloaded_local_paths: [],
    },
    excluded: {
      manufacturer_contacts: true,
      prices: "No prices published by RIKA (image site).",
      description: "Marketing copy stored as features only; long text not captured.",
    },
    authorized: licenseTxt.authorized && licenseImg.authorized,
    review_status: "pending",
  };
}

async function fetchProduct(url) {
  const { body } = await fetchUrl(url, { cacheDir: CACHE_DIR, intervalMs: 2000 });
  const h1 = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const title = clean(h1?.[1] || "") || url.split("/").pop();
  return { url, html: body, title };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(CACHE_DIR, { recursive: true });

  console.log("Discovering products from category pages…");
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
    const url = `${BASE}/${slug}`;
    const page = await fetchProduct(url);
    const record = recordFromPage({ ...page, slug, category: meta.category, image: meta.image });
    records.push(record);
    console.log(`  ✓ ${record.model} (${record.product_type_de})`);
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

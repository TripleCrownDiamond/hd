#!/usr/bin/env node
/**
 * Scrape Austroflamm Germany product catalogue from public SSR pages.
 *
 * - Discover product slugs from the category page /de/oefen/kaminoefen
 * - Product pages: https://www.austroflamm.com/de/oefen/kaminoefen/<slug>
 * - Technical data: #technical-data overlay, groups product-technical-data__attribute-group
 *   with attribute-headline + attribute-data__value
 * - BImSchV badge: .product-header__bim-schv-stage-tag
 *
 * Output: data/scraped/austroflamm/{yyyy-mm-dd}.jsonl
 * Respects robots.txt, rate limit, cache (via _lib/fetcher).
 * No prices published by Austroflamm (reseller network).
 */

import { parseArgs } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import { fetchUrl, contentHash } from "./_lib/fetcher.mjs";
import { getLicense } from "./_lib/licenses.mjs";

const SOURCE = "austroflamm";
const BASE = "https://www.austroflamm.com";
const OUT_DIR = `data/scraped/${SOURCE}`;
const CACHE_DIR = `${OUT_DIR}/_cache`;

const CATEGORY_PAGES = [
  "/de/oefen/kaminoefen",
  "/de/oefen/pelletoefen",
  "/de/oefen/kombioefen",
  "/de/oefen/kamineinsaetze",
  "/de/oefen/kaminoefen/koch-backgeraete",
];

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

function technicalData(html) {
  const groups = {};
  const parts = html.split('class="product-technical-data__attribute-group">');
  for (const part of parts.slice(1)) {
    const headMatch = part.match(/product-technical-data__headline">([\s\S]*?)<\/div>/);
    const head = headMatch ? clean(headMatch[1]) : "(no headline)";
    const end = part.indexOf("</div>\n                </div>\n                            </div>");
    const inner = end > -1 ? part.slice(0, end) : part;
    const attrs = [
      ...inner.matchAll(
        /attribute-headline">([\s\S]*?)<\/div>\s*<div class="product-technical-data__attribute-data">\s*<span class="product-technical-data__attribute-data__value">([\s\S]*?)<\/span>/g,
      ),
    ].map((a) => ({ key: clean(a[1]), value: clean(a[2]) }));
    if (attrs.length) groups[head] = attrs;
  }
  return groups;
}

function findAttr(groups, group, keyRe) {
  const g = groups[group];
  if (!g) return null;
  const found = g.find((a) => keyRe.test(a.key));
  return found?.value ?? null;
}

async function discoverProducts() {
  const products = new Map();
  const re = /href="([^"]*\/de\/oefen\/(kaminoefen|pelletoefen|kombioefen|kamineinsaetze)\/([a-z0-9-]+))\/?"/g;
  for (const cat of CATEGORY_PAGES) {
    const { body } = await fetchUrl(BASE + cat, { cacheDir: CACHE_DIR, intervalMs: 2000 });
    const category = cat.replace("/de/oefen/", "");
    let m;
    while ((m = re.exec(body)) !== null) {
      const slug = m[3];
      if (slug === "koch-backgeraete" || slug === "sommeredition-fynn-xtra-aquamarin") continue;
      const url = m[1].startsWith("http") ? m[1] : BASE + m[1];
      if (products.has(slug)) continue;
      products.set(slug, { url, category: m[2] });
    }
  }
  return products;
}

function recordFromPage(page) {
  const licenseTxt = getLicense(SOURCE, "specs");
  const licenseImg = getLicense(SOURCE, "images");
  const licensePdf = getLicense(SOURCE, "pdf");
  const data = technicalData(page.html);
  const specs = {};
  for (const [group, attrs] of Object.entries(data)) {
    for (const a of attrs) specs[`${group}: ${a.key}`] = a.value;
  }

  const bimschv = page.html.match(/product-header__bim-schv-stage-tag[^>]*>[\s\S]*?tag__content">\s*([\s\S]*?)\s*<\/span>/);
  const certifications = [];
  const bimschvStufe = findAttr(data, "Prüfung", /BImSchV/i);
  if (bimschvStufe) certifications.push("BImSchV");
  if (bimschvStufe?.includes("1+2")) certifications.push("BImSchV Stufe 1+2");
  const eco = findAttr(data, "Leistungsdaten", /Energieeffizienzklasse/i);
  let energyClass = null;
  if (eco) {
    const m = eco.match(/(A\+\+|A\+|A|B|C|D)/i);
    if (m) energyClass = m[1].toUpperCase();
  }
  const certOther = findAttr(data, "Prüfung", /Zertifikat/i);
  if (certOther) certifications.push(certOther);

  const images = [];
  const imgs = [...page.html.matchAll(/<img[^>]*src="([^"]*Kamin\w*[^"]*|Öfen[^"]*|product[^"]*)[^"]*"[^>]*>/gi)];
  for (const m of imgs) {
    const src = m[1].replace(/-~-media[^.]*--query@?[0-9]?x\.[^.]*\./g, ".");
    const url = abs(src);
    if (url && !images.includes(url)) images.push(url);
  }

  const pdfs = [...new Set(page.html.matchAll(/href="([^"]*\.pdf)"/g))].map((m) => abs(m[1])).filter(Boolean);

  const title = page.html.match(/<title>([\s\S]*?)<\/title>/);
  const rawTitle = title?.[1]?.trim() ?? "";
  let model;
  if (rawTitle.includes("|")) {
    model = rawTitle.split("|")[1].trim();
  } else if (rawTitle.includes("– Kaminofen") || rawTitle.includes("- Kaminofen")) {
    model = rawTitle.split(/\s*[–-]\s*Kaminofen/i)[0].trim();
  } else {
    model = rawTitle;
  }
  if (!model) model = page.slug.split("-").slice(0, -1).join(" ");

  const bimschvEfficiency = page.html.match(/data-tippy-content="[^"]*Wirkungsgrad[^"]*([\d.,]+)\s*%"/);

  return {
    source: SOURCE,
    source_url: page.url,
    scraped_at: new Date().toISOString(),
    content_hash: contentHash(page.html),
    type: "stove",
    brand: "Austroflamm",
    model,
    slug: `austroflamm-${page.slug}`,
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
    features_de: null,
    technical: {
      energy_class: energyClass,
      power_kw_nominal: toNumber(findAttr(data, "Leistungsdaten", /Nennwärmeleistung/i)?.split("/")[0]),
      power_kw_min: null,
      power_kw_max: null,
      efficiency_pct: bimschvEfficiency ? toNumber(bimschvEfficiency[1]) : null,
      heating_capacity_m2: null,
      log_size_mm: null,
      flue_outlet_mm: toNumber(findAttr(data, "Anschlüsse", /Rauchrohr/i)?.match(/[\d.,]+/)?.[0]),
      flue_exit_options: null,
      safety_distance: null,
      height_mm: toNumber(findAttr(data, "Abmessungen", /^Höhe/i)),
      width_mm: toNumber(findAttr(data, "Abmessungen", /^Breite/i)),
      depth_mm: toNumber(findAttr(data, "Abmessungen", /^Tiefe/i)),
      weight_kg: toNumber(findAttr(data, "Abmessungen", /Gewicht/i)),
      co_emission: null,
      co_mg_nm3: null,
      ogc_mg_nm3: null,
      nox_mg_nm3: null,
      dust_mg_nm3: null,
      specs,
    },
    certifications: [...new Set(certifications)],
    variants: [],
    media: {
      image_urls_source: images,
      licensed_to_download: licenseImg.authorized,
      downloaded_local_paths: [],
    },
    documents: {
      sources: pdfs.map((url) => ({ url })),
      licensed_to_download: licensePdf.authorized,
      downloaded_local_paths: [],
    },
    excluded: {
      manufacturer_contacts: true,
      prices: "No prices published by Austroflamm (reseller network).",
      description: "Marketing copy not captured.",
    },
    authorized: licenseTxt.authorized && licenseImg.authorized,
    review_status: "pending",
  };
}

async function fetchProduct(url) {
  const { body } = await fetchUrl(url, { cacheDir: CACHE_DIR, intervalMs: 2000 });
  return { url, html: body };
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
    const page = await fetchProduct(meta.url);
    const record = recordFromPage({ ...page, slug, category: meta.category });
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

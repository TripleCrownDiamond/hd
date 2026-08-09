#!/usr/bin/env node
/**
 * Scrape Skantherm Germany product catalogue from public TYPO3 SSR pages.
 *
 * - Discover product slugs from the sitemap (?sitemap=pages&type=1533906435)
 * - Product pages: https://www.skantherm.de/modelle/<serie>/<slug>
 * - Technical data: table.table-hover with th scope="row" + td (modal duplicate included)
 * - Model name: p.h3 inside #technicalDataListModal
 *
 * Output: data/scraped/skantherm/{yyyy-mm-dd}.jsonl
 * Respects robots.txt, rate limit, cache (via _lib/fetcher).
 * No prices published by Skantherm.
 */

import { parseArgs } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import { fetchUrl, contentHash } from "./_lib/fetcher.mjs";
import { getLicense } from "./_lib/licenses.mjs";

const SOURCE = "skantherm";
const BASE = "https://www.skantherm.de";
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

async function getProductUrls() {
  const { body } = await fetchUrl(
    `${BASE}/?sitemap=pages&type=1533906435&cHash=8275553a5a625b333f333d8cf67e39aa`,
    { cacheDir: CACHE_DIR, intervalMs: 2000 },
  );
  const urls = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  return urls.filter((u) => /\/modelle\/[^/]+\/[^/]+$/.test(u) && !/elements-system$|zubehoer$/i.test(u));
}

function extractTables(html) {
  const tables = [...html.matchAll(/<table class="table[^"]*"[^>]*>([\s\S]*?)<\/table>/g)];
  const best = [];
  for (const t of tables) {
    const rows = [
      ...t[1].matchAll(/<th scope="row">\s*([\s\S]*?)\s*<\/th>\s*<td>([\s\S]*?)<\/td>/g),
    ]
      .map((r) => ({ k: clean(r[1]), v: clean(r[2]) }))
      .filter((r) => r.k && r.v);
    if (rows.length > best.length) best.splice(0, best.length, ...rows);
  }
  return best;
}

function findValue(rows, keyRe) {
  const found = rows.find((r) => keyRe.test(r.k));
  return found?.v ?? null;
}

function recordFromPage(page) {
  const licenseTxt = getLicense(SOURCE, "specs");
  const licenseImg = getLicense(SOURCE, "images");
  const licensePdf = getLicense(SOURCE, "pdf");
  const rows = extractTables(page.html);
  const specs = {};
  for (const r of rows) specs[r.k] = r.v;

  const energyClassMatch = page.html.match(/Class_Arrows_[A-G][^_]*_([A-G](?:\+\+|\+|-)?)\.svg/);
  const energyClass = energyClassMatch ? energyClassMatch[1] : null;

  const certifications = [];
  if (/BImSchV/i.test(page.html)) certifications.push("BImSchV");
  if (/2\.\s*Stufe/i.test(page.html)) certifications.push("BImSchV Stufe 2");
  if (/Ökodesign/i.test(page.html)) certifications.push("Ecodesign");
  if (/EN\s*16510/i.test(page.html)) certifications.push("EN 16510");

  const h3 = page.html.match(/<p class="h3[^"]*">([\s\S]*?)<\/p>/);
  const model = clean(h3?.[1] || "") || page.title || page.slug;

  const images = [];
  for (const m of page.html.matchAll(/<img[^>]*src="([^"]*)"[^>]*>/g)) {
    const url = abs(m[1]);
    if (url && !url.includes("icons/") && !url.endsWith(".gif") && !images.includes(url)) images.push(url);
  }

  const pdfs = [...new Set(page.html.matchAll(/href="([^"]*\.pdf)"/g))].map((m) => abs(m[1])).filter(Boolean);

  return {
    source: SOURCE,
    source_url: page.url,
    scraped_at: new Date().toISOString(),
    content_hash: contentHash(page.html),
    type: "stove",
    brand: "Skantherm",
    model,
    slug: `skantherm-${page.slug}`,
    identifiers: {
      sku: null,
      ean: null,
      hki_id: null,
    },
    product_type_key: null,
    product_type_de: page.serie,
    product_number: null,
    descriptions: {
      long_de_raw: null,
      bullets_de_raw: null,
      description_authorized: licenseTxt.authorized,
    },
    features_de: null,
    technical: {
      energy_class: energyClass,
      power_kw_nominal: toNumber(findValue(rows, /Nennwärmeleistung/i)),
      power_kw_min: null,
      power_kw_max: null,
      efficiency_pct: toNumber(findValue(rows, /Wirkungsgrad/i)),
      heating_capacity_m2: null,
      log_size_mm: toNumber(findValue(rows, /Scheitholz/i)?.match(/[\d.,]+/)?.[0]),
      flue_outlet_mm: null,
      flue_exit_options: findValue(rows, /Rauchrohranschluss/i),
      safety_distance: null,
      height_mm: toNumber(findValue(rows, /^Höhe/i)),
      width_mm: toNumber(findValue(rows, /^Breite/i)),
      depth_mm: toNumber(findValue(rows, /^Tiefe/i)),
      weight_kg: toNumber(findValue(rows, /^Gewicht/i)),
      co_emission: findValue(rows, /^CO/i),
      co_mg_nm3: toNumber(findValue(rows, /^CO/i)?.match(/(\d[\d.,]*)/)?.[1]),
      ogc_mg_nm3: toNumber(findValue(rows, /OGC/i)?.match(/(\d[\d.,]*)/)?.[1]),
      nox_mg_nm3: toNumber(findValue(rows, /NOx/i)?.match(/(\d[\d.,]*)/)?.[1]),
      dust_mg_nm3: toNumber(findValue(rows, /Staub/i)?.match(/(\d[\d.,]*)/)?.[1]),
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
      prices: "No prices published by Skantherm.",
      description: "Marketing copy not captured.",
    },
    authorized: licenseTxt.authorized && licenseImg.authorized,
    review_status: "pending",
  };
}

async function fetchProduct(url) {
  const { body } = await fetchUrl(url, { cacheDir: CACHE_DIR, intervalMs: 2000 });
  const h1 = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const parts = url.split("/").filter(Boolean);
  return {
    url,
    html: body,
    title: clean(h1?.[1] || ""),
    slug: parts.at(-1),
    serie: parts.at(-2),
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(CACHE_DIR, { recursive: true });

  console.log("Discovering products from sitemap…");
  const urls = await getProductUrls();
  console.log(`Product URLs: ${urls.length}`);

  const targetCount = values.limit
    ? Number.parseInt(values.limit, 10)
    : values.all
      ? urls.length
      : 10;

  const records = [];
  for (const url of urls.slice(0, targetCount)) {
    const page = await fetchProduct(url);
    const record = recordFromPage(page);
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

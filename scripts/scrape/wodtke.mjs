#!/usr/bin/env node
/**
 * Scrape Wodtke Germany product catalogue from public TYPO3 SSR pages.
 *
 * - Discover product slugs from the category pages /produkte-loesungen/{kaminofen|pelletofen}/
 * - Product pages: https://www.wodtke.com/produkte-loesungen/{cat}/<slug>/
 * - Technical data: accordion "Technische Daten" as <ul><li> list
 * - Price: accordion "Preis" (manufacturer RRP incl. VAT)
 *
 * Output: data/scraped/wodtke/{yyyy-mm-dd}.jsonl
 * Respects robots.txt, rate limit, cache (via _lib/fetcher).
 */

import { parseArgs } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import { fetchUrl, contentHash } from "./_lib/fetcher.mjs";
import { getLicense } from "./_lib/licenses.mjs";

const SOURCE = "wodtke";
const BASE = "https://www.wodtke.com";
const OUT_DIR = `data/scraped/${SOURCE}`;
const CACHE_DIR = `${OUT_DIR}/_cache`;

const CATEGORIES = ["kaminofen", "pelletofen"];

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

function euroToCents(value) {
  const m = String(value).match(/(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})\s*€/);
  if (!m) return null;
  const num = Number.parseFloat(m[1].replace(/\./g, "").replace(",", "."));
  return Number.isFinite(num) ? Math.round(num * 100) : null;
}

function abs(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return BASE + url;
}

/** Extract accordion sections: {sectionName -> html} */
function accordionSections(html) {
  const sections = {};
  const re = /<h2[^>]*>\s*([\s\S]*?)\s*<\/h2>[\s\S]*?<div id="c\d+-acc"[^>]*>([\s\S]*?)\n\s*<\/div>\n\s*<\/div>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const name = clean(m[1]);
    if (name) sections[name] = m[2];
  }
  return sections;
}

async function discoverProducts() {
  const products = new Map();
  for (const cat of CATEGORIES) {
    const { body } = await fetchUrl(`${BASE}/produkte-loesungen/${cat}/`, {
      cacheDir: CACHE_DIR,
      intervalMs: 2000,
    });
    const links = [...body.matchAll(/href="(\/produkte-loesungen\/(?:kaminofen|pelletofen)\/[a-z0-9-]+\/)"/g)]
      .map((m) => m[1]);
    for (const link of links) {
      const slug = link.split("/").filter(Boolean).pop();
      if (products.has(slug)) continue;
      products.set(slug, { url: BASE + link, category: cat });
    }
  }
  return products;
}

const TECH_KEY_PATTERNS = [
  [/Nennwärmeleistung[\s:]*([\d.,]+)/i, "Nennwärmeleistung"],
  [/Energieeffizienzklasse[\s:]*([A-G](?:\+\+|\+|-)?)/i, "Energieeffizienzklasse"],
  [/Wirkungsgrad[\s:]*([\d.,]+)/i, "Wirkungsgrad"],
  [/Gewicht[\s:]*([\d.,]+)/i, "Gewicht"],
  [/Höhe[\s:]*([\d.,]+)/i, "Höhe"],
  [/Breite[\s:]*([\d.,]+)/i, "Breite"],
  [/Tiefe[\s:]*([\d.,]+)/i, "Tiefe"],
  [/Holzscheitlänge[\s:]*([\d.,]+)/i, "Holzscheitlänge"],
  [/Rauchrohranschluss[\s:]*([^\n<]{0,40})/i, "Rauchrohranschluss"],
  [/CO-Gehalt im Abgas[\s:]*([^\n<]{0,40})/i, "CO-Gehalt im Abgas"],
  [/Abgastemperatur[\s:]*([\d.,]+)/i, "Abgastemperatur"],
  [/Notwendiger Förderdruck[\s:]*([^\n<]{0,40})/i, "Notwendiger Förderdruck"],
  [/Raumheizvermögen[\s:]*([^\n<]{0,60})/i, "Raumheizvermögen"],
  [/Brennstoff[\s:]*([^\n<]{0,40})/i, "Brennstoff"],
];

function parseTechList(listHtml) {
  const items = [...listHtml.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => clean(m[1]));
  const specs = {};
  for (const item of items) {
    let matched = false;
    for (const [re, key] of TECH_KEY_PATTERNS) {
      const m = item.match(re);
      if (m) {
        specs[key] = m[1].trim();
        matched = true;
      }
    }
    if (!matched) specs[item] = item;
  }
  return specs;
}

function parsePriceSection(html, model) {
  const priceText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const cents = euroToCents(priceText);
  return {
    currency: "EUR",
    vat_included: /MwSt\.|USt\./i.test(priceText),
    price_cents_public: cents,
    price_visible_on_source: true,
    price_text_raw: priceText,
    quote_mode: false,
  };
}

function recordFromPage(page) {
  const licenseTxt = getLicense(SOURCE, "specs");
  const licenseImg = getLicense(SOURCE, "images");
  const licensePdf = getLicense(SOURCE, "pdf");
  const sections = accordionSections(page.html);
  const techHtml = sections["Technische Daten"] ?? "";
  const specs = parseTechList(techHtml);

  const energyClass = specs["Energieeffizienzklasse"] ?? null;
  const certifications = [];
  if (/BImSchV|BlmSchV/i.test(techHtml)) certifications.push("BImSchV");
  if (/2\.\s*Stufe/i.test(techHtml)) certifications.push("BImSchV Stufe 2");
  if (/EN\s*16510/i.test(techHtml)) certifications.push("EN 16510");

  const images = [];
  const imgs = [...page.html.matchAll(/<img[^>]*src="([^"]*\/user_upload\/[^"]*\.(?:jpg|png|webp))"[^>]*>/g)];
  for (const m of imgs) {
    const url = abs(m[1]);
    if (url && !images.includes(url)) images.push(url);
  }

  const pdfs = [...new Set(page.html.matchAll(/href="([^"]*\.pdf)"/g))].map((m) => abs(m[1])).filter(Boolean);

  const priceSection = sections["Preis"] ?? "";
  const pricing = parsePriceSection(priceSection, page.model);

  return {
    source: SOURCE,
    source_url: page.url,
    scraped_at: new Date().toISOString(),
    content_hash: contentHash(page.html),
    type: page.category === "pelletofen" ? "pellet_stove" : "stove",
    brand: "Wodtke",
    model: page.model,
    slug: `wodtke-${page.slug}`,
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
      power_kw_nominal: toNumber(specs["Nennwärmeleistung"]),
      power_kw_min: null,
      power_kw_max: null,
      efficiency_pct: toNumber(specs["Wirkungsgrad"]),
      heating_capacity_m2: null,
      log_size_mm: toNumber(specs["Holzscheitlänge"]),
      flue_outlet_mm: toNumber(specs["Rauchrohranschluss"]?.match(/[\d.,]+/)?.[0]),
      flue_exit_options: specs["Rauchrohranschluss"] ?? null,
      safety_distance: specs["Sicherheitsabstände"] ?? null,
      height_mm: toNumber(specs["Höhe"]),
      width_mm: toNumber(specs["Breite"]),
      depth_mm: toNumber(specs["Tiefe"]),
      weight_kg: toNumber(specs["Gewicht"]),
      co_emission: specs["CO-Gehalt im Abgas"] ?? null,
      co_mg_nm3: null,
      ogc_mg_nm3: null,
      nox_mg_nm3: null,
      dust_mg_nm3: null,
      specs,
    },
    certifications,
    variants: [],
    pricing,
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
      description: "Marketing copy not captured.",
    },
    authorized: licenseTxt.authorized && licenseImg.authorized,
    review_status: "pending",
  };
}

async function fetchProduct(url) {
  const { body } = await fetchUrl(url, { cacheDir: CACHE_DIR, intervalMs: 2000 });
  const h1 = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const model = clean(h1?.[1] || "") || url.split("/").filter(Boolean).pop();
  return { url, html: body, model };
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
    const record = recordFromPage({ ...page, slug, category: meta.category });
    records.push(record);
    console.log(`  ✓ ${record.model} (${record.product_type_de}) — ${record.pricing?.price_cents_public ?? "-"} ct`);
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

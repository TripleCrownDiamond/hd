#!/usr/bin/env node
/**
 * Scrape Camina & Schmid Germany product catalogue from public TYPO3 SSR pages.
 *
 * - Kamineinsätze have HTML detail pages (limited specs; full data in Datenblatt PDF)
 * - Other categories (Kaminöfen etc.) are cards linking directly to Datenblatt PDFs
 * - Discover from sitemap + category pages
 *
 * Output: data/scraped/camina/{yyyy-mm-dd}.jsonl
 * Respects robots.txt, rate limit, cache (via _lib/fetcher).
 * No prices published by Camina & Schmid.
 */

import { parseArgs } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import { fetchUrl, contentHash } from "./_lib/fetcher.mjs";
import { getLicense } from "./_lib/licenses.mjs";

const SOURCE = "camina";
const BASE = "https://camina-schmid.de";
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

function parseDimensions(text) {
  // "1320 x 440 x 390 mm (H x B x T)"
  const m = text.match(/([\d.,]+)\s*x\s*([\d.,]+)\s*x\s*([\d.,]+)\s*mm/i);
  if (!m) return null;
  return {
    height_mm: toNumber(m[1]),
    width_mm: toNumber(m[2]),
    depth_mm: toNumber(m[3]),
  };
}

async function discover() {
  // 1) detail pages from sitemap
  const sm = await fetchUrl(
    `${BASE}/?sitemap=pages&type=1533906435&cHash=4b859e9e1fed8685c2540ec5b2ecda46`,
    { cacheDir: CACHE_DIR, intervalMs: 2000 },
  );
  const urls = [...sm.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const detail = urls.filter((u) => /\/produkte\/[^/]+\/[^/]+$/.test(u));
  // Not every /produkte/<cat>/<slug> page is a product: `systemanlagen` holds
  // range overviews and `abbrandregelung` is a combustion-control technology.
  return detail.filter((u) => !NON_PRODUCT_PAGE.test(new URL(u).pathname));
}

/** Sitemap pages under /produkte that describe a range or a technology. */
const NON_PRODUCT_PAGE =
  /\/systemanlagen\/|abbrandregelung|natursteinkamine|systemkamine|\/zubehoer\//i;

function recordFromCard(card) {
  const licenseTxt = getLicense(SOURCE, "specs");
  const licenseImg = getLicense(SOURCE, "images");
  const licensePdf = getLicense(SOURCE, "pdf");
  const { model, text, pdf, image, categoryUrl, categorySlug } = card;
  const dims = parseDimensions(text);
  return {
    source: SOURCE,
    // The catalogue page is the product's public location; the PDF is a document.
    source_url: categoryUrl,
    scraped_at: new Date().toISOString(),
    content_hash: contentHash(JSON.stringify(card)),
    type: "stove",
    brand: "Camina & Schmid",
    model,
    slug: `camina-${slugify(model)}`,
    identifiers: { sku: null, ean: null, hki_id: null },
    product_type_key: null,
    product_type_de: categorySlug,
    product_number: null,
    descriptions: {
      long_de_raw: null,
      bullets_de_raw: null,
      description_authorized: licenseTxt.authorized,
    },
    features_de: null,
    technical: {
      energy_class: null,
      power_kw_nominal: null,
      power_kw_min: null,
      power_kw_max: null,
      efficiency_pct: null,
      heating_capacity_m2: null,
      log_size_mm: null,
      flue_outlet_mm: null,
      flue_exit_options: null,
      safety_distance: null,
      height_mm: dims?.height_mm ?? null,
      width_mm: dims?.width_mm ?? null,
      depth_mm: dims?.depth_mm ?? null,
      weight_kg: null,
      co_emission: null,
      co_mg_nm3: null,
      ogc_mg_nm3: null,
      nox_mg_nm3: null,
      dust_mg_nm3: null,
      specs: { "Größe (H x B x T)": text },
    },
    certifications: [],
    variants: [],
    media: {
      image_urls_source: image ? [image] : [],
      licensed_to_download: licenseImg.authorized,
      downloaded_local_paths: [],
    },
    documents: {
      sources: [{ url: pdf, title: `Produktdatenblatt ${model}` }],
      licensed_to_download: licensePdf.authorized,
      downloaded_local_paths: [],
    },
    excluded: {
      manufacturer_contacts: true,
      prices: "No prices published by Camina & Schmid.",
      technical_details: "Full specs only in the Datenblatt PDF.",
      description: "Marketing copy not captured.",
    },
    authorized: licenseTxt.authorized && licenseImg.authorized,
    review_status: "pending",
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(CACHE_DIR, { recursive: true });

  console.log("Discovering product categories…");
  const detailUrls = await discover();
  const categories = [
    "/produkte/kamineinsaetze",
    "/produkte/heizeinsatz-fuer-kachelofen",
    "/produkte/kaminkassetten",
    "/produkte/kaminoefen",
    "/produkte/grundoefen",
    "/produkte/speichersysteme",
  ];

  const cardRecords = [];
  const seenCardSlugs = new Set();
  for (const cat of categories) {
    const categoryUrl = BASE + cat;
    const { body } = await fetchUrl(categoryUrl, { cacheDir: CACHE_DIR, intervalMs: 2000 });
    const categorySlug = cat.split("/").filter(Boolean).at(-1);
    // A product card is an <a> wrapping the datasheet link, the product photo
    // and a "H x B x T" subtitle. The photo lives inside the anchor, so it is
    // captured here rather than being left empty.
    const cards = [
      ...body.matchAll(/<a[^>]*href="([^"]*fileadmin[^"]*\.pdf)"[^>]*>([\s\S]*?)<\/a>/g),
    ]
      .map((m) => ({
        pdf: abs(m[1]),
        inner: m[2],
        text: clean(m[2]),
        image: abs(m[2].match(/<img[^>]*\bsrc="([^"]+)"/i)?.[1] ?? null),
      }))
      .filter((c) => c.text && /mm/i.test(c.text));
    for (const c of cards) {
      const title = clean(c.inner.match(/class="card-title[^"]*"[^>]*>([\s\S]*?)</i)?.[1] ?? "");
      const model = title || c.text.split(/\d[\d.,]*\s*x/)[0].trim() || c.pdf.split("/").pop();
      const slug = `camina-${slugify(model)}`;
      // The same model is listed on several category pages; keep it once.
      if (seenCardSlugs.has(slug)) continue;
      seenCardSlugs.add(slug);
      cardRecords.push(recordFromCard({ ...c, model, categoryUrl, categorySlug }));
      console.log(`  ✓ (carte) ${model} — ${c.image ? "image" : "SANS IMAGE"}`);
    }
  }

  // also process detail pages (Kamineinsätze HTML)
  const detailRecords = [];
  const targetCount = values.limit
    ? Number.parseInt(values.limit, 10)
    : values.all
      ? detailUrls.length
      : 10;
  for (const url of detailUrls.slice(0, targetCount)) {
    const licenseTxt = getLicense(SOURCE, "specs");
    const licenseImg = getLicense(SOURCE, "images");
    const licensePdf = getLicense(SOURCE, "pdf");
    const { body } = await fetchUrl(url, { cacheDir: CACHE_DIR, intervalMs: 2000 });
    const h1 = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const model = clean(h1?.[1] || "") || new URL(url).pathname.split("/").filter(Boolean).pop();
    const pdfs = [...new Set(body.matchAll(/href="([^"]*fileadmin[^"]*\.pdf)"/g))].map((m) => abs(m[1])).filter(Boolean);
    const images = [...new Set(body.matchAll(/<img[^>]*src="([^"]*fileadmin\/_processed_[^"]*)"[^>]*>/g))].map((m) => abs(m[1])).filter(Boolean);
    const category = new URL(url).pathname.split("/").filter(Boolean)[1] ?? "produkte";
    // Several pages share one generic <h1> ("Systemkamine"); fall back to the
    // URL segment so each page keeps a distinct product identity.
    const urlSegment = new URL(url).pathname.split("/").filter(Boolean).pop();
    let slug = `camina-${slugify(model)}`;
    if (seenCardSlugs.has(slug)) slug = `camina-${slugify(urlSegment)}`;
    seenCardSlugs.add(slug);

    detailRecords.push({
      source: SOURCE,
      source_url: url,
      scraped_at: new Date().toISOString(),
      content_hash: contentHash(body),
      type: "stove",
      brand: "Camina & Schmid",
      model,
      slug,
      identifiers: { sku: null, ean: null, hki_id: null },
      product_type_key: null,
      product_type_de: category,
      product_number: null,
      descriptions: {
        long_de_raw: null,
        bullets_de_raw: null,
        description_authorized: licenseTxt.authorized,
      },
      features_de: null,
      technical: {
        energy_class: null,
        power_kw_nominal: null,
        power_kw_min: null,
        power_kw_max: null,
        efficiency_pct: null,
        heating_capacity_m2: null,
        log_size_mm: null,
        flue_outlet_mm: null,
        flue_exit_options: null,
        safety_distance: null,
        height_mm: null,
        width_mm: null,
        depth_mm: null,
        weight_kg: null,
        co_emission: null,
        co_mg_nm3: null,
        ogc_mg_nm3: null,
        nox_mg_nm3: null,
        dust_mg_nm3: null,
        specs: {},
      },
      certifications: [],
      variants: [],
      media: {
        image_urls_source: images,
        licensed_to_download: licenseImg.authorized,
        downloaded_local_paths: [],
      },
      documents: {
        sources: pdfs.map((pdf) => ({ url: pdf })),
        licensed_to_download: licensePdf.authorized,
        downloaded_local_paths: [],
      },
      excluded: {
        manufacturer_contacts: true,
        prices: "No prices published by Camina & Schmid.",
        technical_details: "Full specs only in the Datenblatt PDF.",
        description: "Marketing copy not captured.",
      },
      authorized: licenseTxt.authorized && licenseImg.authorized,
      review_status: "pending",
    });
    console.log(`  ✓ ${model} (${category})`);
  }

  const records = [...cardRecords, ...detailRecords];
  const today = new Date().toISOString().slice(0, 10);
  const outFile = `${OUT_DIR}/${today}.jsonl`;
  await writeFile(
    outFile,
    records.map((r) => JSON.stringify(r)).join("\n") + (records.length > 0 ? "\n" : ""),
  );
  console.log(`Saved ${records.length} records to ${outFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

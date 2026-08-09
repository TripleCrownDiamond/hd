#!/usr/bin/env node
/**
 * Scrape Max Blank Germany product catalogue from public WordPress SSR pages.
 *
 * - Discover product slugs from product-sitemap.xml (DE only, live pages)
 * - Archived products redirect to /service/ and are skipped
 * - Product pages: https://www.maxblank.com/produkt/<slug>/
 * - Technical data: section.data-and-facts, table tr.table__row (label + value)
 * - No prices: CTA "Produkt anfragen" → contact form
 *
 * Output: data/scraped/maxblank/{yyyy-mm-dd}.jsonl
 * Respects robots.txt, rate limit, cache (via _lib/fetcher).
 */

import { parseArgs } from "node:util";
import { mkdir, writeFile, appendFile } from "node:fs/promises";
import { fetch as undiciFetch } from "undici";
import { fetchUrl, contentHash } from "./_lib/fetcher.mjs";
import { getLicense } from "./_lib/licenses.mjs";

const SOURCE = "maxblank";
const BASE = "https://www.maxblank.com";
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

async function getLiveProductUrls() {
  const res = await fetchUrl(`${BASE}/product-sitemap.xml`, { cacheDir: CACHE_DIR, intervalMs: 2000 });
  const urls = [...new Set([...res.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))];
  const deUrls = urls.filter((u) => /\/produkt\//.test(u) && !new URL(u).pathname.startsWith("/en/"));
  const live = [];
  for (const u of deUrls) {
    try {
      const r = await undiciFetch(u, {
        method: "HEAD",
        redirect: "manual",
        headers: { "user-agent": "HOLZKRAFT-Catalog-Bot/1.0" },
      });
      const loc = r.headers.get("location");
      if (r.status === 200) live.push(u);
      else if (loc && !loc.includes("/service/")) live.push(u); // translated (301→/en/) — keep for now
    } catch {
      // skip unreachable
    }
  }
  return live;
}

function extractTables(html) {
  const groups = [];
  const tables = [...html.matchAll(/<table class="table">([\s\S]*?)<\/table>/g)];
  for (const t of tables) {
    const rows = [
      ...t[1].matchAll(
        /<td class="table__col[^"]*">\s*([\s\S]*?)\s*<\/td>\s*<td class="table__col">\s*([\s\S]*?)\s*<\/td>/g,
      ),
    ]
      .map((r) => ({
        k: clean(r[1]),
        v: clean(r[2]),
      }))
      .filter((r) => r.k && r.v && r.k !== "\u00a0" && r.v !== "\u00a0");
    if (rows.length) groups.push(rows);
  }
  return groups;
}

function findValue(rows, keyRe) {
  const found = rows.find((r) => keyRe.test(r.k));
  return found?.v ?? null;
}

function breadcrumb(html) {
  const bc = html.match(/<nav[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>([\s\S]*?)<\/nav>/);
  return bc ? clean(bc[1]) : "";
}

function categoryFromBreadcrumb(crumb) {
  if (/Outdoorprodukte|Feuerschale|Grillen|Holzlegen|Accessoires|Universaldrehsockel/i.test(crumb)) {
    return null;
  }
  if (/Pellet-Systemeinsätze/i.test(crumb)) return "pelletsystem-stromlos";
  if (/Kamineinsätze/i.test(crumb)) return "kamineinsaetze";
  if (/Gaskaminöfen/i.test(crumb)) return "gaskaminoefen";
  if (/Designkamine|Systemkamine/i.test(crumb)) return "designkamine";
  if (/Kaminöfen/i.test(crumb)) return "kaminoefen";
  return null;
}

function recordFromPage(page) {
  const licenseTxt = getLicense(SOURCE, "specs");
  const licenseImg = getLicense(SOURCE, "images");
  const licensePdf = getLicense(SOURCE, "pdf");
  const crumb = breadcrumb(page.html);
  const productCategory = categoryFromBreadcrumb(crumb);
  if (!productCategory) return null;
  page.product_type_de = productCategory;
  const tables = extractTables(page.html);
  const allRows = tables.flat();
  const specs = {};
  for (const r of allRows) specs[r.k] = r.v;

  const firstTable = tables[0] ?? [];
  const powerRow = allRows.find((r) => /Nennwärmeleistung/i.test(r.k));
  const ecoRow = allRows.find((r) => /Energieeffizienzklasse/i.test(r.k));
  const coRow = allRows.find((r) => /^CO\s*\(/i.test(r.k));
  const dustRow = allRows.find((r) => /Staub\s*\(/i.test(r.k));
  const noxRow = allRows.find((r) => /NOx\s*\(/i.test(r.k));
  const ogcRow = allRows.find((r) => /OGC\s*\(/i.test(r.k));

  const certifications = [];
  const certMatch = allRows.find((r) => /Zertifikat|Prüfung|BImSchV/i.test(r.k) || /BImSchV|Ökodesign/i.test(r.v));
  if (certMatch) {
    const text = `${certMatch.k} ${certMatch.v}`;
    if (/BImSchV/i.test(text)) certifications.push("BImSchV");
    if (/Stufe 2/i.test(text)) certifications.push("BImSchV Stufe 2");
    if (/Ökodesign/i.test(text)) certifications.push("Ecodesign");
  }

  const images = [
    ...new Set(page.html.matchAll(/<img[^>]*src="([^"]*wp-content\/uploads[^"]*)"[^>]*>/g).map((m) => m[1])),
  ];

  const pdfs = [
    ...new Set(page.html.matchAll(/href="([^"]*wp-content\/uploads[^"]*\.pdf)"/g).map((m) => m[1])),
  ];

  const title = page.html.match(/<title>([\s\S]*?)<\/title>/);
  const model = title?.[1]?.split(" - ")[0]?.trim() || page.slug;

  return {
    source: SOURCE,
    source_url: page.url,
    scraped_at: new Date().toISOString(),
    content_hash: contentHash(page.html),
    type: "stove",
    brand: "Max Blank",
    model,
    slug: `maxblank-${page.slug}`,
    identifiers: {
      sku: null,
      ean: null,
      hki_id: null,
    },
    product_type_key: null,
    product_type_de: page.product_type_de,
    product_number: null,
    descriptions: {
      long_de_raw: null,
      bullets_de_raw: null,
      description_authorized: licenseTxt.authorized,
    },
    features_de: null,
    technical: {
      energy_class: ecoRow?.v?.match(/(A\+\+|A\+|A|B|C|D)/i)?.[0]?.toUpperCase() ?? null,
      power_kw_nominal: toNumber(powerRow?.v),
      power_kw_min: null,
      power_kw_max: null,
      efficiency_pct: toNumber(findValue(allRows, /^Wirkungsgrad$/i)),
      heating_capacity_m2: null,
      log_size_mm: toNumber(findValue(allRows, /Holzscheitlänge/i)),
      flue_outlet_mm: toNumber(findValue(allRows, /Rauchrohr/i)?.match(/[\d.,]+/)?.[0]),
      flue_exit_options: findValue(allRows, /Rauchrohr/i),
      safety_distance: null,
      height_mm: null,
      width_mm: null,
      depth_mm: null,
      weight_kg: toNumber(findValue(allRows, /Gesamtgewicht/i)),
      co_emission: coRow?.v ?? null,
      co_mg_nm3: toNumber(coRow?.v?.match(/(\d[\d.,]*)/)?.[1]),
      ogc_mg_nm3: toNumber(ogcRow?.v?.match(/(\d[\d.,]*)/)?.[1]),
      nox_mg_nm3: toNumber(noxRow?.v?.match(/(\d[\d.,]*)/)?.[1]),
      dust_mg_nm3: toNumber(dustRow?.v?.match(/(\d[\d.,]*)/)?.[1]),
      specs,
    },
    certifications: [...new Set(certifications)],
    variants: [],
    pricing: {
      currency: "EUR",
      vat_included: true,
      price_cents_public: null,
      price_visible_on_source: false,
      quote_mode: true,
    },
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
      prices: "No prices; CTA 'Produkt anfragen' leads to contact form.",
      description: "Marketing copy not captured.",
    },
    authorized: licenseTxt.authorized && licenseImg.authorized,
    review_status: "pending",
  };
}

async function fetchProduct(url) {
  const { body } = await fetchUrl(url, { cacheDir: CACHE_DIR, intervalMs: 2000 });
  return { url, html: body, slug: new URL(url).pathname.split("/").filter(Boolean).pop() };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(CACHE_DIR, { recursive: true });

  console.log("Discovering live products from sitemap…");
  const urls = await getLiveProductUrls();
  console.log(`Live product URLs (DE): ${urls.length}`);

  const targetCount = values.limit
    ? Number.parseInt(values.limit, 10)
    : values.all
      ? urls.length
      : 10;

  const records = [];
  const errorsFile = `${OUT_DIR}/_errors.jsonl`;
  for (const url of urls.slice(0, targetCount)) {
    try {
      const page = await fetchProduct(url);
      const record = recordFromPage(page);
      if (!record) {
        console.log(`  - ${page.slug} (accessoire/outdoor, ignoré)`);
        continue;
      }
      records.push(record);
      console.log(`  ✓ ${record.model} (${record.product_type_de}) — ${record.technical.power_kw_nominal ?? "-"} kW`);
    } catch (error) {
      await appendFile(
        errorsFile,
        `${JSON.stringify({ url, error: error.message, at: new Date().toISOString() })}\n`,
      );
      console.error(`  ✗ ${url}: ${error.message}`);
    }
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

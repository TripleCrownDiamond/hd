#!/usr/bin/env node
/**
 * Scrape the BRIE Brennholz catalogue (https://bri-brennholz.com/shop).
 *
 * - WordPress/WooCommerce; product URLs from the product sitemaps
 * - Product pages ship a JSON-LD @graph with a Product node (name, sku,
 *   offers[].priceSpecification[].price, description)
 * - A per-product spec table (Kategorie, Holzart, Restfeuchte, Einheit…) is
 *   rendered as <th>/<td> rows; the logs additionally carry a `km-variants`
 *   table (Varianten und Preise) with per-size prices and SKUs
 *
 * Price corrections — both documented in data/licenses.json:
 *   1. Logs (Stammholz/Rundholz): the shop stores these prices in cents but
 *      renders them as euros (58500 -> "58,500.00 €"). The JSON-LD price is
 *      therefore divided by 100, which lands the range where firewood actually
 *      trades (~20-30 €/Rm for bulk logs vs ~125-190 €/Rm for the same shop's
 *      split, kiln-dried wood).
 *   2. Every imported price is reduced 40 % on top (user instruction
 *      2026-08-10: "ramène les réductions globalement à 40 %").
 *
 * Output: data/scraped/bri-brennholz/{yyyy-mm-dd}.jsonl
 * Respects robots.txt, rate limit, cache (via _lib/fetcher).
 */

import { parseArgs } from "node:util";
import { mkdir, writeFile, appendFile } from "node:fs/promises";
import { fetchUrl, contentHash } from "./_lib/fetcher.mjs";
import { getLicense } from "./_lib/licenses.mjs";
import { buildWoodRecord, clean, dedupeSlugs, euroToCents, detectProductKind } from "./_lib/wood.mjs";
import { extractJsonLd, productNode, shopwareName, shopwareImages, extractSpecTable, extractTableAfterHeading } from "./_lib/shopware.mjs";

const SOURCE = "bri-brennholz";
const BASE = "https://bri-brennholz.com";
const OUT_DIR = `data/scraped/${SOURCE}`;
const CACHE_DIR = `${OUT_DIR}/_cache`;

/** User instruction 2026-08-10: all prices reduced 40 %. */
const PRICE_REDUCTION_PCT = 40;

/** The shop renders log prices in cents as euros; divide by 100. */
function correctLogPriceCents(rawCents) {
  return rawCents == null ? null : Math.round(rawCents / 100);
}

const { values } = parseArgs({
  options: {
    limit: { type: "string" },
    all: { type: "boolean", default: false },
  },
  allowPositionals: true,
});

async function discoverProductUrls() {
  // The index lists which product sitemaps actually exist; guessing numbered
  // files wastes retries on 404s with backoff.
  const { body: index } = await fetchUrl(`${BASE}/wp-sitemap.xml`, {
    cacheDir: CACHE_DIR,
    intervalMs: 2000,
  });
  const sitemaps = [...index.matchAll(/<loc>\s*(https?:\/\/[^<]+?wp-sitemap-posts-product[^<]*?)\s*<\/loc>/g)]
    .map((m) => m[1].trim());
  const urls = new Set();
  for (const sitemap of sitemaps) {
    const { body } = await fetchUrl(sitemap, { cacheDir: CACHE_DIR, intervalMs: 2000 });
    const found = [...body.matchAll(/<loc>\s*(https?:\/\/[^<]+\/produit\/[^<]+)\s*<\/loc>/g)]
      .map((m) => m[1].trim());
    for (const url of found) urls.add(url);
  }
  return [...urls];
}

function isLog(model, url, specs) {
  const haystack = `${model} ${url} ${Object.values(specs).join(" ")}`;
  return /stammholz|rundholz|meterholz|polterholz/i.test(haystack);
}

/**
 * Per-size log prices. The WooCommerce price is the cheapest variation; the
 * shop's own `km-variants` table lists every size (halber LKW, 1 LKW, 2 LKW)
 * with its price and SKU, and the detail page should show all of them.
 */
function logVariantsTable(html) {
  const table = html.match(/<table class="km-variants"[\s\S]*?<\/table>/i);
  if (!table) return null;
  const rows = [...table[0].matchAll(/<tr>([\s\S]*?)<\/tr>/gi)].slice(1);
  const lines = [];
  for (const row of rows) {
    const cells = [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map((c) => clean(c[1]))
      .filter(Boolean);
    if (cells.length < 2) continue;
    // Like the JSON-LD price, the shop writes these as cents-as-euros
    // ("58500.00" for 585,00 €), so they get the same ÷100 correction.
    const rawCents = euroToCents(`${cells[1].replace(/\.(\d{2})$/, ",$1")} €`);
    const cents = rawCents == null ? null : Math.round(rawCents / 100);
    const reduced = cents == null ? null : Math.round(cents * (1 - PRICE_REDUCTION_PCT / 100));
    lines.push(
      `${cells[0]}: ${cents != null ? (cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 }) : "–"} €` +
        (reduced != null ? ` (nach -${PRICE_REDUCTION_PCT}%: ${(reduced / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €)` : "") +
        (cells[2] ? ` · ${cells[2]}` : ""),
    );
  }
  return lines.length ? lines.join(" | ") : null;
}

function extractLogSpecs(html) {
  const specs = extractSpecTable(html);
  // extractSpecTable only keeps the first <th>→<td> of each row; the log table
  // rows have three <td> with no <th>, so the full size list needs the
  // dedicated parser above.
  const variants = logVariantsTable(html);
  if (variants) specs["Varianten und Preise"] = variants;
  return specs;
}

function productKindFor(model, description, url, specs) {
  if (isLog(model, url, specs)) return "log";
  if (/kohle|anthrazit/i.test(model) && !/zange|schaufel|eimer|korb\b|besteck/i.test(model)) {
    return "coal";
  }
  if (/pellet/i.test(model)) return "pellet";
  if (/brikett|verdichtete\s+holz|verdichteten\s+staemmen|holzscheit/i.test(model)) return "briquette";
  if (/anzünd|anzuend|anfeuer|anmach/i.test(model)) return "kindling";
  // A bare `kamin` must never classify firewood: "Eichen-Kaminholz" contains
  // it. Only actual appliances (Kaminofen, Kaminherd, Kamineinsatz, …) count.
  if (/ofen\b|kaminofen\b|kaminherd\b|kamineinsatz\b|herd\b|pellet-?ofen/i.test(model)) {
    return "stove";
  }
  return detectProductKind(model, description);
}

/**
 * Logs and stoves need typed fields the wood builder does not produce, so the
 * record is assembled here and the wood builder is only used for the fields it
 * is good at (declaration detection, unit parsing, licensing, media shape).
 */
function buildBriRecord({ html, url, jsonld, model, specs, priceCentsPublic, priceTextRaw, images, description }) {
  const license = {
    specs: getLicense(SOURCE, "specs"),
    images: getLicense(SOURCE, "images"),
    pdf: getLicense(SOURCE, "pdf"),
  };
  const kind = productKindFor(model, description, url, specs);

  if (kind === "stove") {
    const extra = {};
    for (const [key, value] of Object.entries(specs)) extra[key] = value;
    const kW = model.match(/(\d+(?:[.,]\d+)?)\s*kw/i);
    return {
      source: SOURCE,
      source_url: url,
      source_locale: "de-DE",
      scraped_at: new Date().toISOString(),
      content_hash: contentHash(html),
      type: "stove",
      brand: "BRIE Brennholz",
      model,
      slug: `${SOURCE}-${model
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/ß/g, "ss")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")}`,
      identifiers: { sku: specs["SKU"] ?? null, ean: null, hki_id: null, manufacturer_id: null },
      descriptions: {
        long_de_raw: description || null,
        description_authorized: license.specs.authorized,
      },
      features_de: [],
      technical: {
        power_kw_nominal: kW ? Number.parseFloat(kW[1].replace(",", ".")) : null,
        specs,
      },
      certifications: [],
      variants: [],
      media: {
        image_urls_source: images,
        licensed_to_download: license.images.authorized,
        downloaded_local_paths: [],
      },
      documents: { sources: [], licensed_to_download: license.pdf.authorized, downloaded_local_paths: [] },
      excluded: {
        supplier_contacts: true,
        description: "Retailer page — manufacturer specs limited to the published table.",
      },
      authorized: license.specs.authorized && license.images.authorized,
      review_status: "pending",
      pricing: {
        currency: "EUR",
        vat_included: true,
        price_cents_public: priceCentsPublic,
        price_visible_on_source: priceCentsPublic != null,
        price_text_raw: priceTextRaw,
        quote_mode: priceCentsPublic == null,
      },
    };
  }

  const base = buildWoodRecord({
    specs,
    source: SOURCE,
    sourceUrl: url,
    contentHash: contentHash(html),
    brand: "BRIE Brennholz",
    model,
    priceCentsPublic,
    priceTextRaw,
    images,
    extra: {
      product_kind: kind,
      description,
      origin_de: "Deutschland",
      category_de: specs["Kategorie"] ?? null,
    },
    license,
  });
  return base;
}

async function scrapeProduct(url) {
  const { body } = await fetchUrl(url, { cacheDir: CACHE_DIR, intervalMs: 2000 });
  const jsonld = extractJsonLd(body);
  const product = productNode(jsonld);
  const model = clean(product?.name ?? "") || shopwareName(body, jsonld) || url.split("/").pop();
  const specs = extractLogSpecs(body);
  const isLogProduct = isLog(model, url, specs);

  // WooCommerce renders the current price in the first UnitPriceSpecification
  // and a ListPrice in the second. The displayed "price" element is the same
  // figure, so JSON-LD is the reliable source.
  const offers = Array.isArray(product?.offers) ? product.offers : product?.offers ? [product.offers] : [];
  const priceSpecs = offers.flatMap((o) =>
    Array.isArray(o.priceSpecification) ? o.priceSpecification : [o.priceSpecification],
  );
  const current = priceSpecs.find((s) => s && s.priceType !== "https://schema.org/ListPrice") ?? priceSpecs[0];
  let cents = euroToCents(String(current?.price ?? "").replace(".", ","));
  if (cents == null) {
    const raw = Number.parseFloat(String(current?.price ?? ""));
    if (Number.isFinite(raw) && raw > 0) cents = Math.round(raw * 100);
  }
  // The shop renders log prices as cents-as-euros; see the header comment.
  if (isLogProduct) cents = correctLogPriceCents(cents);
  // A published 0,00 € is the shop's way of saying the price is on request
  // (four listings do this), not a real sale price. Keep the product, quote it.
  const hasPrice = cents != null && cents > 0;
  const reduced = hasPrice ? Math.round(cents * (1 - PRICE_REDUCTION_PCT / 100)) : null;
  const priceTextRaw = hasPrice
    ? `${(cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €` +
      (reduced != null ? ` (nach -${PRICE_REDUCTION_PCT}%: ${(reduced / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €)` : "")
    : "Preis auf Anfrage";

  const description = clean(product?.description ?? "") || null;
  // WooCommerce's own gallery (`data-large_image`, usually 1-7 shots) is the
  // reliable picture of the product. Grabbing every <img> on the page instead
  // pulled in the header logo, delivery banners and every srcset size of the
  // same file (an average of 36 URLs per product, most of them duplicates).
  // The gallery first, then the generic collector as a fallback for shops
  // whose theme does not emit the attribute.
  const gallery = [...new Set([...body.matchAll(/data-large_image="([^"]+)"/g)].map((m) => m[1]))]
    .filter((u) => /wp-content\/uploads/.test(u));
  const images =
    gallery.length > 0
      ? gallery
      : shopwareImages(body, BASE, jsonld).filter((u) => /wp-content\/uploads/.test(u) || /cdn\./.test(u));

  return buildBriRecord({
    html: body,
    url,
    jsonld,
    model,
    specs,
    priceCentsPublic: reduced,
    priceTextRaw,
    images,
    description,
  });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(CACHE_DIR, { recursive: true });

  console.log("Discovering products from sitemaps…");
  const urls = await discoverProductUrls();
  console.log(`Discovered ${urls.length} products`);

  const targetCount = values.limit
    ? Number.parseInt(values.limit, 10)
    : values.all
      ? urls.length
      : 10;
  const today = new Date().toISOString().slice(0, 10);
  const outFile = `${OUT_DIR}/${today}.jsonl`;
  const errorsFile = `${OUT_DIR}/_errors.jsonl`;

  const records = [];
  for (const url of urls.slice(0, targetCount)) {
    try {
      const record = await scrapeProduct(url);
      records.push(record);
      console.log(
        `  ✓ ${record.model} — ${record.type}/${record.product_kind ?? "stove"} — ${record.pricing.price_cents_public ?? "-"} ct`,
      );
    } catch (error) {
      await appendFile(
        errorsFile,
        `${JSON.stringify({ url, error: error.message, at: new Date().toISOString() })}\n`,
      );
      console.error(`  ✗ ${url}: ${error.message}`);
    }
  }
  dedupeSlugs(records);
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

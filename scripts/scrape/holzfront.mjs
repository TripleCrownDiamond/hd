#!/usr/bin/env node
/**
 * Scrape Holzfront (https://holzfront.de) wood catalogue from Shopify SSR pages.
 *
 * - Shopify; collection /collections/holzshop lists products
 * - Product pages ship a JSON-LD Product with an offers[] array (variant prices)
 * - Model from JSON-LD name / h1; price = lowest variant price in cents
 *
 * Output: data/scraped/holzfront/{yyyy-mm-dd}.jsonl
 * Respects robots.txt, rate limit, cache (via _lib/fetcher).
 */

import { parseArgs } from "node:util";
import { mkdir, writeFile, appendFile } from "node:fs/promises";
import { fetchUrl, contentHash } from "./_lib/fetcher.mjs";
import { getLicense } from "./_lib/licenses.mjs";
import { buildWoodRecord, clean, dedupeSlugs } from "./_lib/wood.mjs";
import { shopwareImages, extractSpecTable } from "./_lib/shopware.mjs";

const SOURCE = "holzfront";
const BASE = "https://holzfront.de";
const COLLECTION = "/collections/holzshop";
const OUT_DIR = `data/scraped/${SOURCE}`;
const CACHE_DIR = `${OUT_DIR}/_cache`;

const { values } = parseArgs({
  options: {
    limit: { type: "string" },
    all: { type: "boolean", default: false },
  },
  allowPositionals: true,
});

async function discoverProductUrls() {
  const { body } = await fetchUrl(BASE + COLLECTION, { cacheDir: CACHE_DIR, intervalMs: 2000 });
  const urls = new Set();
  for (const m of body.matchAll(/href="(\/collections\/holzshop\/products\/[a-z0-9-]+)"/g)) {
    urls.add(BASE + m[1]);
  }
  return [...urls];
}

function parseProductJsonLd(body) {
  const blocks = [...body.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of blocks) {
    try {
      const parsed = JSON.parse(m[1]);
      if (parsed["@type"] === "Product") return parsed;
    } catch {
      // ignore
    }
  }
  return null;
}

async function scrapeProduct(url) {
  const { body } = await fetchUrl(url, { cacheDir: CACHE_DIR, intervalMs: 2000 });
  const jsonld = parseProductJsonLd(body);
  const model = clean(jsonld?.name ?? "") || clean(body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "") || url.split("/").pop();
  const offers = Array.isArray(jsonld?.offers) ? jsonld.offers : jsonld?.offers ? [jsonld.offers] : [];
  const prices = offers
    .map((o) => Number.parseFloat(String(o.price).replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n > 0);
  const cents = prices.length ? Math.round(Math.min(...prices) * 100) : null;
  // Prefer the structured offer price: the first "…,… €" in the markup often
  // belongs to an unrelated teaser and used to be stored as this product's price text.
  const priceMatch = body.match(/(\d{1,3}(?:\.\d{3})*,\d{2})\s*€/);
  const priceTextRaw =
    cents != null
      ? `${(cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`
      : (priceMatch?.[0] ?? null);
  const description =
    clean(jsonld?.description ?? "") || clean(body.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i)?.[1] ?? "");
  // Shopify serves media from the shop's own /cdn/shop/ path, not cdn.shopify.com.
  const images = shopwareImages(body, BASE, jsonld).filter((u) =>
    /\/cdn\/shop\/|cdn\.shopify\.com/.test(u),
  );
  const license = {
    specs: getLicense(SOURCE, "specs"),
    images: getLicense(SOURCE, "images"),
    pdf: getLicense(SOURCE, "pdf"),
  };

  return buildWoodRecord({
    specs: extractSpecTable(body),
    source: SOURCE,
    sourceUrl: url,
    contentHash: contentHash(body),
    brand: "Holzfront",
    model,
    priceCentsPublic: cents,
    priceTextRaw,
    images,
    extra: { description },
    license,
  });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(CACHE_DIR, { recursive: true });

  console.log("Discovering products…");
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
      console.log(`  ✓ ${record.model} — ${record.pricing.price_cents_public ?? "-"} ct`);
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

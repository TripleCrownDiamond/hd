#!/usr/bin/env node
/**
 * Scrape Holzmüller (https://www.holzmueller-shop.de) wood catalogue.
 *
 * - Shopware 6; category cards carry data-product-information JSON (id + name)
 *   and link to /detail/<uuid> product pages
 * - Discover from /holz-brennstoffe/brennholz/ category page
 * - Detail pages: h1 = model, price from JSON-LD / itemprop / price element
 *
 * Output: data/scraped/holzmueller/{yyyy-mm-dd}.jsonl
 * Respects robots.txt, rate limit, cache (via _lib/fetcher).
 */

import { parseArgs } from "node:util";
import { mkdir, writeFile, appendFile } from "node:fs/promises";
import { fetchUrl, contentHash } from "./_lib/fetcher.mjs";
import { getLicense } from "./_lib/licenses.mjs";
import { buildWoodRecord, dedupeSlugs } from "./_lib/wood.mjs";
import { shopwareName, shopwareDescription, shopwareImages, shopwarePriceCents, extractSpecTable } from "./_lib/shopware.mjs";

const SOURCE = "holzmueller";
const BASE = "https://www.holzmueller-shop.de";
// The licence covers the whole shop; firewood alone left the briquette,
// pellet and accessory catalogues empty.
const CATEGORIES = [
  "/holz-brennstoffe/brennholz/",
  "/holz-brennstoffe/briketts/",
  "/holz-brennstoffe/pellets/",
  "/zubehoer/",
];
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
  const urls = new Set();
  for (const category of CATEGORIES) {
    await collectCategory(BASE + category, urls);
  }
  return [...urls];
}

async function collectCategory(categoryUrl, urls) {
  let body;
  try {
    ({ body } = await fetchUrl(categoryUrl, { cacheDir: CACHE_DIR, intervalMs: 2000 }));
  } catch (error) {
    console.warn(`  discovery error ${categoryUrl}: ${error.message}`);
    return;
  }
  for (const m of body.matchAll(/href="([^"]*\/detail\/[a-f0-9]{32})"/g)) {
    const href = m[1];
    if (href.startsWith("/")) urls.add(BASE + href);
    else urls.add(href);
  }
  // also paginated category pages (?p=2&…) may exist — follow a few if linked
  const pagination = [...body.matchAll(/href="([^"]*\?p=\d+[^"]*)"/g)].map((m) => m[1]);
  for (const p of pagination.slice(0, 4)) {
    try {
      const { body: pageBody } = await fetchUrl(p.startsWith("/") ? BASE + p : p, {
        cacheDir: CACHE_DIR,
        intervalMs: 2000,
      });
      for (const m of pageBody.matchAll(/href="([^"]*\/detail\/[a-f0-9]{32})"/g)) {
        const href = m[1];
        if (href.startsWith("/")) urls.add(BASE + href);
        else urls.add(href);
      }
    } catch {
      // ignore pagination fetch errors
    }
  }
}

async function scrapeProduct(url) {
  const { body } = await fetchUrl(url, { cacheDir: CACHE_DIR, intervalMs: 2000 });
  let parsedJsonLd = null;
  const ldMatch = body.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (ldMatch) {
    try {
      parsedJsonLd = JSON.parse(ldMatch[1]);
    } catch {
      parsedJsonLd = null;
    }
  }
  const model = shopwareName(body, parsedJsonLd) ?? new URL(url).pathname.split("/").filter(Boolean).pop();
  const description = shopwareDescription(body, parsedJsonLd);
  const priceCents = shopwarePriceCents(body, parsedJsonLd);
  const priceMatch = [...body.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2})\s*€/g)].find((m) => {
    const n = Number.parseFloat(m[1].replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) && n > 1;
  });
  const images = shopwareImages(body, BASE, parsedJsonLd);
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
    brand: "Holzmüller",
    model,
    priceCentsPublic: priceCents,
    priceTextRaw: priceMatch ? priceMatch[0] : null,
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

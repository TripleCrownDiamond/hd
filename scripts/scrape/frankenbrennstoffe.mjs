#!/usr/bin/env node
/**
 * Scrape Franken Brennstoffe (https://www.frankenbrennstoffe.de) wood catalogue.
 *
 * - Shopware 6; product URLs end with an article id like /…/20001.FB.1
 * - Discover from /Brennstoffe/Sortiment/Brennholz/ category page
 * - Product pages: h1 = model, JSON-LD ProductGroup with name + description,
 *   price from itemprop / price element
 *
 * Output: data/scraped/frankenbrennstoffe/{yyyy-mm-dd}.jsonl
 * Respects robots.txt, rate limit, cache (via _lib/fetcher).
 */

import { parseArgs } from "node:util";
import { mkdir, writeFile, appendFile } from "node:fs/promises";
import { fetchUrl, contentHash } from "./_lib/fetcher.mjs";
import { getLicense } from "./_lib/licenses.mjs";
import { buildWoodRecord, dedupeSlugs } from "./_lib/wood.mjs";
import { shopwareName, shopwareDescription, shopwareImages, shopwarePriceCents, extractSpecTable } from "./_lib/shopware.mjs";

const SOURCE = "frankenbrennstoffe";
const BASE = "https://www.frankenbrennstoffe.de";
// The licence covers the whole shop; firewood alone left the briquette,
// pellet and accessory catalogues empty.
const CATEGORIES = [
  "/Brennstoffe/Sortiment/Brennholz/",
  "/Brennstoffe/Sortiment/Holzbriketts/",
  "/Brennstoffe/Sortiment/Kaminbriketts/",
  "/Brennstoffe/Sortiment/Holzpellets/",
  "/Brennstoffe/Sortiment/Zubehoer/",
  "/Brennstoffe/Beliebte-Typen/Anzuender/",
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
    let body;
    try {
      ({ body } = await fetchUrl(BASE + category, { cacheDir: CACHE_DIR, intervalMs: 2000 }));
    } catch (error) {
      console.warn(`  discovery error ${category}: ${error.message}`);
      continue;
    }
    // product links end with /<article-id> where article id has digits + dots (e.g. 20001.FB.1)
    for (const m of body.matchAll(/href="([^"]+)"/g)) {
      const href = m[1];
      const full = href.startsWith(BASE) ? href : href.startsWith("/") ? BASE + href : null;
      if (!full) continue;
      const path = new URL(full).pathname;
      if (/\/\d{3,6}(\.[A-Z0-9]+)+\.?$/.test(path)) urls.add(full);
    }
  }
  return [...urls];
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
    brand: "Franken Brennstoffe",
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

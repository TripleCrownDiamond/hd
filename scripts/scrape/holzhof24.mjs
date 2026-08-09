#!/usr/bin/env node
/**
 * Scrape Holzhof24 (https://holzhof24.de) wood catalogue from public SSR pages.
 *
 * - Shopware 6; product URLs like /brennholz/<essence>/<slug>/
 * - Discover from /brennholz/ category page + essence subcategories
 * - Product pages: h1 = model, price via JSON-LD / itemprop / price element
 * - Essence (Birke/Buche/…), length cm, unit (RM/SRM/kg/Palette) from the page text
 *
 * Output: data/scraped/holzhof24/{yyyy-mm-dd}.jsonl
 * Respects robots.txt, rate limit, cache (via _lib/fetcher).
 * Wood products only (Brennholz / Kaminholz), accessories filtered out.
 */

import { parseArgs } from "node:util";
import { mkdir, writeFile, appendFile } from "node:fs/promises";
import { fetchUrl, contentHash } from "./_lib/fetcher.mjs";
import { getLicense } from "./_lib/licenses.mjs";
import { buildWoodRecord, dedupeSlugs } from "./_lib/wood.mjs";
import { shopwareName, shopwareDescription, shopwareImages, shopwarePriceCents, extractSpecTable } from "./_lib/shopware.mjs";

const SOURCE = "holzhof24";
const BASE = "https://holzhof24.de";
const OUT_DIR = `data/scraped/${SOURCE}`;
const CACHE_DIR = `${OUT_DIR}/_cache`;

const { values } = parseArgs({
  options: {
    limit: { type: "string" },
    all: { type: "boolean", default: false },
  },
  allowPositionals: true,
});

// The licence covers the whole shop; firewood alone left the briquette, pellet
// and kindling catalogues empty.
const ROOT_CATEGORIES = ["/brennholz/", "/holzbriketts/", "/pellets/", "/anzuendholz/"];

async function discoverProductUrls() {
  const found = new Map(); // url -> true
  const essenceCats = new Set(ROOT_CATEGORIES);
  const queue = [...ROOT_CATEGORIES];
  let depth = 0;
  while (queue.length && depth < 12) {
    const current = queue.shift();
    depth++;
    let body;
    try {
      ({ body } = await fetchUrl(BASE + current, { cacheDir: CACHE_DIR, intervalMs: 2000 }));
    } catch (e) {
      console.warn(`  discovery error ${current}: ${e.message}`);
      continue;
    }
    for (const m of body.matchAll(/href="([^"]+)"[^>]*>/g)) {
      const href = m[1];
      if (!href.startsWith("/") && !href.startsWith(BASE)) continue;
      const path = href.startsWith(BASE) ? new URL(href).pathname : href;
      const root = ROOT_CATEGORIES.find((c) => path.startsWith(c));
      if (!root) continue;
      if (new RegExp(`^${root}[^/]+/[^/]+/$`).test(path)) {
        found.set(BASE + path, true);
      } else if (new RegExp(`^${root}[^/]+/$`).test(path) && !essenceCats.has(path)) {
        // A second-level page is either a sub-category or a product; crawl it
        // and keep it as a candidate. scrapeProduct drops the ones that turn
        // out to be listings.
        essenceCats.add(path);
        queue.push(path);
        found.set(BASE + path, true);
      }
    }
  }
  return [...found.keys()];
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

  // A listing page has neither a JSON-LD Product nor a price; skip it rather
  // than importing the category as if it were an article.
  const isProductPage =
    /"@type"\s*:\s*"Product"/.test(body) || /itemprop="price"/.test(body);
  if (!isProductPage) return null;

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
    brand: "Holzhof24",
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
      if (!record) continue;
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

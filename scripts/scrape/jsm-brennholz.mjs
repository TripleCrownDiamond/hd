#!/usr/bin/env node
/**
 * Scrape JSM Brennholz wood catalogue.
 *
 * - jsm-brennholz.de is the marketing/info site; the actual shop is
 *   https://www.jsmshop24.de (same operator, JSM Investments GmbH)
 * - Product URLs like /Brennholz-Buche-…-25-cm/SW10018.1 (slug / article id)
 * - Discover from /Brennstoffe/Brennholz/ category page
 * - Product pages: h1 = model, JSON-LD Product name/description, price element
 *
 * Output: data/scraped/jsm-brennholz/{yyyy-mm-dd}.jsonl
 * Respects robots.txt, rate limit, cache (via _lib/fetcher).
 */

import { parseArgs } from "node:util";
import { mkdir, writeFile, appendFile } from "node:fs/promises";
import { fetchUrl, contentHash } from "./_lib/fetcher.mjs";
import { getLicense } from "./_lib/licenses.mjs";
import { buildWoodRecord, clean, dedupeSlugs } from "./_lib/wood.mjs";
import { shopwareImages, extractSpecTable } from "./_lib/shopware.mjs";

const SOURCE = "jsm-brennholz";
const BASE = "https://www.jsmshop24.de";
const CATEGORY = "/Brennstoffe/Brennholz/";
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
  const { body } = await fetchUrl(BASE + CATEGORY, { cacheDir: CACHE_DIR, intervalMs: 2000 });
  const urls = new Set();
  // product links end with /<article-id> (e.g. SW10018.1, BBP25) and path mentions Holz
  for (const m of body.matchAll(/href="([^"]+)"/g)) {
    const href = m[1];
    const full = href.startsWith(BASE) ? href : href.startsWith("/") ? BASE + href : href;
    if (!full.startsWith(BASE)) continue;
    const path = new URL(full).pathname;
    if (
      /\/[A-Za-z0-9-]+\/[A-Za-z0-9.]+$/.test(path) &&
      /holz|brenn|kamin/i.test(path) &&
      !/briketts?|pellets?|kohle|anzuend|anmach/i.test(path)
    ) {
      urls.add(full);
    }
  }
  return [...urls];
}

function priceCents(html) {
  // skip cart totals (0,00 €) — find the first plausible product price
  const matches = [...html.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2})\s*€/g)].map((m) => m[1]);
  for (const raw of matches) {
    const n = Number.parseFloat(raw.replace(/\./g, "").replace(",", "."));
    if (Number.isFinite(n) && n > 1) return Math.round(n * 100);
  }
  return null;
}

async function scrapeProduct(url) {
  const { body } = await fetchUrl(url, { cacheDir: CACHE_DIR, intervalMs: 2000 });
  const h1 = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const model = clean(h1?.[1] ?? "") || new URL(url).pathname.split("/").filter(Boolean)[0]?.replace(/-/g, " ");
  let description = null;
  const ldMatch = body.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (ldMatch) {
    try {
      const parsed = JSON.parse(ldMatch[1]);
      description = parsed.name ? `${parsed.name}` : null;
      if (parsed.description && typeof parsed.description === "string") {
        description = clean(parsed.description).slice(0, 800);
      }
    } catch {
      description = null;
    }
  }
  const cents = priceCents(body);
  const priceMatch = [...body.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2})\s*€/g)].find((m) => {
    const n = Number.parseFloat(m[1].replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) && n > 1;
  });
  // The shop renders its payment badges (Visa, Mastercard, Vorkasse) as ordinary
  // /media/ images next to the product photos; the shared extractor filters them.
  const images = shopwareImages(body, BASE).filter((u) => /\/media\//.test(u));
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
    brand: "JSM Brennholz",
    model,
    priceCentsPublic: cents,
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

#!/usr/bin/env node
/**
 * Scrape Kaminholz Berlin (https://www.kaminholz-berlin.com) wood offers.
 *
 * - Same comparison-portal platform as brennio (React SPA): listing pages ship
 *   an ItemList JSON-LD with offer URLs like /guenstig-kaufen/<slug>/<filter>/
 * - Discover: crawl /shop/brennholz/ + subpages, parse ItemList JSON-LD
 * - Offer pages: h1 = full model, price, unit, cm
 *
 * Output: data/scraped/kaminholz-berlin/{yyyy-mm-dd}.jsonl
 * Respects robots.txt, rate limit, cache (via _lib/fetcher).
 * robots.txt disallows /api/, /produktsuche/, /erlebnis-finder/ — not used.
 */

import { parseArgs } from "node:util";
import { mkdir, writeFile, appendFile } from "node:fs/promises";
import { fetchUrl, contentHash } from "./_lib/fetcher.mjs";
import { getLicense } from "./_lib/licenses.mjs";
import { shopwareImages, extractSpecTable } from "./_lib/shopware.mjs";
import { buildWoodRecord, clean } from "./_lib/wood.mjs";

const SOURCE = "kaminholz-berlin";
const BASE = "https://www.kaminholz-berlin.com";
const OUT_DIR = `data/scraped/${SOURCE}`;
const CACHE_DIR = `${OUT_DIR}/_cache`;

const { values } = parseArgs({
  options: {
    limit: { type: "string" },
    all: { type: "boolean", default: false },
  },
  allowPositionals: true,
});

function parseItemListUrls(body) {
  const scripts = [...body.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  for (const s of scripts) {
    if (!s.includes("ItemList")) continue;
    const start = s.indexOf("{");
    try {
      const parsed = JSON.parse(s.slice(start));
      const items = parsed.itemListElement ?? [];
      const urls = items.map((it) => it.url).filter((u) => typeof u === "string" && u.includes("guenstig-kaufen"));
      if (urls.length) return urls;
    } catch {
      // try next script
    }
  }
  return [];
}

async function discoverOfferUrls() {
  const urls = new Map(); // url -> true
  // The shop also sells briquettes, pellets and charcoal; crawling only the
  // firewood listing left those catalogues empty.
  const roots = ["/shop/brennholz/", "/shop/holzbriketts/", "/shop/holzpellets/", "/shop/holzkohle/"];
  const listingPages = new Set(roots);
  for (const root of roots) {
    let mainBody;
    try {
      ({ body: mainBody } = await fetchUrl(BASE + root, { cacheDir: CACHE_DIR, intervalMs: 2000 }));
    } catch (error) {
      console.warn(`  listing error ${root}: ${error.message}`);
      continue;
    }
    for (const m of mainBody.matchAll(new RegExp(`href="(${root}[^"]+)`, "g"))) {
      listingPages.add(m[1]);
    }
  }

  for (const page of listingPages) {
    try {
      const { body } = await fetchUrl(BASE + page, { cacheDir: CACHE_DIR, intervalMs: 2000 });
      for (const u of parseItemListUrls(body)) {
        if (u.startsWith("/")) urls.set(BASE + u, true);
        else urls.set(u, true);
      }
    } catch (e) {
      console.warn(`  listing error ${page}: ${e.message}`);
    }
  }
  return [...urls.keys()];
}

function offerPrice(html) {
  // price is announced in the <title>: "ab 12,50 €"/"ab 12,50&nbsp;€"
  const m = html.match(/ab\s+(\d{1,3}(?:\.\d{3})*,\d{2})\s*(?:&nbsp;|\s)*€/);
  if (m) {
    const n = Number.parseFloat(m[1].replace(/\./g, "").replace(",", "."));
    return { cents: Math.round(n * 100), raw: m[0] };
  }
  const matches = [...html.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2})\s*(?:&nbsp;|\s)*€/g)].map((mm) => mm[1]);
  for (const raw of matches) {
    const n = Number.parseFloat(raw.replace(/\./g, "").replace(",", "."));
    if (Number.isFinite(n) && n > 1) return { cents: Math.round(n * 100), raw: `${raw} €` };
  }
  return { cents: null, raw: null };
}

async function scrapeOffer(url) {
  const { body } = await fetchUrl(url, { cacheDir: CACHE_DIR, intervalMs: 2000 });
  const h1 = clean(body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "") || url.split("/").filter(Boolean).pop()?.replace(/_/g, " ");
  const { cents, raw } = offerPrice(body);
  // This platform serves single-quoted attributes on some templates; the
  // shared extractor is quote-agnostic and also reads srcset/lazy attributes.
  // Keep only media served by the shop itself (payment badges come from
  // basenio.de) and drop the shared explanatory graphics reused site-wide.
  const images = shopwareImages(body, BASE).filter(
    (u) =>
      u.startsWith(BASE) &&
      /uploadcache/.test(u) &&
      !/brennwert-restfeuchte|masseinheiten-brennholz|partner-siegel|invoice|bank-transfer|delivery-cash/i.test(u),
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
    brand: "Kaminholz Berlin",
    model: h1,
    priceCentsPublic: cents,
    priceTextRaw: raw,
    images,
    extra: {},
    license,
  });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(CACHE_DIR, { recursive: true });

  console.log("Discovering offers…");
  const urls = await discoverOfferUrls();
  console.log(`Discovered ${urls.length} offers`);

  const targetCount = values.limit
    ? Number.parseInt(values.limit, 10)
    : values.all
      ? urls.length
      : 10;
  const today = new Date().toISOString().slice(0, 10);
  const outFile = `${OUT_DIR}/${today}.jsonl`;
  const errorsFile = `${OUT_DIR}/_errors.jsonl`;

  // Records are appended as they are scraped; truncate first so re-running on
  // the same day replaces the snapshot instead of duplicating every product.
  await writeFile(outFile, "");

  const records = [];
  for (const url of urls.slice(0, targetCount)) {
    try {
      const record = await scrapeOffer(url);
      records.push(record);
      await appendFile(outFile, JSON.stringify(record) + "\n");
      console.log(`  ✓ ${record.model.slice(0, 60)} — ${record.pricing.price_cents_public ?? "-"} ct`);
    } catch (error) {
      await appendFile(
        errorsFile,
        `${JSON.stringify({ url, error: error.message, at: new Date().toISOString() })}\n`,
      );
      console.error(`  ✗ ${url}: ${error.message}`);
    }
  }
  console.log(`Saved ${records.length}/${targetCount} records to ${outFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

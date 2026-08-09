#!/usr/bin/env node
/**
 * Scrape ECO Reichholz (https://ecoreichholz.com) — firewood, briquettes and
 * ENplus-certified wood pellets, delivered in Germany and Austria.
 *
 * Chosen for the declaration: every product page carries a `Technische
 * Eigenschaften` table with Durchmesser, Heizwert, Restfeuchte, Aschegehalt,
 * Schüttdichte, Holzart and the certification — the figures a buyer compares
 * pellets on, and exactly what the existing pellet sources did not publish.
 *
 * - WooCommerce; product URLs are /produkt/<slug>/
 * - Discovery from the WordPress product sitemap
 * - Labels sit in `<td><strong>…</strong></td>`, handled by extractSpecTable
 *
 * Output: data/scraped/ecoreichholz/{yyyy-mm-dd}.jsonl
 * Respects robots.txt, rate limit and the 24 h disk cache (via _lib/fetcher).
 */

import { parseArgs } from "node:util";
import { mkdir, writeFile, appendFile } from "node:fs/promises";
import { fetchUrl, contentHash } from "./_lib/fetcher.mjs";
import { getLicense } from "./_lib/licenses.mjs";
import { buildWoodRecord, dedupeSlugs, clean } from "./_lib/wood.mjs";
import {
  extractJsonLd,
  extractSpecTable,
  extractTableAfterHeading,
  shopwareImages,
  shopwareName,
  shopwarePriceCents,
} from "./_lib/shopware.mjs";

const SOURCE = "ecoreichholz";
const BASE = "https://ecoreichholz.com";
const SITEMAP = `${BASE}/wp-sitemap-posts-product-1.xml`;
const OUT_DIR = `data/scraped/${SOURCE}`;
const CACHE_DIR = `${OUT_DIR}/_cache`;

const { values } = parseArgs({
  options: {
    limit: { type: "string" },
    all: { type: "boolean", default: false },
    /** Restrict to one product kind, e.g. --kind pellet. */
    kind: { type: "string" },
  },
  allowPositionals: true,
});

async function discoverProductUrls() {
  const { body } = await fetchUrl(SITEMAP, { cacheDir: CACHE_DIR, intervalMs: 2000 });
  return [...body.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => match[1])
    .filter((url) => url.includes("/produkt/"));
}

/**
 * The shop's own summary block, kept as raw source copy.
 *
 * It is stored for traceability and never published: AGENTS.md treats retail
 * prose as a literary work, so only our composed description reaches a page.
 */
function sourceCopy(html) {
  // The heading level varies between product families (h2 on coal, h3 on
  // pellets), so match any level and stop at the next one.
  const section = html.match(
    /<h[23][^>]*>\s*Detaillierte Beschreibung\s*<\/h[23]>([\s\S]*?)<h[23]/i,
  );
  if (!section) return null;
  const paragraphs = [...section[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => clean(match[1]))
    .filter(Boolean);
  return paragraphs.length > 0 ? paragraphs.join(" ") : null;
}

/** Delivery weight in kg, stated by the table rather than guessed from a title. */
function weightKg(specs) {
  const raw = specs["Gesamtgewicht"] ?? specs["Gewicht"];
  if (!raw) return null;
  const match = /(\d{1,3}(?:[.,]\d+)?)\s*kg/i.exec(raw);
  return match ? Number.parseFloat(match[1].replace(",", ".")) : null;
}

async function scrapeProduct(url) {
  const { body } = await fetchUrl(url, { cacheDir: CACHE_DIR, intervalMs: 2000 });
  const jsonld = extractJsonLd(body);
  // Coal tables use plain cells with no <strong>; the `Technische
  // Eigenschaften` heading is what makes them safe to read.
  const specs = {
    ...extractTableAfterHeading(body, /Technische Eigenschaften/i),
    ...extractSpecTable(body),
  };
  const model = shopwareName(body, jsonld) ?? new URL(url).pathname.split("/").filter(Boolean).pop();
  const priceCents = shopwarePriceCents(body, jsonld);
  // Read the amount the offer itself states: the first euro figure in the page
  // belongs to a related-products carousel, not to this product.
  const priceTextRaw =
    priceCents != null ? `${(priceCents / 100).toFixed(2).replace(".", ",")} €` : null;

  return buildWoodRecord({
    specs,
    source: SOURCE,
    sourceUrl: url,
    contentHash: contentHash(body),
    brand: "ECO Reichholz",
    model,
    priceCentsPublic: priceCents,
    priceTextRaw,
    images: shopwareImages(body, BASE, jsonld),
    extra: {
      description: sourceCopy(body),
      origin_de: specs["Produktion"] ?? specs["Herkunft"] ?? null,
      packaging_de: specs["Palette"] ?? specs["Verpackung"] ?? null,
      extra: {
        // Named explicitly so the product page can show them even if the shop
        // renames a row label later.
        norm_de: specs["Zertifikate"] ?? specs["Norm"] ?? null,
        energy_de: specs["Heizwert"] ?? null,
        weight_de: specs["Gesamtgewicht"] ?? specs["Gewicht"] ?? null,
        weight_kg: weightKg(specs),
      },
    },
    license: {
      specs: getLicense(SOURCE, "specs"),
      // Not granted: the shop's sentences stay unpublished, only our composed
      // description reaches the page.
      text: getLicense(SOURCE, "text"),
      images: getLicense(SOURCE, "images"),
      pdf: getLicense(SOURCE, "pdf"),
    },
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
      if (values.kind && record.product_kind !== values.kind) continue;
      records.push(record);
      const declared = Object.keys(record.technical.extra).filter(
        (key) => record.technical.extra[key],
      ).length;
      console.log(
        `  ✓ ${record.model} — ${record.pricing.price_cents_public ?? "-"} ct, ${declared} Angaben`,
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
    records.map((record) => JSON.stringify(record)).join("\n") + (records.length > 0 ? "\n" : ""),
  );
  console.log(`Saved ${records.length} records to ${outFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Scrape A. Reiter GmbH (https://areiter.shop, Meitingen) — pellets, briquettes,
 * grill charcoal and kindling.
 *
 * Chosen for the same reason as ECO Reichholz: the product pages carry a real
 * `<th>/<td>` declaration — Heizwert, Holzart, Durchmesser, Zertifizierung,
 * Verpackungseinheit — instead of a bare delivery unit.
 *
 * - WooCommerce; product URLs are /produkt/<slug>/
 * - Discovery from /product-sitemap.xml
 *
 * Output: data/scraped/areiter/{yyyy-mm-dd}.jsonl
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
  shopwareImages,
  shopwareName,
  shopwarePriceCents,
  productNode,
} from "./_lib/shopware.mjs";

const SOURCE = "areiter";
const BASE = "https://areiter.shop";
const SITEMAP = `${BASE}/product-sitemap.xml`;
const OUT_DIR = `data/scraped/${SOURCE}`;
const CACHE_DIR = `${OUT_DIR}/_cache`;

const { values } = parseArgs({
  options: {
    limit: { type: "string" },
    all: { type: "boolean", default: false },
    kind: { type: "string" },
  },
  allowPositionals: true,
});

/**
 * The shop also sells garden goods. Potting soil and wooden crates are not
 * stove accessories, and `detectProductKind` files anything unrecognised under
 * `accessory`, so they would land in /zubehoer.
 */
const NON_FUEL = /(?:pflanz|blumen|grab)erde|rindenmulch|holzkiste/i;

async function discoverProductUrls() {
  const { body } = await fetchUrl(SITEMAP, { cacheDir: CACHE_DIR, intervalMs: 2000 });
  return [...body.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => match[1])
    .filter((url) => url.includes("/produkt/"));
}

/** Raw retailer copy, stored for traceability and never published as such. */
function sourceCopy(html, product) {
  if (product && typeof product.description === "string" && product.description.trim()) {
    return clean(product.description);
  }
  const panel = html.match(
    /<div[^>]*woocommerce-Tabs-panel--description[^>]*>([\s\S]*?)<\/div>/i,
  );
  if (!panel) return null;
  const paragraphs = [...panel[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => clean(match[1]))
    .filter(Boolean);
  return paragraphs.length > 0 ? paragraphs.join(" ") : null;
}

function weightKg(specs) {
  const raw = specs["Gewicht"] ?? specs["Gesamtgewicht"];
  if (!raw) return null;
  const match = /(\d{1,4}(?:[.,]\d+)?)\s*kg/i.exec(raw);
  return match ? Number.parseFloat(match[1].replace(",", ".")) : null;
}

async function scrapeProduct(url) {
  const { body } = await fetchUrl(url, { cacheDir: CACHE_DIR, intervalMs: 2000 });
  const jsonld = extractJsonLd(body);
  const product = productNode(jsonld);
  const specs = extractSpecTable(body);
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
    brand: "A. Reiter",
    model,
    priceCentsPublic: priceCents,
    priceTextRaw,
    images: shopwareImages(body, BASE, jsonld),
    extra: {
      description: sourceCopy(body, product),
      packaging_de: specs["Verpackungseinheit"] ?? specs["Abnahmevariante"] ?? null,
      extra: {
        norm_de: specs["Zertifizierung"] ?? specs["Zertifikate"] ?? null,
        energy_de: specs["Heizwert"] ?? null,
        weight_de: specs["Gewicht"] ?? specs["Gesamtgewicht"] ?? null,
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
      if (NON_FUEL.test(record.model)) {
        console.log(`  – ${record.model} (kein Brennstoff)`);
        continue;
      }
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

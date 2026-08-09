#!/usr/bin/env node
/**
 * HKI CERT index scraper.
 *
 * It collects the public manufacturer list and the model index for one
 * manufacturer. It deliberately does not mark a product compliant: ambiguous
 * model/version matches must be reviewed before detail records are imported.
 */

import { load as loadCheerio } from "cheerio";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { parseArgs } from "node:util";
import { fetchUrl, contentHash } from "./_lib/fetcher.mjs";

const SOURCE = "hki-cert";
const BASE = "https://www.cert.hki-online.de";
const MANUFACTURERS_URL = `${BASE}/de/geraete/hersteller-liste`;
const OUT_DIR = `data/scraped/${SOURCE}`;
const CACHE_DIR = `${OUT_DIR}/_cache`;

const { values } = parseArgs({
  options: {
    manufacturer: { type: "string", default: "spartherm" },
  },
});

function absoluteUrl(path) {
  return new URL(path, BASE).toString();
}

function normalize(value) {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\b(feuerungstechnik|gmbh|co|kg)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseLinks(html, hrefPart) {
  const $ = loadCheerio(html);
  return $("a")
    .map((_, element) => {
      const href = $(element).attr("href");
      const label = $(element).text().replace(/\s+/g, " ").trim();
      if (!href?.includes(hrefPart) || !label) return null;
      return { label, url: absoluteUrl(href) };
    })
    .get();
}

async function loadLocalProducts() {
  const path = "data/scraped/spartherm/published.jsonl";
  if (!existsSync(path)) return [];
  return (await readFile(path, "utf8"))
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function candidateMatches(productModel, hkiModels) {
  const target = normalize(productModel);
  return hkiModels.filter((item) => {
    const candidate = normalize(item.label);
    return (
      candidate === target ||
      candidate.startsWith(`${target} `) ||
      target.startsWith(`${candidate} `)
    );
  });
}

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });

  const manufacturersResponse = await fetchUrl(MANUFACTURERS_URL, {
    cacheDir: CACHE_DIR,
  });
  const manufacturers = parseLinks(
    manufacturersResponse.body,
    "geraete-nach-hersteller-liste?hersteller=",
  );
  const needle = normalize(values.manufacturer);
  const manufacturer = manufacturers.find((item) =>
    normalize(item.label).includes(needle),
  );

  if (!manufacturer) {
    throw new Error(`Manufacturer not found in HKI CERT: ${values.manufacturer}`);
  }

  const modelsResponse = await fetchUrl(manufacturer.url, { cacheDir: CACHE_DIR });
  const models = parseLinks(modelsResponse.body, "/de/geraete/geraet?id=");
  const localProducts = await loadLocalProducts();
  const matches = localProducts.map((product) => ({
    source: SOURCE,
    source_url: manufacturer.url,
    scraped_at: new Date().toISOString(),
    manufacturer: manufacturer.label,
    product_slug: product.slug,
    product_model: product.model,
    candidates: candidateMatches(product.model, models),
    review_status: "pending",
  }));

  const index = {
    source: SOURCE,
    source_url: MANUFACTURERS_URL,
    scraped_at: new Date().toISOString(),
    content_hash: contentHash(manufacturersResponse.body),
    robots_checked: true,
    manufacturers,
  };
  const modelIndex = {
    source: SOURCE,
    source_url: manufacturer.url,
    scraped_at: new Date().toISOString(),
    content_hash: contentHash(modelsResponse.body),
    manufacturer: manufacturer.label,
    models,
  };

  await writeFile(
    `${OUT_DIR}/manufacturers.json`,
    `${JSON.stringify(index, null, 2)}\n`,
  );
  await writeFile(
    `${OUT_DIR}/${values.manufacturer.toLowerCase()}-models.json`,
    `${JSON.stringify(modelIndex, null, 2)}\n`,
  );
  await writeFile(
    `${OUT_DIR}/${values.manufacturer.toLowerCase()}-matches.jsonl`,
    matches.map((record) => JSON.stringify(record)).join("\n") + "\n",
  );

  const exact = matches.filter((match) => match.candidates.length === 1).length;
  const ambiguous = matches.filter((match) => match.candidates.length > 1).length;
  const missing = matches.filter((match) => match.candidates.length === 0).length;
  console.log(
    JSON.stringify(
      {
        manufacturers: manufacturers.length,
        manufacturer: manufacturer.label,
        models: models.length,
        localProducts: localProducts.length,
        matches: { exact, ambiguous, missing },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

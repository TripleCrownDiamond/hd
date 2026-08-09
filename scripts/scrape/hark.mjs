#!/usr/bin/env node

import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { load as loadCheerio } from "cheerio";
import { contentHash, fetchUrl } from "./_lib/fetcher.mjs";
import { getLicense } from "./_lib/licenses.mjs";

const SOURCE = "hark";
const BASE = "https://www.hark.de";
const CATEGORY = `${BASE}/kaminoefen/`;
const GRAPHQL = `${BASE}/graphql`;
const OUT_DIR = `data/scraped/${SOURCE}`;
const CACHE_DIR = `${OUT_DIR}/_cache`;

const { values } = parseArgs({
  options: {
    limit: { type: "string" },
    all: { type: "boolean", default: false },
  },
  allowPositionals: true,
});

function clean(value) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function euroToCents(value) {
  if (value == null || value === "") return null;
  const normalized = String(value)
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : null;
}

async function getProductUrls() {
  const urls = new Set();
  for (let page = 0; page < 20; page++) {
    const url =
      `${CATEGORY}?ldtype=grid&_artperpage=24&pgNr=${page}` +
      "&cl=alist&cnid=dc87cdcd4aad02a8e41e14c8ede4e29b";
    const { body } = await fetchUrl(url, { cacheDir: CACHE_DIR });
    const $ = loadCheerio(body);
    const before = urls.size;
    $(".kmt-productbox-head a[href]").each((_index, element) => {
      const href = $(element).attr("href");
      if (!href?.includes("/kaminoefen/")) return;
      const productUrl = new URL(href, BASE);
      if (!productUrl.pathname.endsWith(".html")) return;
      productUrl.search = "";
      urls.add(productUrl.toString());
    });
    if (urls.size === before) break;
  }
  return [...urls];
}

function extractVariationAxes($) {
  return $('[data-init="kmt-variantselection"]')
    .map((_index, element) => {
      const root = $(element);
      const label = clean(root.find(".caption").first().text());
      const options = root
        .find(".kmt-colorbox[data-value], .kmt-variantitem[data-value]")
        .map((_optionIndex, option) => ({
          value: $(option).attr("data-value"),
          label: clean(
            $(option).find(".kmt-colorbox-label, .p-md").first().text() ||
              $(option).attr("title"),
          ),
        }))
        .get()
        .filter((option) => option.value && option.label);
      const name =
        root.find('input[name^="varselid"]').first().attr("name") ??
        root.find("[data-name]").first().attr("data-name");
      return label && name && options.length > 0 ? { name, label, options } : null;
    })
    .get()
    .filter(Boolean);
}

function buildSelectedUrl(sourceUrl, $, axes) {
  const url = new URL(sourceUrl);
  $('input[name^="varselid"]').each((_index, input) => {
    const name = $(input).attr("name");
    const value = $(input).attr("value");
    if (name && value) url.searchParams.set(name, value);
  });
  for (const axis of axes) {
    if (!url.searchParams.has(axis.name)) {
      url.searchParams.set(axis.name, axis.options[0].value);
    }
  }
  return url.toString();
}

function extractSpecs($) {
  const specs = {};
  $("#attributes tr.kmt-attrgrp-item").each((_index, row) => {
    const titleCell = $(row).find(".kmt-attrgrp-itemtitle").first().clone();
    titleCell.find(".kmt-icon").remove();
    const label = clean(titleCell.text());
    const value = clean($(row).find(".kmt-attrgrp-value").first().text());
    if (label && value) specs[label] = value;
  });
  return specs;
}

function extractDescription($) {
  const content = $('a[href="#description"]')
    .first()
    .closest(".kmt-tablist-content")
    .find(".kmt-tablist-body")
    .first();
  return clean(content.text());
}

function extractImages($) {
  return [
    ...new Set(
      $("a.swiper-slide[data-pswp-src]")
        .map((_index, element) => $(element).attr("data-pswp-src"))
        .get()
        .filter(Boolean)
        .map((url) => {
          const parsed = new URL(url, BASE);
          parsed.search = "";
          return parsed.toString();
        }),
    ),
  ];
}

function extractDocumentFilter($) {
  const raw = $("a.kmt-document[data-options-kmt-finder]")
    .first()
    .attr("data-options-kmt-finder");
  if (!raw) return null;
  try {
    return JSON.parse(raw).selectedValues ?? null;
  } catch {
    return null;
  }
}

async function fetchDocuments(filter) {
  if (!filter?.product) return [];
  const requestBody = JSON.stringify({
    operationName: "documentSelectionResult",
    variables: {
      productGroup: filter.productGroup,
      product: filter.product,
      productModel: filter.productModel,
    },
    query:
      "query documentSelectionResult($productGroup: String, $product: String, " +
      "$productModel: String, $documentType: String) {" +
      " documentSelectionResult(filter: {document: {productGroup: $productGroup, " +
      "product: $product, productModel: $productModel, documentType: $documentType}}, " +
      "pagination: {offset: 0}) { productGroup product productModel documentId " +
      "documentType document documentSize documentUrl documentCreationDate " +
      "documentExpirationDate } }",
  });
  const { body } = await fetchUrl(GRAPHQL, {
    method: "POST",
    requestBody,
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    cacheDir: CACHE_DIR,
  });
  const payload = JSON.parse(body);
  return payload.data?.documentSelectionResult ?? [];
}

function extractPriceFromScripts(html) {
  const match = html.match(
    /details(?:OrVariant)?Product\s*=\s*\{[^}]*'price'\s*:\s*'([\d.,]+)'/,
  );
  if (!match) return null;
  const amount = Number.parseFloat(match[1].replace(",", "."));
  return Number.isFinite(amount) ? Math.round(amount * 100) : null;
}

async function scrapeProduct(sourceUrl) {
  const licenseTxt = getLicense(SOURCE, "specs");
  const licenseImg = getLicense(SOURCE, "images");
  const licensePdf = getLicense(SOURCE, "pdf");
  const { body } = await fetchUrl(sourceUrl, { cacheDir: CACHE_DIR });
  const $ = loadCheerio(body);
  const axes = extractVariationAxes($);
  const selectedUrl = buildSelectedUrl(sourceUrl, $, axes);
  const { body: selectedBody } =
    selectedUrl === sourceUrl
      ? { body }
      : await fetchUrl(selectedUrl, { cacheDir: CACHE_DIR });
  const selected$ = loadCheerio(selectedBody);

  const name = clean($("h1").first().text());
  const sku =
    clean($('.text-gray:contains("Artikelnummer:")').first().text()).replace(
      /^Artikelnummer:\s*/,
      "",
    ) || $('input[name="anid"]').first().attr("value");
  const priceMinCents =
    extractPriceFromScripts(body) ?? euroToCents(clean($(".kmt-price").first().text()));
  const selectedPriceCents = extractPriceFromScripts(selectedBody) ?? priceMinCents;
  const pagePriceText = clean(
    $(".kmt-productbox-prices, .kmt-price").first().parent().text(),
  );
  const priceNumbers = [...pagePriceText.matchAll(/\d{1,3}(?:\.\d{3})*,\d{2}/g)]
    .map((match) => euroToCents(match[0]))
    .filter((value) => value != null);
  const documentFilter = extractDocumentFilter($);
  const documents = await fetchDocuments(documentFilter);

  return {
    source: SOURCE,
    source_url: sourceUrl,
    selected_source_url: selectedUrl,
    source_locale: "de-DE",
    scraped_at: new Date().toISOString(),
    content_hash: contentHash(body),
    type: "stove",
    brand: "HARK",
    model: name.replace(/^Kaminofen\s+/i, ""),
    slug: `hark-${slugify(name.replace(/^Kaminofen\s+/i, ""))}`,
    identifiers: {
      sku: sku || null,
      ean: null,
      hki_id: null,
    },
    descriptions: {
      long_de_raw: extractDescription($) || null,
      long_de_authorized: licenseTxt.authorized,
    },
    technical: {
      energy_class:
        clean($(".kmt-energylabelwrapper").first().text()).match(/[A-G]\+{0,2}/)?.[0] ??
        null,
      specs: extractSpecs(selected$),
    },
    variations: axes,
    pricing: {
      currency: "EUR",
      vat_included: true,
      price_cents_selected: selectedPriceCents,
      price_cents_min: priceMinCents,
      price_cents_max:
        priceNumbers.length > 0 ? Math.max(...priceNumbers) : selectedPriceCents,
      quote_mode: false,
    },
    media: {
      image_urls_source: extractImages($),
      licensed_to_download: licenseImg.authorized,
      downloaded_local_paths: [],
    },
    documents: {
      sources: documents.map((document) => ({
        id: document.documentId,
        type: document.documentType,
        title: document.document,
        size: document.documentSize,
        source_url: document.documentUrl,
        created_at: document.documentCreationDate,
        expires_at: document.documentExpirationDate,
      })),
      licensed_to_download: licensePdf.authorized,
      downloaded_local_paths: [],
    },
    excluded: {
      manufacturer_contacts: true,
    },
    authorized: licenseTxt.authorized && licenseImg.authorized,
    review_status: "pending",
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(CACHE_DIR, { recursive: true });

  const allUrls = await getProductUrls();
  const limit = values.limit
    ? Number.parseInt(values.limit, 10)
    : values.all
      ? allUrls.length
      : 3;
  const targetUrls = allUrls.slice(0, limit);
  const today = new Date().toISOString().slice(0, 10);
  const outFile = `${OUT_DIR}/${today}.jsonl`;
  const errorsFile = `${OUT_DIR}/_errors.jsonl`;

  console.log(`HARK scrape — ${targetUrls.length}/${allUrls.length} products`);
  let saved = 0;
  const records = [];
  for (const sourceUrl of targetUrls) {
    try {
      const record = await scrapeProduct(sourceUrl);
      records.push(record);
      saved++;
      console.log(
        `  ✓ ${record.model} — ${record.pricing.price_cents_selected} ct, ` +
          `${record.variations.length} axes, ` +
          `${Object.keys(record.technical.specs).length} specs, ` +
          `${record.documents.sources.length} docs`,
      );
    } catch (error) {
      await appendFile(
        errorsFile,
        `${JSON.stringify({ sourceUrl, error: error.message, at: new Date().toISOString() })}\n`,
      );
      console.error(`  ✗ ${sourceUrl}: ${error.message}`);
    }
  }
  await writeFile(
    outFile,
    records.map((record) => JSON.stringify(record)).join("\n") +
      (records.length > 0 ? "\n" : ""),
  );
  console.log(`Saved ${saved}/${targetUrls.length} records to ${outFile}`);
  if (saved !== targetUrls.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

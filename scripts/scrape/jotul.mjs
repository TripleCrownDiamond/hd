#!/usr/bin/env node
/**
 * Scrape Jøtul Germany product catalogue from public product pages.
 *
 * The public JSON API (/api/search) is blocked by robots.txt, so we use the
 * allowed sitemap.xml (146 DE product URLs) and extract each product document
 * from the Next.js RSC payload embedded in the SSR HTML (same data as the API).
 *
 * Output: data/scraped/jotul/{yyyy-mm-dd}.jsonl  (one record per product)
 * Respects robots.txt, rate limit, cache (via _lib/fetcher).
 * No DE prices are published by Jøtul (reseller network).
 */

import { parseArgs } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import { fetchUrl, contentHash } from "./_lib/fetcher.mjs";
import { getLicense } from "./_lib/licenses.mjs";

const SOURCE = "jotul";
const BASE = "https://www.jotul.com";
const OUT_DIR = `data/scraped/${SOURCE}`;
const CACHE_DIR = `${OUT_DIR}/_cache`;

const { values } = parseArgs({
  options: {
    limit: { type: "string" },
    all: { type: "boolean", default: false },
  },
  allowPositionals: true,
});

const de = (obj) => obj?.deDE ?? null;
const deDash = (obj) => obj?.["de-DE"] ?? null;

function clean(value) {
  return value
    ?.replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim() ?? "";
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/æ/g, "ae")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function findSpec(specs, code) {
  const found = specs.find((s) => s.code === code);
  return found?.value ? clean(found.value) : null;
}

function toNumber(value) {
  if (value == null || value === "") return null;
  const parsed = Number.parseFloat(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function mapEcoLabel(label) {
  if (!label) return null;
  if (label === "APlus") return "A+";
  if (label === "AMinus") return "A-";
  return label;
}

/** Extract the Sanity product document from the Next.js RSC payload. */
function extractProductDocument(html) {
  const pushes = [...html.matchAll(/self\.__next_f\.push\(\[1,("[\s\S]*?")\]\)/g)].map((m) => {
    try {
      return JSON.parse(m[1]);
    } catch {
      return m[1];
    }
  });
  const joined = pushes.join("");
  const idIdx = joined.indexOf('"_id":"product.');
  if (idIdx === -1) return null;
  const startIdx = joined.lastIndexOf("{", idIdx);

  let depth = 0;
  let inString = false;
  let escaped = false;
  let endIdx = -1;
  for (let i = startIdx; i < joined.length; i++) {
    const c = joined[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (c === "\\") {
        escaped = true;
        continue;
      }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }
  if (endIdx === -1) return null;
  try {
    return JSON.parse(joined.slice(startIdx, endIdx + 1));
  } catch {
    return null;
  }
}

async function fetchProductPage(url) {
  const { body } = await fetchUrl(url, { cacheDir: CACHE_DIR, intervalMs: 2000 });
  return extractProductDocument(body);
}

function recordFromHit(hit, sourceUrl) {
  const licenseTxt = getLicense(SOURCE, "specs");
  const licenseImg = getLicense(SOURCE, "images");
  const licensePdf = getLicense(SOURCE, "pdf");
  const specs = hit.technicalSpecifications || [];
  const categoryDe = de(hit.productType?.labels) || hit.productType?.title || "stove";
  const model = de(hit.titleI18n) || hit.title || hit.routeSlug || "";
  const modelSlug = slugify(model || hit.routeSlug).replace(/^jotul-/, "");
  const slug = `jotul-${modelSlug}`;

  const images = [];
  const heroUrl = hit.heroImage?.url;
  if (heroUrl) images.push(heroUrl);
  for (const variant of hit.variants || []) {
    for (const img of variant.images || []) {
      if (img.url && !images.includes(img.url)) images.push(img.url);
    }
  }

  const documents = (hit.documents || []).map((doc) => ({
    filename: doc.filename,
    title: deDash(doc.displayNames) ?? doc.filename,
    locale_keys: doc.localeKeys || [],
    url: doc.url,
  }));

  return {
    source: SOURCE,
    source_url: sourceUrl,
    scraped_at: new Date().toISOString(),
    content_hash: contentHash(JSON.stringify(hit)),
    type: "stove",
    brand: "Jøtul",
    model,
    slug,
    identifiers: {
      sku: hit.productNumber ?? null,
      ean: null,
      hki_id: null,
    },
    product_type_key: hit.productTypeKey,
    product_type_de: categoryDe,
    product_number: hit.productNumber,
    descriptions: {
      long_de_raw: clean(de(hit.descriptionI18n)) || null,
      bullets_de_raw: clean(de(hit.bulletsI18n)) || null,
      description_authorized: licenseTxt.authorized,
    },
    technical: {
      energy_class: mapEcoLabel(hit.ecoLabel),
      power_kw_nominal: toNumber(findSpec(specs, "AtrNominelOutput")),
      power_kw_min: toNumber(findSpec(specs, "AtrMinOutput")),
      power_kw_max: toNumber(findSpec(specs, "AtrMaxOutput")),
      efficiency_pct: toNumber(findSpec(specs, "AtrEfficiency")),
      heating_capacity_m2: toNumber(findSpec(specs, "AtrHeatingCapacity")),
      log_size_mm: toNumber(findSpec(specs, "AtrProductLogSize")),
      flue_outlet_mm: toNumber(findSpec(specs, "AtrFlueOutlet")),
      flue_exit_options: findSpec(specs, "AtrFlueExitOptions"),
      safety_distance: findSpec(specs, "AtrSafetyDistance"),
      height_mm: toNumber(findSpec(specs, "AtrProductHeight")),
      width_mm: toNumber(findSpec(specs, "AtrProductWidth")),
      depth_mm: toNumber(findSpec(specs, "AtrProductDepth")),
      weight_kg: toNumber(findSpec(specs, "AtrProductWeight")),
      co_emission: findSpec(specs, "AtrCOEmission"),
      co_mg_nm3: findSpec(specs, "AtrCOEmissionNM3"),
      ogc_mg_nm3: toNumber(findSpec(specs, "AtrOGCEmission")),
      nox_mg_nm3: toNumber(findSpec(specs, "AtrNOxEmission")),
      dust_mg_nm3: toNumber(findSpec(specs, "AtrDustProductEmission")),
      specs: specs.reduce((acc, s) => {
        acc[s.code] = s.value ?? null;
        return acc;
      }, {}),
    },
    certifications: (hit.usps || []).map((u) => u.code),
    variants: (hit.variants || []).map((v) => ({
      color: v.color ?? null,
      color_hex: v.colorHex ?? null,
      product_number: v.productNumber ?? null,
      images: (v.images || []).map((i) => i.url).filter(Boolean),
    })),
    media: {
      image_urls_source: images,
      licensed_to_download: licenseImg.authorized,
      downloaded_local_paths: [],
    },
    documents: {
      sources: documents,
      licensed_to_download: licensePdf.authorized,
      downloaded_local_paths: [],
    },
    excluded: {
      manufacturer_contacts: true,
      prices: "No DE prices published by Jøtul (reseller network).",
    },
    authorized: licenseTxt.authorized && licenseImg.authorized,
    review_status: "pending",
  };
}

async function getProductUrls() {
  const { body } = await fetchUrl(`${BASE}/sitemap.xml`, {
    cacheDir: CACHE_DIR,
    intervalMs: 2000,
  });
  const urls = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  // /de/produkte/<category> are listing pages with no product document; only
  // /de/produkte/<category>/<model> is a product. Filtering them out here keeps
  // the run's "saved/total" count meaningful instead of reporting 9 failures.
  return urls.filter((u) => /\/de\/produkte\/[^/]+\/[^/]+/.test(new URL(u).pathname));
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(CACHE_DIR, { recursive: true });

  console.log("Fetching sitemap…");
  const productUrls = await getProductUrls();
  console.log(`Product URLs (DE): ${productUrls.length}`);

  const targetCount = values.limit
    ? Number.parseInt(values.limit, 10)
    : values.all
      ? productUrls.length
      : 10;

  const records = [];
  for (const url of productUrls.slice(0, targetCount)) {
    const hit = await fetchProductPage(url);
    if (!hit) {
      console.warn(`  ✗ no product document in ${url}`);
      continue;
    }
    records.push(recordFromHit(hit, url));
    console.log(`  ✓ ${records.at(-1).model} (${records.at(-1).product_type_de})`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const outFile = `${OUT_DIR}/${today}.jsonl`;
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

#!/usr/bin/env node
/**
 * Spartherm scraper — Kaminöfen catalog.
 *
 * Approach:
 *   - Sitemap `?sitemap=products` gives all product URLs.
 *   - We keep only those whose JSON-LD `category` is "Kaminöfen".
 *   - Each product page ships a JSON-LD `Product` with almost every spec.
 *   - Images gallery, videos, swatches are in `/images/products/…` — extracted by regex.
 *
 * Usage:
 *   pnpm run scrape:spartherm -- --limit 3
 *   pnpm run scrape:spartherm -- --all
 *   pnpm run scrape:spartherm -- --urls slug-a,slug-b
 */

import { fetchUrl, contentHash } from "./_lib/fetcher.mjs";
import { getLicense } from "./_lib/licenses.mjs";
import { runMiniBatchGate } from "./_lib/verify.mjs";
import { extractSparthermDocuments } from "./_lib/spartherm-documents.mjs";
import { load as loadCheerio } from "cheerio";
import { mkdir, writeFile, appendFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { existsSync } from "node:fs";

const SOURCE = "spartherm";
const BASE = "https://www.spartherm.com";
const SITEMAP_PRODUCTS =
  "https://www.spartherm.com/de/sitemap.xml?sitemap=products&cHash=aeed94175246a6020171939254d4bd7d";
const OUT_DIR = `data/scraped/${SOURCE}`;
const CACHE_DIR = `${OUT_DIR}/_cache`;

const { values } = parseArgs({
  options: {
    limit: { type: "string" },
    urls: { type: "string" },
    all: { type: "boolean", default: false },
  },
  allowPositionals: true,
});

async function ensureDirs() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(CACHE_DIR, { recursive: true });
}

async function fetchAllProductUrls() {
  const { body } = await fetchUrl(SITEMAP_PRODUCTS, { cacheDir: CACHE_DIR });
  const urls = [];
  const re = /<loc>(https:\/\/www\.spartherm\.com\/de\/produkt\/[^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(body)) !== null) urls.push(m[1]);
  return urls;
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[äáàâ]/g, "a")
    .replace(/[öóòô]/g, "o")
    .replace(/[üúùû]/g, "u")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toNumber(s) {
  if (s == null) return null;
  const cleaned = String(s).replace(/[^\d,.-]/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function extractJsonLd(html) {
  const m = html.match(
    /<script type="application\/ld\+json"[^>]*>([\s\S]+?)<\/script>/,
  );
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

/**
 * Group additionalProperty entries by name (some names repeat = list values).
 */
function groupProperties(props = []) {
  const out = {};
  for (const p of props) {
    const key = p.name;
    if (out[key] === undefined) out[key] = p.value;
    else if (Array.isArray(out[key])) out[key].push(p.value);
    else out[key] = [out[key], p.value];
  }
  return out;
}

function parsePowerRange(text) {
  // "4,5 bis 7,7 kW" | "6,5 kW" | "4,5 - 7,7 kW"
  if (!text) return { min: null, max: null, nominal: null };
  const s = String(text);
  const range = s.match(/(\d+[.,]\d+|\d+)\s*(?:bis|-|–|—)\s*(\d+[.,]\d+|\d+)/i);
  if (range) return { min: toNumber(range[1]), max: toNumber(range[2]), nominal: null };
  const single = s.match(/(\d+[.,]\d+|\d+)/);
  if (single) return { min: null, max: null, nominal: toNumber(single[1]) };
  return { min: null, max: null, nominal: null };
}

function parseDimensionMm(text) {
  if (!text) return null;
  const m = String(text).match(/(\d[\d\s.,]*)\s*mm/);
  if (!m) return null;
  return toNumber(m[1].replace(/\./g, "").replace(/\s/g, ""));
}

/**
 * Extract product images with STRICT model-slug filter.
 * Spartherm stores images in a shared family folder (e.g. products/fireplace/ambiente/)
 * so a naïve regex captures images of sibling products (a3, a4, a4-h2o). We only
 * keep files whose basename explicitly contains the full model slug tokens.
 */
function extractImageUrls(html, modelSlug) {
  const tokens = modelSlug.split("-").filter((t) => t.length > 0);
  const matchesModel = (basename) => {
    const b = basename.toLowerCase().replace(/_/g, "-").replace(/[^a-z0-9-]/g, "");
    return tokens.every((t) => b.includes(t));
  };

  const raw = new Set();
  const reRaw = /\/images\/products\/[a-z0-9/_.-]+\.(?:png|jpg|jpeg|webp)/gi;
  let m;
  while ((m = reRaw.exec(html)) !== null) {
    const basename = m[0].split("/").pop();
    if (matchesModel(basename)) raw.add(m[0]);
  }

  const processed = new Set();
  const reProc = /\/images\/_processed_\/[a-z0-9/_.-]+\.(?:png|jpg|jpeg|webp)/gi;
  while ((m = reProc.exec(html)) !== null) {
    const basename = m[0].split("/").pop();
    if (matchesModel(basename)) processed.add(m[0]);
  }

  return {
    raw: [...raw].map((u) => (u.startsWith("http") ? u : BASE + u)),
    processed: [...processed].map((u) => BASE + u),
  };
}

function extractVideoUrls(html, modelSlug) {
  const tokens = modelSlug.split("-").filter((t) => t.length > 0);
  const matchesModel = (basename) => {
    const b = basename.toLowerCase().replace(/_/g, "-").replace(/[^a-z0-9-]/g, "");
    return tokens.every((t) => b.includes(t));
  };
  const set = new Set();
  const re = /(?:https:\/\/www\.spartherm\.com)?\/images\/products\/[^"' ]+\.(?:mp4|webm)/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const basename = m[0].split("/").pop();
    if (!matchesModel(basename)) continue;
    const url = m[0].startsWith("http") ? m[0] : BASE + m[0];
    set.add(url);
  }
  return [...set];
}

/**
 * Detect color variants from JSON-LD (multiple `Farbe` values) and pair each
 * with the most likely image / video by matching filename tokens.
 */
/**
 * Colour aliases used in Spartherm filenames.
 * "Black Edition" → files use `_BE` suffix.
 * "Perle" swatch is served as `pearl.jpg`.
 * etc.
 */
const COLOR_FILE_ALIASES = {
  "black-edition": ["be", "black-edition", "blackedition"],
  perle: ["perle", "pearl"],
  weiss: ["weiss", "white"],
  kupfer: ["kupfer", "copper"],
  titan: ["titan", "titanium"],
  nero: ["nero", "black"],
  elfenbein: ["ivory", "elfenbein"],
};
const SWATCH_ALIASES = {
  perle: "pearl",
  weiss: "white",
  kupfer: "copper",
  elfenbein: "ivory",
};

function variantMatchers(code) {
  return COLOR_FILE_ALIASES[code] ?? [code];
}

function buildVariants(props, modelSlug, images, videos) {
  const raw = props["Farbe"];
  if (!raw) return [];
  const colors = Array.isArray(raw) ? raw : [raw];
  const modelTokens = modelSlug.split("-").filter((t) => t.length > 0);

  return colors.map((label) => {
    const code = slugify(label);
    const aliases = variantMatchers(code);
    const swatchName = SWATCH_ALIASES[code] ?? code;
    const swatchGuess = `${BASE}/images/products/surfaces/${swatchName}.jpg`;

    const findBest = (list, kinds) => {
      // 1) Prefer files that contain the full slug + variant alias AND avoid extras.
      //    Split candidates by aliases; among those, prefer the shortest basename.
      const scored = list
        .map((u) => {
          const b = u.split("/").pop().toLowerCase().replace(/[^a-z0-9]/g, "");
          const hasModel = modelTokens.every((t) => b.includes(t));
          if (!hasModel) return null;
          const alias = aliases.find((a) => b.includes(a.replace(/[^a-z0-9]/g, "")));
          if (!alias) return null;
          // penalise "-be" ending only for non-BE codes
          if (code !== "black-edition" && /be(-|$|\.)/.test(b)) return null;
          if (kinds === "image") {
            // penalise animation variants and only-fire variants
            if (b.includes("ani")) return null;
            if (b.includes("feuer")) return null;
            // prefer the simplest "modelslug-colour" without extra "schwarze-schamotte"
            const extraTokens = (b.match(/-/g) ?? []).length;
            return { url: u, score: extraTokens };
          }
          return { url: u, score: 0 };
        })
        .filter(Boolean)
        .sort((a, b) => a.score - b.score);
      return scored[0]?.url ?? null;
    };

    // Pick a video that matches the exact colour, prefer animation files.
    const findVideo = (list) => {
      const scored = list
        .map((u) => {
          const b = u.split("/").pop().toLowerCase().replace(/[^a-z0-9]/g, "");
          const hasModel = modelTokens.every((t) => b.includes(t));
          if (!hasModel) return null;
          const alias = aliases.find((a) => b.includes(a.replace(/[^a-z0-9]/g, "")));
          if (!alias) return null;
          if (code !== "black-edition" && /be(-|$|\.)/.test(b)) return null;
          return u;
        })
        .filter(Boolean);
      return scored[0] ?? null;
    };

    return {
      axis: "color",
      code,
      label_de: label,
      swatch_url_source: swatchGuess,
      main_image_url_source: findBest(images.raw, "image"),
      video_url_source: findVideo(videos),
      surcharge_cents: null,
    };
  });
}

function extractSubtitle(html) {
  // Try to grab an editorial subtitle used above the product name.
  const m =
    html.match(/<h3[^>]*class="[^"]*text-white[^"]*"[^>]*>([^<]{4,120})<\/h3>/) ||
    html.match(/<span[^>]*class="[^"]*subtitle[^"]*"[^>]*>([^<]{4,120})<\/span>/);
  return m ? m[1].trim() : null;
}

/**
 * Choose the hero image: prefer the first "milieu" (context shot) if any,
 * otherwise the first product-color image.
 */
function pickHero(images) {
  const milieu = images.processed.find((u) => u.toLowerCase().includes("milieu"));
  if (milieu) return milieu;
  return images.raw[0] ?? images.processed[0] ?? null;
}

function shortDescription(long) {
  if (!long) return null;
  // Strip HTML entities/tags roughly, take first sentence, cap at 220 chars.
  const clean = long
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const dot = clean.indexOf(". ");
  const s = dot > 0 ? clean.slice(0, dot + 1) : clean;
  return s.length > 220 ? s.slice(0, 217) + "…" : s;
}

async function scrapeProduct(url) {
  const { body, fromCache } = await fetchUrl(url, { cacheDir: CACHE_DIR });
  const jsonld = extractJsonLd(body);
  if (!jsonld || jsonld["@type"] !== "Product") {
    return { ok: false, reason: "no Product JSON-LD", url };
  }
  if (jsonld.category !== "Kaminöfen") {
    return { ok: false, reason: `category=${jsonld.category}`, url };
  }

  const $ = loadCheerio(body);
  const props = groupProperties(jsonld.additionalProperty ?? []);
  const power = parsePowerRange(props["Wärmeleistung"]);
  const modelSlug = slugify(jsonld.name);
  const images = extractImageUrls(body, modelSlug);
  const videos = extractVideoUrls(body, modelSlug);
  const variants = buildVariants(props, modelSlug, images, videos);
  const subtitle = extractSubtitle(body);
  const licenseImg = getLicense(SOURCE, "images");
  const licenseVid = getLicense(SOURCE, "videos");
  const licensePdf = getLicense(SOURCE, "pdf");
  const licenseTxt = getLicense(SOURCE, "specs");

  const pdfDocuments = extractSparthermDocuments($);

  const heroFromJsonld = Array.isArray(jsonld.image) ? jsonld.image[0] : jsonld.image;
  const hero = heroFromJsonld ?? pickHero(images);

  const record = {
    source: SOURCE,
    source_url: url,
    source_locale: "de-DE",
    scraped_at: new Date().toISOString(),
    content_hash: contentHash(body),
    type: "stove",
    brand: (jsonld.brand?.name) || "Spartherm",
    model: jsonld.name,
    slug: `${SOURCE}-${slugify(jsonld.name)}`,
    identifiers: {
      ean: null,
      sku: props["Artikelnummer"] ?? null,
      hki_id: null,
      manufacturer_id: null,
    },
    category_source_label: jsonld.category,
    descriptions: {
      subtitle_de: subtitle,
      short_de: shortDescription(jsonld.description),
      long_de_raw: jsonld.description ?? null,
      long_de_authorized: licenseTxt.authorized,
    },
    technical: {
      power_kw_min: power.min,
      power_kw_max: power.max,
      power_kw_nominal: power.nominal,
      efficiency_pct: toNumber(props["Wirkungsgrad"]),
      energy_class: props["Energieeffizienzklasse"] ?? null,
      fuel: props["Brennstoff"] ?? null,
      flue_diameter_mm: parseDimensionMm(props["Rauchrohranschluss"] ?? props["Abgasstutzendurchmesser"]),
      connection: props["Abgasstutzenposition"] ?? props["Rauchrohranschluss"] ?? null,
      dimensions_mm: {
        height: parseDimensionMm(props["Gesamthöhe"] ?? props["Höhe"]),
        width: parseDimensionMm(props["Gesamtbreite"] ?? props["Breite"]),
        depth: parseDimensionMm(props["Gesamttiefe"] ?? props["Tiefe"]),
      },
      weight_kg: toNumber(props["Gewicht"]),
      co_mg_nm3: toNumber(props["CO-Emission"]),
      ogc_mg_nm3: toNumber(props["OGC-Emission"]),
      particulates_mg_nm3: toNumber(props["Staub-Emission"] ?? props["Feinstaub"]),
      raw_air_independent: props["Raumluftunabhängig (RLU)"] ?? null,
      extra: props,
    },
    variants,
    media: {
      hero_image_url_source: hero,
      gallery_url_sources: images.raw,
      video_url_sources: videos,
      energy_label_url_source:
        images.processed.find((u) => u.toLowerCase().includes("energy-efficiency-class")) ?? null,
      licensed_to_download: licenseImg.authorized || licenseVid.authorized,
      downloaded_local_paths: [],
    },
    brochures_pdf: {
      sources: pdfDocuments.map((document) => document.source_url),
      documents: pdfDocuments,
      licensed_to_download: licensePdf.authorized,
      downloaded_local_paths: [],
    },
    certifications_seen: [
      { name: "Ecodesign", value: null, source: "not_extracted_yet" },
      { name: "BImSchV Stufe 2", value: null, source: "not_extracted_yet" },
    ],
    pricing: {
      price_cents_public: null,
      price_visible_on_source: false,
      quote_mode: true,
      quote_components_admin_only: [
        {
          name: "Kaminofen (Basispreis)",
          estimate_cents_min: null,
          estimate_cents_max: null,
          source: "market_survey_pending",
        },
        {
          name: "Rauchrohr-Set",
          estimate_cents_min: 15000,
          estimate_cents_max: 30000,
          source: "market_survey_typical_de",
        },
        {
          name: "Bodenplatte Glas",
          estimate_cents_min: 12000,
          estimate_cents_max: 25000,
          source: "market_survey_typical_de",
        },
        {
          name: "Montage durch Fachbetrieb",
          estimate_cents_min: 40000,
          estimate_cents_max: 90000,
          source: "market_survey_typical_de",
        },
        {
          name: "Schornsteinfeger-Abnahme",
          estimate_cents_min: 15000,
          estimate_cents_max: 30000,
          source: "market_survey_typical_de",
        },
      ],
    },
    authorized: licenseTxt.authorized && licenseImg.authorized,
    review_status: "pending",
    _debug: { fromCache },
  };

  return { ok: true, record };
}

async function main() {
  await ensureDirs();

  let targetUrls;
  if (values.urls) {
    targetUrls = values.urls
      .split(",")
      .map((s) => s.trim())
      .map((slug) => `${BASE}/de/produkt/${slug}/`);
  } else {
    const all = await fetchAllProductUrls();
    // We don't yet know category without fetching each page. Sitemap has 200+ URLs
    // across all product families; the scraper filters by JSON-LD `category` per fiche.
    const limit = values.limit ? parseInt(values.limit, 10) : (values.all ? Infinity : 3);
    targetUrls = all.slice(0, limit);
  }

  console.log(`Spartherm scrape — ${targetUrls.length} URL(s), out=${OUT_DIR}`);

  const today = new Date().toISOString().slice(0, 10);
  const outFile = `${OUT_DIR}/${today}.jsonl`;
  const errorsFile = `${OUT_DIR}/_errors.jsonl`;

  const records = [];
  const errors = [];
  let done = 0;
  let skipped = 0;

  for (const url of targetUrls) {
    try {
      const res = await scrapeProduct(url);
      if (!res.ok) {
        skipped++;
        console.log(`  · skip ${url} (${res.reason})`);
        await appendFile(
          errorsFile,
          JSON.stringify({ url, reason: res.reason, at: new Date().toISOString() }) + "\n",
        );
        continue;
      }
      records.push(res.record);
      await appendFile(outFile, JSON.stringify(res.record) + "\n");
      done++;
      const cached = res.record._debug?.fromCache ? " [cached]" : "";
      console.log(`  ✓ ${res.record.model}${cached}  variants=${res.record.variants.length}  imgs=${res.record.media.gallery_url_sources.length}  vids=${res.record.media.video_url_sources.length}`);
    } catch (err) {
      errors.push({ url, error: err.message });
      await appendFile(
        errorsFile,
        JSON.stringify({ url, error: err.message, at: new Date().toISOString() }) + "\n",
      );
      console.log(`  ✗ ${url} — ${err.message}`);
    }
  }

  console.log(`\nSaved  : ${done} records`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors : ${errors.length}`);
  console.log(`Out    : ${outFile}`);

  if (records.length > 0) {
    console.log(`\n--- Mini-batch verification gate ---`);
    const { ok, report } = runMiniBatchGate(records.slice(0, 3));
    console.log(JSON.stringify(report, null, 2));
    if (!ok) {
      console.log("\n⚠ Verification FAILED. Fix the scraper before scaling.");
      process.exit(1);
    }
    console.log("\n✓ Verification passed on first 3 records.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

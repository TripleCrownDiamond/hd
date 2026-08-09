#!/usr/bin/env node
/**
 * Scrape ofen.de (Shopware 6) — the Wave-3 retailer that carries the stove
 * accessories no firewood merchant sells (Ofenrohr, Bodenplatte, Kaminbesteck,
 * Ventilatoren…) and lists retail prices for stoves.
 *
 * Discovery uses the sitemap: robots.txt forbids query strings, so the
 * `?p=<n>` category pagination is off limits.
 *
 * Output: data/scraped/ofen-de/{yyyy-mm-dd}.jsonl
 *
 * Usage:
 *   node scripts/scrape/ofen-de.mjs --group accessory --all
 *   node scripts/scrape/ofen-de.mjs --group stove --limit 50
 */

import { parseArgs } from "node:util";
import { mkdir, writeFile, appendFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { fetchUrl, contentHash } from "./_lib/fetcher.mjs";
import { getLicense } from "./_lib/licenses.mjs";
import { slugify, clean } from "./_lib/wood.mjs";
import { shopwareImages } from "./_lib/shopware.mjs";
import { rankProductImages } from "./_lib/images.mjs";

const SOURCE = "ofen-de";
const BASE = "https://www.ofen.de";
const OUT_DIR = `data/scraped/${SOURCE}`;
const CACHE_DIR = `${OUT_DIR}/_cache`;

const { values } = parseArgs({
  options: {
    limit: { type: "string" },
    all: { type: "boolean", default: false },
    group: { type: "string", default: "accessory" },
  },
});

/**
 * Slug patterns per group. Only these are fetched — the shop lists 6 000+
 * articles and the catalogue gaps are specific.
 */
const GROUPS = {
  accessory: {
    include:
      /^(ofenrohr|rauchrohr|pelletofenrohr|ofenblech|bodenplatte|kaminbodenplatte|funkenschutz|kaminbesteck|aschesauger|ascheeimer|kaminholzregal|holzkorb|kaminventilator|ofenventilator|schamott|tuerdichtung|dichtschnur|scheibenreiniger|holzfeuchtemess|rauchrohrbogen|wandfutter|drosselklappe)/i,
    kind: "accessory",
  },
  stove: { include: /^(kaminofen|pelletofen|dauerbrandofen|werkstattofen|gussofen)-/i, kind: "stove" },
};

async function productUrls() {
  const { body: index } = await fetchUrl(`${BASE}/sitemap.xml`, {
    cacheDir: CACHE_DIR,
    intervalMs: 2000,
  });
  const maps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1])
    .filter((url) => /-product-/.test(url));

  const urls = [];
  for (const map of maps) {
    const { body } = await fetchUrl(map, {
      cacheDir: null, // gzip payload, not worth the text cache
      intervalMs: 2000,
      as: "buffer",
    });
    const xml =
      body[0] === 0x1f && body[1] === 0x8b ? gunzipSync(body).toString("utf8") : body.toString("utf8");
    urls.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  }
  return urls;
}

/** Shopware renders its property table as plain <th>/<td> pairs. */
function extractSpecs(html) {
  const specs = {};
  for (const match of html.matchAll(/<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/gi)) {
    const key = clean(match[1]).replace(/:$/, "").trim();
    const value = clean(match[2]);
    if (key && value && key.length < 60) specs[key] = value;
  }
  return specs;
}

/** Words of 4+ characters, accents folded — used to tie a file to a product. */
function tokens(value) {
  return new Set(
    slugify(String(value ?? ""))
      .split("-")
      .filter((token) => token.length >= 4 || /^\d{2,}$/.test(token)),
  );
}

/**
 * The page also carries ~60 mega-menu tiles served from `/media/`, so an
 * unfiltered sweep returned 40+ images per article. Keep the Open Graph image
 * and any file whose name shares a word with the product title.
 */
function productImages(html, model) {
  const modelTokens = tokens(model);
  const og = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)?.[1] ?? null;
  const candidates = shopwareImages(html, BASE).filter((url) => url.includes("/media/"));

  const related = candidates.filter((url) => {
    const name = decodeURIComponent(url.split("?")[0].split("/").pop() ?? "");
    for (const token of tokens(name)) {
      if (modelTokens.has(token)) return true;
    }
    return false;
  });

  return rankProductImages([...new Set([...(og ? [og] : []), ...related])], model, SOURCE);
}

/**
 * The retailer's own copy, from the JSON-LD ProductGroup.
 *
 * It is captured for traceability and to harvest the factual equipment list,
 * never to be republished: AGENTS.md classes marketing prose as a literary work
 * that must be rewritten. `scripts/db/_lib/describe.mjs` composes our own text
 * from `features` and the spec table.
 *
 * @returns {{prose: string|null, features: string[]}}
 */
function sourceCopy(html) {
  const block = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => m[1].trim())
    .find((raw) => raw.includes('"description"'));
  if (!block) return { prose: null, features: [], dimensions: null, weight_kg: null };

  let description = null;
  try {
    const parsed = JSON.parse(block);
    const nodes = Array.isArray(parsed) ? parsed : [parsed];
    description = nodes.find((node) => typeof node?.description === "string")?.description ?? null;
  } catch {
    return { prose: null, features: [], dimensions: null, weight_kg: null };
  }
  if (!description) return { prose: null, features: [], dimensions: null, weight_kg: null };

  const text = clean(description.replace(/\r/g, "\n"));

  // Preferred: an explicit "Eigenschaften …:" heading introduces the list.
  const split = description.split(/(?:Eigenschaften|Ausstattung|Merkmale|Vorteile)[^:\n]{0,60}:/i);
  let lines = split.length > 1 ? split.slice(1).join("\n").split(/[\r\n]+/) : [];

  // Otherwise take the longest run of consecutive short, unpunctuated lines:
  // that is how the shop renders a bullet list inside the JSON description.
  if (lines.length === 0) {
    const all = description.split(/[\r\n]+/).map((line) => clean(line));
    let best = [];
    let run = [];
    for (const line of all) {
      const looksLikeBullet = line.length > 3 && line.length < 90 && !/[.!?]$/.test(line);
      if (looksLikeBullet) {
        run.push(line);
      } else {
        if (run.length > best.length) best = run;
        run = [];
      }
    }
    if (run.length > best.length) best = run;
    if (best.length >= 3) lines = best;
  }

  const features = lines
    .map((line) => clean(line))
    .filter((line) => line.length > 3 && line.length < 120)
    .slice(0, 12);

  // The property table carries no dimensions; the description states them as
  // "Maße: H705/B610/T430 mm" and "Gewicht: 136 kg". Without this, 1 500 stoves
  // would have no size at all.
  // Variants seen: "Maße: H705/B610/T430 mm", "Maße: ca. H737/…" and ranges
  // "H737-740/…" (adjustable feet) — the lower bound is the delivered height.
  const dims = description.match(
    /Ma(?:ß|ss)e?\s*:?\s*(?:ca\.\s*)?H\s*(\d{2,4})(?:\s*-\s*\d{2,4})?\s*\/\s*B\s*(\d{2,4})(?:\s*-\s*\d{2,4})?\s*\/\s*T\s*(\d{2,4})(?:\s*-\s*\d{2,4})?\s*(mm|cm)?/i,
  );
  const factor = dims && /^cm$/i.test(dims[4] ?? "") ? 10 : 1;
  const weight = description.match(/Gewicht\s*:?\s*(?:ca\.\s*)?(\d{1,4}(?:[.,]\d+)?)\s*kg/i);

  return {
    prose: text || null,
    features,
    dimensions: dims
      ? {
          height_mm: Number(dims[1]) * factor,
          width_mm: Number(dims[2]) * factor,
          depth_mm: Number(dims[3]) * factor,
        }
      : null,
    weight_kg: weight ? Number.parseFloat(weight[1].replace(",", ".")) : null,
  };
}

function breadcrumb(html) {
  return [...html.matchAll(/breadcrumb-link[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => clean(m[1]))
    .filter(Boolean);
}

function priceCents(html) {
  // The first "…,… €" in the markup belongs to a cross-sell teaser; the Open
  // Graph amount is the article's own price.
  const meta = html.match(/property="product:price:amount"[^>]*content="([^"]+)"/i);
  if (!meta) return null;
  const value = Number.parseFloat(meta[1]);
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

/**
 * ofen.de encodes the energy label as repeated letters — `a`, `aa`, `aaa` —
 * which upper-cased would print the meaningless "AA". Multi-variant products
 * list several ("aa, a"); the first is the one the page leads with.
 */
function energyClass(raw) {
  if (!raw) return null;
  const first = String(raw).split(",")[0].trim();
  const repeated = /^a+$/i.exec(first);
  if (repeated) return `A${"+".repeat(first.length - 1)}`;
  return /^(A\+{0,3}|[A-G])$/i.test(first) ? first.toUpperCase() : null;
}

function numberFrom(value) {
  if (!value) return null;
  const match = String(value).match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const parsed = Number.parseFloat(match[0].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * A slug starting with `kaminofen-` is not proof of a stove: spare parts and
 * floor plates are named after the stove they fit ("Kaminofen Scan 85
 * Zugumlenkplatten"). The breadcrumb category is the reliable signal.
 */
const PART_CATEGORY = /ersatzteil|feuerraum|bodenplatte|zubeh(ö|oe)r|rohr|dichtung|stein|platte|adapter/i;

async function scrapeProduct(url, requestedKind) {
  const { body } = await fetchUrl(url, { cacheDir: CACHE_DIR, intervalMs: 2000 });
  const model = clean(body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  if (!model) return null;

  const category = breadcrumb(body).at(-1) ?? "";
  const kind = requestedKind === "stove" && PART_CATEGORY.test(category) ? "accessory" : requestedKind;
  // Keep each run to the group it was asked for; the other file covers the rest.
  if (kind !== requestedKind) return null;

  const specs = extractSpecs(body);
  const copy = sourceCopy(body);
  const cents = priceCents(body);
  const images = productImages(body, model);
  const license = {
    specs: getLicense(SOURCE, "specs"),
    images: getLicense(SOURCE, "images"),
    pdf: getLicense(SOURCE, "pdf"),
  };
  const authorized = license.specs.authorized && license.images.authorized;
  const categories = category ? [category] : [];

  const common = {
    source: SOURCE,
    source_url: url,
    source_locale: "de-DE",
    scraped_at: new Date().toISOString(),
    content_hash: contentHash(body),
    brand: "ofen.de",
    model,
    slug: `${SOURCE}-${slugify(model)}`,
    identifiers: { ean: null, sku: specs["Artikel-Nr."] ?? null, hki_id: null },
    descriptions: {
      short_de: null,
      // Captured for traceability and fact extraction; never published as-is.
      long_de_raw: copy.prose,
      long_de_authorized: false,
    },
    features_de: copy.features,
    media: {
      image_urls_source: images,
      licensed_to_download: license.images.authorized,
      downloaded_local_paths: [],
    },
    documents: { sources: [], licensed_to_download: license.pdf.authorized, downloaded_local_paths: [] },
    pricing: {
      currency: "EUR",
      vat_included: true,
      price_cents_public: cents,
      price_visible_on_source: cents != null,
      quote_mode: cents == null,
    },
    authorized,
    review_status: "pending",
  };

  if (kind === "stove") {
    return {
      ...common,
      type: "stove",
      product_type_de: categories.at(-1) ?? "kaminoefen",
      technical: {
        energy_class: energyClass(specs["Energieeffizienzklasse"]),
        power_kw_nominal: numberFrom(specs["Nennwärmeleistung"]) ?? numberFrom(model.match(/([\d,]+)\s*kW/i)?.[1]),
        power_kw_min: null,
        power_kw_max: null,
        efficiency_pct: numberFrom(specs["Wirkungsgrad"]),
        height_mm: copy.dimensions?.height_mm ?? null,
        width_mm: copy.dimensions?.width_mm ?? null,
        depth_mm: copy.dimensions?.depth_mm ?? null,
        weight_kg: numberFrom(specs["Gewicht"]) ?? copy.weight_kg,
        fuel: specs["Brennstoff"] ?? null,
        specs,
      },
      certifications: specs["Geprüft"] ? [specs["Geprüft"]] : [],
      variants: [],
    };
  }

  return {
    ...common,
    type: "wood",
    product_kind: "accessory",
    technical: {
      extra: {
        wood_type: null,
        unit_de: null,
        length_de: null,
        moisture_de: null,
        quantity_de: null,
        origin_de: null,
        packaging_de: null,
        category_de: categories.at(-1) ?? null,
        ...specs,
      },
    },
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(CACHE_DIR, { recursive: true });

  const group = GROUPS[values.group];
  if (!group) throw new Error(`Unknown --group. Use one of: ${Object.keys(GROUPS).join(", ")}`);

  console.log("Fetching sitemap…");
  const all = await productUrls();
  const matching = all.filter((url) => group.include.test(url.replace(`${BASE}/`, "")));
  console.log(`${all.length} products in sitemap, ${matching.length} match --group ${values.group}`);

  const targetCount = values.limit
    ? Number.parseInt(values.limit, 10)
    : values.all
      ? matching.length
      : 10;

  const today = new Date().toISOString().slice(0, 10);
  const outFile = `${OUT_DIR}/${today}-${values.group}.jsonl`;
  const errorsFile = `${OUT_DIR}/_errors.jsonl`;
  const records = [];

  for (const url of matching.slice(0, targetCount)) {
    try {
      const record = await scrapeProduct(url, group.kind);
      if (!record) continue;
      records.push(record);
      console.log(`  ✓ ${record.model.slice(0, 58)} — ${record.pricing.price_cents_public ?? "-"} ct`);
    } catch (error) {
      await appendFile(
        errorsFile,
        `${JSON.stringify({ url, error: error.message, at: new Date().toISOString() })}\n`,
      );
      console.error(`  ✗ ${url}: ${error.message}`);
    }
  }

  // Distinct products can share an h1 (same article, two sizes); keep them apart.
  const seen = new Set();
  for (const record of records) {
    if (!seen.has(record.slug)) {
      seen.add(record.slug);
      continue;
    }
    const segment = new URL(record.source_url).pathname.split("/").filter(Boolean).pop();
    let candidate = `${SOURCE}-${slugify(segment)}`;
    let counter = 2;
    while (seen.has(candidate)) candidate = `${SOURCE}-${slugify(segment)}-${counter++}`;
    record.slug = candidate;
    seen.add(candidate);
  }

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

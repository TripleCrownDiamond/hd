#!/usr/bin/env node
/**
 * Upload the licensed product images of any scraped source to Cloudinary.
 *
 * The dated JSONL scrape stays immutable. Enriched records — with a
 * `media_cloudinary` block — are written to
 * `data/scraped/<source>/published.jsonl`, which the Supabase importer prefers.
 *
 * Usage:
 *   node scripts/publish/source-media.mjs --source rika
 *   node scripts/publish/source-media.mjs --all [--max-images 5] [--concurrency 8]
 *
 * A source is only processed when `data/licenses.json` authorizes `images`
 * for it. Products whose images all fail to upload are reported, never silently
 * dropped.
 */

import { v2 as cloudinary } from "cloudinary";
import { parseArgs } from "node:util";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getLicense } from "../scrape/_lib/licenses.mjs";
import { fetchUrl } from "../scrape/_lib/fetcher.mjs";
import { rankProductImages } from "../scrape/_lib/images.mjs";
import { imageKitConfig, uploadToImageKit } from "./_lib/media-provider.mjs";

const { values } = parseArgs({
  options: {
    source: { type: "string" },
    all: { type: "boolean", default: false },
    "max-images": { type: "string", default: "5" },
    concurrency: { type: "string", default: "8" },
  },
});

const MAX_IMAGES = Number.parseInt(values["max-images"], 10);
const CONCURRENCY = Number.parseInt(values.concurrency, 10);
const SCRAPED_DIR = resolve(process.cwd(), "data/scraped");
const NOT_A_SOURCE = new Set(["hki-cert"]);

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i.exec(line);
    if (!match) continue;
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

function latestScrape(source) {
  const dir = resolve(SCRAPED_DIR, source);
  if (!existsSync(dir)) return null;
  // Several files may share the latest date, one per product group.
  const dated = readdirSync(dir).filter((name) => /^\d{4}-\d{2}-\d{2}.*\.jsonl$/.test(name));
  if (dated.length === 0) return null;
  const latest = dated.map((name) => name.slice(0, 10)).sort().at(-1);
  return dated.filter((name) => name.startsWith(latest)).sort().map((name) => resolve(dir, name));
}

function listSources() {
  return readdirSync(SCRAPED_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !NOT_A_SOURCE.has(entry.name))
    .map((entry) => entry.name)
    .filter((name) => latestScrape(name));
}

/**
 * Manufacturer scrapes use media.image_urls_source; Spartherm uses hero+gallery.
 *
 * Payment badges, carrier logos and ambience banners are stripped here and the
 * remainder is ranked, so position 0 — the product's main image everywhere in
 * the storefront — is the real product photo rather than whatever the template
 * happened to render first.
 */
function sourceImages(record) {
  const media = record.media ?? {};
  const urls = [
    media.hero_image_url_source,
    ...(media.gallery_url_sources ?? []),
    ...(media.image_urls_source ?? []),
  ].filter((url) => typeof url === "string" && /^https?:\/\//.test(url));
  return rankProductImages([...new Set(urls)], record.model ?? "", record.brand ?? "");
}

function slugPart(url) {
  const name = decodeURIComponent(url.split("?")[0].split("/").pop() ?? "image");
  return (
    name
      .replace(/\.(png|jpe?g|webp|avif)$/i, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "image"
  );
}

/**
 * Cloudinary is full, so new assets go to ImageKit when it is configured.
 * Existing Cloudinary references stay valid and are still served from there.
 *
 * ImageKit downloads the source URL from its own servers, and a growing number
 * of shops block that (LiteSpeed hotlink protection, geo or UA rules) while a
 * plain browser fetch succeeds. So the image is downloaded here first, through
 * the shared rate-limited, retrying fetcher, and the bytes are handed to
 * ImageKit — one source of truth for how the scrapers fetch.
 */
let imagekit = null;

async function fetchImageBuffer(url) {
  const { body } = await fetchUrl(url, {
    // The publish run is local work, not a web scrape: no robots gate, no disk
    // cache, and the source already proved it answers — a short interval is
    // enough to stay polite.
    checkRobots: false,
    cacheDir: null,
    intervalMs: 1200,
    as: "buffer",
    maxAttempts: 3,
  });
  return Buffer.from(body);
}

async function uploadFromUrl(url, publicId) {
  if (imagekit) {
    try {
      const buffer = await fetchImageBuffer(url);
      return await uploadToImageKit(imagekit, buffer, publicId, url);
    } catch (error) {
      const message = String(error?.message ?? "");
      // An asset already uploaded under this path is a success, not a failure.
      if (/already exists/i.test(message)) return `imagekit:${publicId}`;
      throw error;
    }
  }
  try {
    const result = await cloudinary.uploader.upload(url, {
      public_id: publicId,
      overwrite: false,
      resource_type: "image",
      eager: [
        { fetch_format: "auto", quality: "auto" },
        { width: 800, crop: "limit", fetch_format: "auto", quality: "auto" },
      ],
    });
    return result.public_id;
  } catch (error) {
    const message = String(error?.message ?? "");
    // Cloudinary reports an existing public_id as a conflict; that is a success
    // for us because `overwrite: false` means the asset is already published.
    if (error?.http_code === 409 || message.includes("already exists")) return publicId;
    throw error;
  }
}

/** Run `worker` over `items` with a bounded number of in-flight uploads. */
async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

async function publishSource(source) {
  const license = getLicense(source, "images");
  if (!license?.authorized) {
    console.log(`- ${source}: images not licensed, skipped`);
    return { source, skipped: true };
  }

  const input = latestScrape(source);
  if (!input) {
    console.log(`- ${source}: no scrape found, skipped`);
    return { source, skipped: true };
  }

  const records = input.flatMap((file) =>
    readFileSync(file, "utf8")
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line)),
  );

  const jobs = [];
  for (const record of records) {
    if (record.skip_import) continue;
    const base = `holzkraft/products/${source}/${record.slug.replace(new RegExp(`^${source}-`), "")}`;
    for (const [index, url] of sourceImages(record).slice(0, MAX_IMAGES).entries()) {
      jobs.push({
        record,
        url,
        // Rank position, carried through so concurrent uploads cannot reorder
        // the gallery — otherwise the main image is simply whichever upload
        // finished first.
        order: index,
        publicId: `${base}/${String(index + 1).padStart(2, "0")}-${slugPart(url)}`,
      });
    }
  }

  const gallery = new Map(records.map((record) => [record.slug, []]));
  const failures = [];
  let uploaded = 0;

  await mapWithConcurrency(jobs, CONCURRENCY, async (job) => {
    try {
      const publicId = await uploadFromUrl(job.url, job.publicId);
      gallery.get(job.record.slug).push({
        order: job.order,
        public_id: publicId,
        source_url: job.url,
      });
      uploaded++;
    } catch (error) {
      failures.push({
        product: job.record.slug,
        url: job.url,
        reason: String(error?.message ?? error),
      });
    }
  });

  for (const record of records) {
    // Restore rank order: uploads complete out of order under concurrency.
    const images = (gallery.get(record.slug) ?? [])
      .sort((a, b) => a.order - b.order)
      .map(({ public_id, source_url }) => ({ public_id, source_url }));
    record.media_cloudinary = {
      hero: images[0]?.public_id ?? null,
      // Kept so importers can store a source_url for the main image too; a null
      // there used to make consumers treat the hero as "unknown origin".
      hero_source_url: images[0]?.source_url ?? null,
      variants: record.media_cloudinary?.variants ?? [],
      gallery: images.slice(1),
    };
  }

  const output = resolve(SCRAPED_DIR, source, "published.jsonl");
  writeFileSync(output, `${records.map((record) => JSON.stringify(record)).join("\n")}\n`);

  const withImages = records.filter((r) => r.media_cloudinary.hero).length;
  const withoutSource = records.filter((r) => !r.skip_import && sourceImages(r).length === 0).length;
  console.log(
    `✓ ${source}: ${uploaded} images uploaded, ${withImages}/${records.length} products with a hero` +
      (withoutSource ? `, ${withoutSource} without any source image` : "") +
      (failures.length ? `, ${failures.length} upload failures` : ""),
  );
  for (const failure of failures.slice(0, 5)) {
    console.warn(`    ! ${failure.product}: ${failure.reason}`);
  }
  return { source, uploaded, withImages, total: records.length, failures };
}

async function main() {
  const env = loadEnv(resolve(process.cwd(), ".env.local"));
  const hasCloudinary =
    env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET;
  if (!hasCloudinary && !env.IMAGEKIT_PRIVATE_KEY) {
    throw new Error("Missing CLOUDINARY_* or IMAGEKIT_* credentials in .env.local.");
  }
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  imagekit = imageKitConfig(env);
  console.log(imagekit ? "Uploading to ImageKit." : "Uploading to Cloudinary.");

  const sources = values.all ? listSources() : values.source ? [values.source] : [];
  if (sources.length === 0) throw new Error("Pass --source <slug> or --all.");

  const summaries = [];
  for (const source of sources) {
    summaries.push(await publishSource(source));
  }

  const totalFailures = summaries.reduce((sum, s) => sum + (s.failures?.length ?? 0), 0);
  console.log(`\nDone. ${summaries.length} sources, ${totalFailures} failed uploads.`);
  if (totalFailures > 0) process.exitCode = 0; // reported, not fatal
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

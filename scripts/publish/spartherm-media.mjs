#!/usr/bin/env node
/**
 * Publish Spartherm product media to Cloudinary.
 *
 * For each product in data/scraped/spartherm/latest.jsonl:
 *   - upload hero image (from source URL) via Cloudinary's URL fetch upload
 *   - upload each variant main image
 *   - upload variant swatches
 *   - record cloudinary public_ids back into the record
 *
 * Output:
 *   data/scraped/spartherm/published.jsonl  — same records, media_cloudinary populated
 */

import { v2 as cloudinary } from "cloudinary";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const raw = readFileSync(path, "utf8");
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i.exec(line);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

const env = loadEnv(resolve(process.cwd(), ".env.local"));
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

const INPUT = resolve(process.cwd(), "data/scraped/spartherm/latest.jsonl");
const OUTPUT = resolve(process.cwd(), "data/scraped/spartherm/published.jsonl");

function slugPart(url) {
  return url.split("/").pop().replace(/\.(png|jpg|jpeg|webp|mp4)$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function uploadFromUrl(url, publicId) {
  try {
    const res = await cloudinary.uploader.upload(url, {
      public_id: publicId,
      overwrite: false,
      resource_type: "image",
      eager: [
        { fetch_format: "auto", quality: "auto" },
        { width: 800, crop: "limit", fetch_format: "auto", quality: "auto" },
      ],
    });
    return { ok: true, public_id: res.public_id, bytes: res.bytes };
  } catch (err) {
    if (err.http_code === 409 || (err.message ?? "").includes("already exists")) {
      return { ok: true, public_id: publicId, bytes: 0, existed: true };
    }
    return { ok: false, error: err.message ?? String(err) };
  }
}

async function main() {
  const lines = readFileSync(INPUT, "utf8").trim().split("\n").filter(Boolean);
  const products = lines.map((l) => JSON.parse(l));
  const swatchCache = new Map(); // shared surfaces cached once

  console.log(`Publishing media for ${products.length} products…`);
  let done = 0;

  for (const p of products) {
    const base = `holzkraft/products/spartherm/${p.slug.replace(/^spartherm-/, "")}`;
    const cldMedia = { hero: null, variants: [], gallery: [] };
    const uploadedSources = new Set();

    if (p.media.hero_image_url_source) {
      const id = `${base}/hero-${slugPart(p.media.hero_image_url_source)}`;
      const r = await uploadFromUrl(p.media.hero_image_url_source, id);
      cldMedia.hero = r.ok ? r.public_id : null;
    }

    for (const v of p.variants) {
      const rec = { code: v.code, main: null, swatch: null };
      if (v.main_image_url_source) {
        const id = `${base}/variant-${v.code}`;
        const r = await uploadFromUrl(v.main_image_url_source, id);
        rec.main = r.ok ? r.public_id : null;
        uploadedSources.add(v.main_image_url_source);
      }
      if (v.swatch_url_source) {
        if (swatchCache.has(v.swatch_url_source)) {
          rec.swatch = swatchCache.get(v.swatch_url_source);
        } else {
          const id = `holzkraft/products/spartherm/_surfaces/${v.code}`;
          const r = await uploadFromUrl(v.swatch_url_source, id);
          rec.swatch = r.ok ? r.public_id : null;
          swatchCache.set(v.swatch_url_source, rec.swatch);
        }
      }
      cldMedia.variants.push(rec);
    }

    // Upload remaining gallery images (extra angles, schamotte variants, fire shots) that
    // weren't already sent as a variant hero. Each keeps its source URL for cross-check.
    for (const src of p.media.gallery_url_sources ?? []) {
      if (uploadedSources.has(src)) continue;
      const id = `${base}/gallery-${slugPart(src)}`;
      const r = await uploadFromUrl(src, id);
      if (r.ok) {
        cldMedia.gallery.push({ public_id: r.public_id, source_url: src });
        uploadedSources.add(src);
      }
    }

    p.media_cloudinary = cldMedia;
    done++;
    console.log(
      `  ✓ ${p.model}  hero=${cldMedia.hero ? "ok" : "—"}  ` +
        `variants=${cldMedia.variants.filter((r) => r.main).length}/${p.variants.length}  ` +
        `gallery=${cldMedia.gallery.length}`,
    );
  }

  writeFileSync(OUTPUT, products.map((p) => JSON.stringify(p)).join("\n") + "\n");
  console.log(`\nSaved ${done} products → ${OUTPUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

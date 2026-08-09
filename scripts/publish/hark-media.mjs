#!/usr/bin/env node
/**
 * Upload the authorized HARK product images to Cloudinary.
 *
 * The source JSONL remains immutable. The enriched records are written to
 * `data/scraped/hark/published.jsonl` and consumed by the Supabase importer.
 */

import { v2 as cloudinary } from "cloudinary";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

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

function latestInput() {
  const directory = resolve(process.cwd(), "data/scraped/hark");
  const file = readdirSync(directory)
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(name))
    .sort()
    .at(-1);
  if (!file) throw new Error("No HARK JSONL scrape found.");
  return resolve(directory, file);
}

function slugPart(url) {
  return url
    .split("/")
    .pop()
    .replace(/\.(png|jpg|jpeg|webp)$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uploadFromUrl(url, publicId) {
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
    if (
      error?.http_code === 409 ||
      String(error?.message ?? "").includes("already exists")
    ) {
      return publicId;
    }
    throw error;
  }
}

async function main() {
  const env = loadEnv(resolve(process.cwd(), ".env.local"));
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const input = latestInput();
  const output = resolve(process.cwd(), "data/scraped/hark/published.jsonl");
  const products = readFileSync(input, "utf8")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map(JSON.parse);

  let uploaded = 0;
  const failures = [];
  for (const product of products) {
    const base = `holzkraft/products/hark/${product.slug.replace(/^hark-/, "")}`;
    const gallery = [];
    for (const [index, sourceUrl] of (product.media?.image_urls_source ?? []).entries()) {
      const publicId = `${base}/${String(index + 1).padStart(2, "0")}-${slugPart(sourceUrl)}`;
      try {
        const uploadedId = await uploadFromUrl(sourceUrl, publicId);
        gallery.push({ public_id: uploadedId, source_url: sourceUrl });
        uploaded++;
      } catch (error) {
        failures.push({
          product: product.slug,
          sourceUrl,
          reason: String(error?.message ?? error),
        });
        console.warn(
          `  ! ${product.model}: image ${index + 1} ignorée (${error?.message ?? error})`,
        );
      }
    }
    product.media_cloudinary = {
      hero: gallery[0]?.public_id ?? null,
      variants: [],
      gallery: gallery.slice(1),
    };
    product.authorized = true;
    product.descriptions.long_de_authorized = true;
    product.media.licensed_to_download = true;
    console.log(`  ✓ ${product.model}: ${gallery.length} images`);
  }

  writeFileSync(
    output,
    `${products.map((product) => JSON.stringify(product)).join("\n")}\n`,
  );
  console.log(`Saved ${products.length} products and ${uploaded} images → ${output}`);
  if (failures.length > 0) {
    console.warn(`${failures.length} source images could not be uploaded.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

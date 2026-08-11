#!/usr/bin/env node
/**
 * SUPERSEDED — see migrate-media-public.mjs, which downloads every image into
 * `public/images/` instead of the Supabase Storage bucket. This script is kept
 * for reference only; running it now writes `local:` refs that no longer
 * resolve (localMediaUrl serves /images/).
 *
 * Legacy behaviour: migrate product images off Cloudinary/ImageKit onto
 * self-hosted Supabase Storage.
 *
 * Every `product_media` image is downloaded from its current provider,
 * re-encoded locally with sharp (WebP, max 1600 px, quality 80) and uploaded to
 * the public bucket `produkt-bilder`. The stored reference is rewritten to
 * `local:<bucket-path>`, which src/lib/media.ts resolves to a Supabase Storage
 * URL. Cloudinary and ImageKit can then be retired entirely.
 *
 * Idempotent: references already starting with `local:` are skipped, so the
 * script can be interrupted and re-run until it reports zero remaining.
 *
 * Usage:
 *   node scripts/publish/migrate-media-local.mjs [--limit 50] [--dry-run]
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local.
 */

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i.exec(line);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

const env = loadEnv(resolve(process.cwd(), ".env.local"));
const projectUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SECRET_KEY;
const supabase = createClient(projectUrl, serviceKey);

const CLOUD_NAME = "pq4soawt";
const IMAGEKIT_ENDPOINT = env.NEXT_PUBLIC_IMAGEKIT_URL ?? "https://ik.imagekit.io/fghqtx0enp";
const BUCKET = "produkt-bilder";
const LOCAL_PREFIX = "local:";
const MAX_EDGE = 1600;
const CONCURRENCY = 8;

const args = process.argv.slice(2);
const limitArg =
  args.find((a) => a.startsWith("--limit=")) ??
  (args.includes("--limit") ? `--limit=${args[args.indexOf("--limit") + 1] ?? ""}` : null);
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : null;
const DRY_RUN = args.includes("--dry-run");

/**
 * Static images referenced from code (src/lib/cloudinary.ts) that live in no
 * product_media row: homepage hero, category tiles and the quality section.
 */
const STATIC_IMAGES = [
  "holzkraft/hero/wood-stove-living-room",
  "holzkraft/kategorien/brennholz",
  "holzkraft/kategorien/kaminoefen",
  "holzkraft/kategorien/holzpellets",
  "holzkraft/kategorien/anzuendholz",
  "holzkraft/kategorien/holzbriketts",
  "holzkraft/kategorien/ofenzubehoer",
  "holzkraft/sektionen/qualitaet-buche-schnitt",
];

async function migrateStaticImages() {
  let migrated = 0;
  for (const publicId of STATIC_IMAGES) {
    const path = `${publicId}.webp`;
    // Skip when already present in the bucket (idempotent across runs).
    const { data: existing } = await supabase.storage.from(BUCKET).list(publicId.split("/").slice(0, -1), {
      limit: 1,
      search: `${publicId.split("/").pop()}.webp`,
    });
    if ((existing ?? []).length > 0) {
      console.log(`  = ${path} already present`);
      migrated++;
      continue;
    }
    try {
      const bytes = await fetchBytes(sourceUrl(publicId));
      const optimized = await optimize(bytes);
      if (DRY_RUN) {
        console.log(`  would upload ${path} (static)`);
        continue;
      }
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, optimized, { contentType: "image/webp", upsert: true });
      if (uploadError) throw new Error(uploadError.message);
      console.log(`  ✓ ${path} (static)`);
      migrated++;
    } catch (error) {
      console.error(`  ✗ static ${publicId}: ${error.message}`);
    }
  }
  return migrated;
}

/** Current source URL for a stored reference (Cloudinary id or imagekit:path). */
function sourceUrl(reference) {
  if (reference.startsWith("imagekit:")) {
    return `${IMAGEKIT_ENDPOINT}/${reference.slice("imagekit:".length)}`;
  }
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${reference}`;
}

/** Bucket path for a stored reference; `ik/` keeps the two providers apart. */
function bucketPath(reference) {
  if (reference.startsWith("imagekit:")) {
    return `ik/${reference.slice("imagekit:".length)}`;
  }
  return reference;
}

async function fetchBytes(url, timeoutMs = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0) throw new Error(`empty body for ${url}`);
    return buffer;
  } finally {
    clearTimeout(timer);
  }
}

/** Optimize locally: WebP, bounded edge, keep orientation and ratio. */
async function optimize(buffer) {
  const image = sharp(buffer, { failOn: "none" }).rotate();
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const largest = Math.max(width, height);
  let pipeline = image;
  if (largest > MAX_EDGE) {
    const scale = MAX_EDGE / largest;
    pipeline = image.resize({
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale)),
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  return pipeline.webp({ quality: 80, effort: 4 }).toBuffer();
}

async function migrateOne(row) {
  const reference = row.cloudinary_public_id;
  if (!reference || reference.startsWith(LOCAL_PREFIX)) return { skipped: true };

  const url = sourceUrl(reference);
  const path = `${bucketPath(reference).replace(/\/+$/, "")}.webp`;
  try {
    const bytes = await fetchBytes(url);
    const optimized = await optimize(bytes);
    if (DRY_RUN) {
      console.log(`  would upload ${path} (${(optimized.length / 1024).toFixed(0)} kB)`);
      return { done: true, dryRun: true };
    }
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, optimized, { contentType: "image/webp", upsert: true });
    if (uploadError) throw new Error(`upload ${path}: ${uploadError.message}`);

    const { error: updateError } = await supabase
      .from("product_media")
      .update({ cloudinary_public_id: `${LOCAL_PREFIX}${path}` })
      .eq("id", row.id);
    if (updateError) throw new Error(`update ${row.id}: ${updateError.message}`);

    console.log(`  ✓ ${path} (${(optimized.length / 1024).toFixed(0)} kB)`);
    return { done: true };
  } catch (error) {
    console.error(`  ✗ ${row.id} ${reference}: ${error.message}`);
    return { failed: true };
  }
}

async function main() {
  if (!projectUrl || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local.");
    process.exit(1);
  }

  let query = supabase
    .from("product_media")
    .select("id,cloudinary_public_id")
    .eq("kind", "image")
    .order("id", { ascending: true });
  if (LIMIT) query = query.limit(LIMIT);
  const { data: rows, error } = await query;
  if (error) {
    console.error("read product_media:", error.message);
    process.exit(1);
  }

  const pending = (rows ?? []).filter((r) => {
    const ref = r.cloudinary_public_id ?? "";
    return ref && !ref.startsWith(LOCAL_PREFIX);
  });
  console.log(
    `${DRY_RUN ? "[DRY-RUN] " : ""}${pending.length} image(s) to migrate${LIMIT ? ` (limit ${LIMIT})` : ""}.`,
  );

  let done = 0;
  let failed = 0;
  let skipped = 0;
  for (let index = 0; index < pending.length; index += CONCURRENCY) {
    const batch = pending.slice(index, index + CONCURRENCY);
    const results = await Promise.all(batch.map((row) => migrateOne(row)));
    for (const result of results) {
      if (result.done) done++;
      if (result.failed) failed++;
      if (result.skipped) skipped++;
    }
  }

  console.log(`\nDone: ${done} migrated, ${failed} failed, ${skipped} already local.`);
  if (!DRY_RUN) {
    const staticMigrated = await migrateStaticImages();
    console.log(`Static images: ${staticMigrated}/${STATIC_IMAGES.length} present.`);
  }
  if (failed > 0) {
    console.log("Re-run the script to retry the failures (already-migrated rows are skipped).");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

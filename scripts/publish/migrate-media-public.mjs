#!/usr/bin/env node
/**
 * Bring ALL site images local.
 *
 * Every image the storefront can show — homepage hero, category tiles, the
 * quality section and every `product_media` row of kind `image` — is
 * downloaded from its current provider (Cloudinary, ImageKit or the Supabase
 * Storage bucket used by the previous migration), re-encoded locally with
 * sharp (WebP, max 1600 px, quality 80) and written under `public/images/`.
 *
 * Stored references are rewritten to `local:<path>`; src/lib/cloudinary.ts
 * resolves those to `/images/<path>`, which the Next.js server serves and the
 * image optimizer resizes locally. After this script has run, no CDN is needed
 * to render the site.
 *
 * Idempotent: files already present under public/images/ are skipped, so the
 * script can be interrupted and re-run until it reports zero remaining.
 *
 * Usage:
 *   node scripts/publish/migrate-media-public.mjs [--limit 50] [--dry-run] [--force]
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local (to
 * read product_media rows and to download `local:` refs still sitting in the
 * storage bucket), plus CLOUDINARY_API_SECRET only when downloading private
 * Cloudinary assets (not used by default).
 */

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

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
const CLOUDINARY_BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;
const IMAGEKIT_ENDPOINT = env.NEXT_PUBLIC_IMAGEKIT_URL ?? "https://ik.imagekit.io/fghqtx0enp";
const BUCKET = "produkt-bilder";
const LOCAL_PREFIX = "local:";
const OUT_ROOT = "public/images";
const MAX_EDGE = 1600;
const CONCURRENCY = 8;

const args = process.argv.slice(2);
const limitArg =
  args.find((a) => a.startsWith("--limit=")) ??
  (args.includes("--limit") ? `--limit=${args[args.indexOf("--limit") + 1] ?? ""}` : null);
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : null;
const DRY_RUN = args.includes("--dry-run");
const FORCE = args.includes("--force");

/** Static images referenced from code (src/lib/cloudinary.ts IMAGES). */
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

/** Strip a leading dot: keep path separators intact. */
function safePath(segment) {
  return segment
    .replace(/^[./]+/, "")
    .replace(/[^a-zA-Z0-9._/-]/g, "_")
    .replace(/\.\./g, "_");
}

/** Keep Windows filenames short enough; hash-collapse absurdly long refs. */
function shortPath(path) {
  if (path.length <= 180) return path;
  const hash = createHash("sha1").update(path).digest("hex");
  return `holzkraft/_h/${hash.slice(0, 10)}${hash.slice(-6)}.webp`;
}

function storageUrl(path) {
  return `${projectUrl}/storage/v1/object/public/${BUCKET}/${path}`;
}

/**
 * Candidate source URLs for a stored reference, in order of preference.
 * `local:` refs were rewritten from Cloudinary/ImageKit, so we fall back to
 * reconstructing that original source when the storage bucket has nothing.
 */
function sourceUrls(reference) {
  if (reference.startsWith("local:")) {
    const path = reference.slice(LOCAL_PREFIX.length);
    const withoutExt = path.replace(/\.webp$/i, "");
    const candidates = [storageUrl(path)];
    if (withoutExt.startsWith("ik/")) {
      candidates.push(`${IMAGEKIT_ENDPOINT}/${withoutExt.slice(3)}`);
    } else {
      candidates.push(`${CLOUDINARY_BASE}/${withoutExt}`);
    }
    return candidates;
  }
  if (reference.startsWith("imagekit:")) {
    return [`${IMAGEKIT_ENDPOINT}/${reference.slice("imagekit:".length)}`];
  }
  if (/^https?:\/\//.test(reference)) return [reference];
  return [`${CLOUDINARY_BASE}/${reference}`];
}

/** Local file path (relative to OUT_ROOT) and rewritten reference for a row. */
function plan(reference) {
  if (reference.startsWith("local:")) {
    const raw = reference.slice(LOCAL_PREFIX.length);
    let path = safePath(raw);
    if (!/\.(webp|jpg|jpeg|png|avif)$/i.test(path)) path = `${path}.webp`;
    path = shortPath(path);
    const rewritten = path === raw ? null : `${LOCAL_PREFIX}${path}`;
    return { path, rewritten, candidates: sourceUrls(reference) };
  }
  if (reference.startsWith("imagekit:")) {
    const path = shortPath(`ik/${safePath(reference.slice("imagekit:".length))}.webp`);
    return { path, rewritten: `${LOCAL_PREFIX}${path}`, candidates: sourceUrls(reference) };
  }
  if (/^https?:\/\//.test(reference)) {
    // Absolute URL: keep the file name, place under holzkraft/_url/.
    const name = safePath(reference.split("/").pop() || "image").replace(/\.[a-z0-9]+$/i, "") || "image";
    const path = shortPath(`holzkraft/_url/${name}.webp`);
    return { path, rewritten: `${LOCAL_PREFIX}${path}`, candidates: [reference] };
  }
  const path = shortPath(`${safePath(reference)}.webp`);
  return { path, rewritten: `${LOCAL_PREFIX}${path}`, candidates: sourceUrls(reference) };
}

async function fetchBytes(url, timeoutMs = 60000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: "follow" });
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
  return pipeline.webp({ quality: 80, effort: 3 }).toBuffer();
}

function outFile(path) {
  return resolve(process.cwd(), OUT_ROOT, path);
}

async function downloadAndWrite(entry) {
  const { path, rewritten, candidates } = entry;
  const target = outFile(path);
  if (!FORCE && existsSync(target)) return { skipped: true };

  let bytes = null;
  let lastError = null;
  for (const url of candidates) {
    try {
      bytes = await fetchBytes(url);
      break;
    } catch (error) {
      lastError = error.message;
    }
  }
  if (!bytes) throw new Error(lastError ?? "no source available");

  const optimized = await optimize(bytes);
  if (DRY_RUN) {
    console.log(`  would write ${path} (${(optimized.length / 1024).toFixed(0)} kB)`);
    return { done: true, dryRun: true };
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, optimized);
  return { done: true, rewritten, bytes: optimized.length };
}

async function migrateStaticImages() {
  let migrated = 0;
  for (const publicId of STATIC_IMAGES) {
    const path = `${publicId}.webp`;
    const entry = {
      path,
      rewritten: null,
      candidates: [`${CLOUDINARY_BASE}/${publicId}`],
    };
    try {
      const result = await downloadAndWrite(entry);
      if (result.skipped) {
        console.log(`  = ${path} already present`);
      } else {
        console.log(`  ✓ ${path}${result.dryRun ? " (dry-run)" : ""}`);
      }
      migrated++;
    } catch (error) {
      console.error(`  ✗ static ${publicId}: ${error.message}`);
    }
  }
  return migrated;
}

async function migrateOne(row) {
  const reference = row.cloudinary_public_id;
  if (!reference) return { skipped: true };
  if (/^https?:\/\//.test(reference)) return { skipped: true, note: `absolute URL, skipped: ${reference.slice(0, 80)}` };

  const entry = plan(reference);
  try {
    const result = await downloadAndWrite(entry);
    if (result.skipped) return { skipped: true };
    if (DRY_RUN) return { done: true, dryRun: true };
    if (entry.rewritten && entry.rewritten !== reference) {
      const { error: updateError } = await supabase
        .from("product_media")
        .update({ cloudinary_public_id: entry.rewritten })
        .eq("id", row.id);
      if (updateError) throw new Error(`update ${row.id}: ${updateError.message}`);
    }
    console.log(`  ✓ ${entry.path} (${(result.bytes / 1024).toFixed(0)} kB)`);
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
  if (!existsSync(resolve(process.cwd(), OUT_ROOT))) {
    mkdirSync(resolve(process.cwd(), OUT_ROOT), { recursive: true });
  }

  console.log(`Static images (${STATIC_IMAGES.length})...`);
  await migrateStaticImages();

  // PostgREST caps a single request at 1000 rows — page through everything.
  const rows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("product_media")
      .select("id,cloudinary_public_id")
      .eq("kind", "image")
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("read product_media:", error.message);
      process.exit(1);
    }
    rows.push(...(data ?? []));
    if ((data ?? []).length < PAGE) break;
    if (LIMIT && rows.length >= LIMIT) break;
  }

  const pending = (rows ?? [])
    .filter((r) => r.cloudinary_public_id && !/^https?:/.test(r.cloudinary_public_id))
    .slice(0, LIMIT ?? undefined);
  console.log(
    `${DRY_RUN ? "[DRY-RUN] " : ""}${pending.length} product image(s) to migrate${LIMIT ? ` (limit ${LIMIT})` : ""}.`,
  );

  let done = 0;
  let failed = 0;
  let skipped = 0;
  for (let index = 0; index < pending.length; index += CONCURRENCY) {
    const batch = pending.slice(index, index + CONCURRENCY);
    const results = await Promise.all(batch.map((row) => migrateOne(row)));
    for (const result of results) {
      if (result.failed) failed++;
      else if (result.skipped) skipped++;
      else done++;
    }
    if (!DRY_RUN && (index + batch.length) % 200 === 0) {
      console.log(`  ... ${index + batch.length}/${pending.length} processed`);
    }
  }

  console.log(`\nDone: ${done} migrated, ${failed} failed, ${skipped} already local.`);
  if (failed > 0) {
    console.error(`${failed} image(s) failed — re-run the script to retry (it is idempotent).`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

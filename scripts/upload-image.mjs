#!/usr/bin/env node
/**
 * Upload a local image to Cloudinary with a clean public_id.
 *
 * Usage:
 *   pnpm run upload:image -- --file "C:/path/to/local.jpg" \
 *     --id "holzkraft/hero/wood-stove-living-room" [--overwrite]
 *
 * .env.local (project root, gitignored) must define:
 *   CLOUDINARY_CLOUD_NAME=...
 *   CLOUDINARY_API_KEY=...
 *   CLOUDINARY_API_SECRET=...
 *
 * NOTE: we parse .env.local ourselves rather than using node --env-file,
 * because pre-existing shell env vars (e.g. injected by an MCP or plugin)
 * silently take precedence over --env-file in some setups.
 */

import { v2 as cloudinary } from "cloudinary";
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { parseArgs } from "node:util";

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const raw = readFileSync(path, "utf8");
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i.exec(line);
    if (!m) continue;
    let value = m[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[m[1]] = value;
  }
  return out;
}

const { values } = parseArgs({
  options: {
    file: { type: "string", short: "f" },
    id: { type: "string", short: "i" },
    overwrite: { type: "boolean", default: false },
  },
});

if (!values.file || !values.id) {
  console.error("Missing --file or --id.");
  console.error(
    'Example: pnpm run upload:image -- --file "./x.jpg" --id "holzkraft/hero/name"',
  );
  process.exit(1);
}

const env = loadEnvFile(resolve(process.cwd(), ".env.local"));
const CLOUDINARY_CLOUD_NAME = env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error(
    "Missing Cloudinary values in .env.local:\n" +
      "  CLOUDINARY_CLOUD_NAME=...\n" +
      "  CLOUDINARY_API_KEY=...\n" +
      "  CLOUDINARY_API_SECRET=...",
  );
  process.exit(1);
}

if (!existsSync(values.file)) {
  console.error(`File not found: ${values.file}`);
  process.exit(1);
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

console.log(`Cloud       : ${CLOUDINARY_CLOUD_NAME}`);
console.log(`Uploading   : ${basename(values.file)}`);
console.log(`As public_id: ${values.id}\n`);

try {
  const result = await cloudinary.uploader.upload(values.file, {
    public_id: values.id,
    overwrite: values.overwrite,
    resource_type: "image",
    eager: [
      { fetch_format: "auto", quality: "auto" },
      { width: 1200, crop: "limit", fetch_format: "auto", quality: "auto" },
    ],
    tags: values.id.split("/").slice(0, -1),
  });

  console.log("✓ Uploaded");
  console.log("  public_id:", result.public_id);
  console.log("  cloud    :", CLOUDINARY_CLOUD_NAME);
  console.log("  format   :", result.format);
  console.log(
    "  size     :",
    `${result.width}×${result.height}`,
    `(${Math.round(result.bytes / 1024)} KB)`,
  );
  console.log(
    "  optimized:",
    `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/${result.public_id}`,
  );
  console.log("  secure_url:", result.secure_url);
} catch (err) {
  console.error("Upload failed:", err.message ?? err);
  if (err.http_code) console.error("HTTP", err.http_code);
  process.exit(1);
}

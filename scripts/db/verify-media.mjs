#!/usr/bin/env node
/**
 * Audit every stored product image and report the ones that cannot be tied to
 * their product.
 *
 * Three failure modes are checked:
 *   1. non-product assets that slipped past the scrape filter (payment badges,
 *      logos, catalogue mockups);
 *   2. an asset used as the main image of several different products, which
 *      therefore identifies none of them;
 *   3. an image whose file name shares nothing with the product it belongs to —
 *      reported as "unverified" rather than wrong, because plenty of legitimate
 *      photos are named after an internal SKU.
 *
 * Read-only by default. `--fix` deletes the assets in categories 1 and 2 from
 * `product_media`, keeping the product itself.
 *
 * Usage:
 *   node scripts/db/verify-media.mjs
 *   node scripts/db/verify-media.mjs --fix
 */

import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "node:util";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isGenericImage, isNonProductImage } from "../scrape/_lib/images.mjs";

const { values } = parseArgs({ options: { fix: { type: "boolean", default: false } } });

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

/** File name behind a Cloudinary public_id, without the ordering prefix. */
function assetName(publicId) {
  return (publicId.split("/").pop() ?? "").replace(/^\d+-/, "");
}

function tokens(value) {
  return new Set(
    String(value ?? "")
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/ß/g, "ss")
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 4 || /^\d{2,}$/.test(token)),
  );
}

/** Words shared by most listings carry no identifying signal. */
const STOPWORDS = new Set([
  "kaminofen",
  "pelletofen",
  "brennholz",
  "kaminholz",
  "ofenrohr",
  "holz",
  "schwarz",
  "grau",
  "stahl",
  "kamin",
  "ofen",
]);

async function readAll(query) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if ((data ?? []).length < 1000) return out;
  }
}

async function main() {
  const env = loadEnv(resolve(process.cwd(), ".env.local"));
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials in .env.local.");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const products = await readAll((from, to) =>
    supabase.from("products").select("id,slug,source,model,kind,review_status").range(from, to),
  );
  const byId = new Map(products.map((product) => [product.id, product]));

  const media = [];
  for (let index = 0; index < products.length; index += 100) {
    const ids = products.slice(index, index + 100).map((product) => product.id);
    media.push(
      ...(await readAll((from, to) =>
        supabase
          .from("product_media")
          .select("id,product_id,cloudinary_public_id,position")
          .in("product_id", ids)
          .range(from, to),
      )),
    );
  }

  // How many distinct products use each asset as their main image.
  const heroOwners = new Map();
  for (const row of media.filter((row) => row.position === 0)) {
    const name = assetName(row.cloudinary_public_id).toLowerCase();
    heroOwners.set(name, (heroOwners.get(name) ?? 0) + 1);
  }

  const nonProduct = [];
  const sharedHero = [];
  const unverified = [];

  for (const row of media) {
    const product = byId.get(row.product_id);
    if (!product) continue;
    const name = assetName(row.cloudinary_public_id);

    if (isNonProductImage(name)) {
      nonProduct.push({ row, product, name });
      continue;
    }
    if (row.position === 0 && isGenericImage(name) && (heroOwners.get(name.toLowerCase()) ?? 0) > 1) {
      sharedHero.push({ row, product, name });
      continue;
    }
    const modelTokens = [...tokens(product.model)].filter((token) => !STOPWORDS.has(token));
    const fileTokens = tokens(name);
    const matches = modelTokens.some((token) => fileTokens.has(token));
    if (!matches) unverified.push({ row, product, name });
  }

  const total = media.length;
  console.log(`${total} images over ${products.length} products`);
  console.log(`  non-product assets      : ${nonProduct.length}`);
  console.log(`  shared generic main image: ${sharedHero.length}`);
  console.log(`  unverified (no name match): ${unverified.length}`);

  for (const entry of [...nonProduct, ...sharedHero].slice(0, 10)) {
    console.log(`   ! ${entry.product.source} | ${entry.product.model.slice(0, 40)} -> ${entry.name}`);
  }
  const bySource = {};
  for (const entry of unverified) {
    bySource[entry.product.source] = (bySource[entry.product.source] ?? 0) + 1;
  }
  console.log(`  unverified by source: ${JSON.stringify(bySource)}`);

  if (!values.fix) {
    console.log("\nRead-only. Pass --fix to delete the non-product and shared-hero assets.");
    return;
  }

  const remove = [...nonProduct, ...sharedHero].map((entry) => entry.row.id);
  for (let index = 0; index < remove.length; index += 100) {
    const { error } = await supabase
      .from("product_media")
      .delete()
      .in("id", remove.slice(index, index + 100));
    if (error) throw new Error(error.message);
  }
  console.log(`\nDeleted ${remove.length} image rows.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

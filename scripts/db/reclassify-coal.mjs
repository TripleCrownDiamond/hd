#!/usr/bin/env node
/**
 * Move coal and charcoal listings to the `coal` kind and its category.
 *
 * `detectProductKind` now classifies them at scrape time, but the sources
 * already imported were classified before that rule existed: charcoal sat in
 * Ofenzubehör next to flue pipes, and charcoal briquettes sat among wood
 * briquettes, which burn differently and suit different appliances.
 *
 * Re-scraping every wood source to fix this would refetch thousands of pages
 * for a few dozen rows, so the reclassification is applied in place. It reuses
 * the same rule as the scraper, so the two cannot drift.
 *
 * Usage:
 *   node scripts/db/reclassify-coal.mjs --dry-run
 *   node scripts/db/reclassify-coal.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "node:util";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { detectProductKind } from "../scrape/_lib/wood.mjs";

const { values } = parseArgs({
  options: { "dry-run": { type: "boolean", default: false } },
});

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

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", "kohle")
    .single();
  if (categoryError) throw new Error(`Category "kohle" is missing: ${categoryError.message}`);

  const products = await readAll((from, to) =>
    supabase
      .from("products")
      .select("id,slug,kind,model,source")
      // Stoves are never fuel, and their finish is often called "Anthrazit".
      .neq("kind", "stove")
      .range(from, to),
  );

  const moving = products.filter(
    (product) => product.kind !== "coal" && detectProductKind(product.model) === "coal",
  );

  for (const product of moving) {
    console.log(`  ${product.kind} -> coal  ${product.model.slice(0, 62)}`);
  }
  console.log(`\n${moving.length} products to reclassify.`);

  if (values["dry-run"] || moving.length === 0) {
    if (values["dry-run"]) console.log("Dry run — nothing written.");
    return;
  }

  for (let index = 0; index < moving.length; index += 100) {
    const ids = moving.slice(index, index + 100).map((product) => product.id);
    const { error } = await supabase
      .from("products")
      .update({ kind: "coal", category_id: category.id })
      .in("id", ids);
    if (error) throw new Error(error.message);
  }
  console.log(`Reclassified ${moving.length} products.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

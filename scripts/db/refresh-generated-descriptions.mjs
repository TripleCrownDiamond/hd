#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildDescription } from "./_lib/describe.mjs";

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const values = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i.exec(line);
    if (!match) continue;
    const raw = match[2];
    values[match[1]] = ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'")))
      ? raw.slice(1, -1)
      : raw;
  }
  return values;
}

async function readAll(query) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    let response;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        response = await query(from, from + 999);
        if (!response.error) break;
      } catch (error) {
        if (attempt === 4) throw error;
      }
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 500 * attempt));
    }
    const { data, error } = response ?? {};
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if ((data ?? []).length < 1000) return rows;
  }
}

async function main() {
  const apply = process.argv.includes("--apply");
  const env = loadEnv(resolve(process.cwd(), ".env.local"));
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials in .env.local.");
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const products = await readAll((from, to) => supabase.from("products").select([
    "id", "slug", "kind", "model", "brand_id", "power_kw_nominal", "power_kw_min", "power_kw_max",
    "efficiency_pct", "energy_class", "fuel", "height_mm", "width_mm", "depth_mm", "weight_kg",
    "flue_diameter_mm", "bimschv_stufe", "extra",
  ].join(",")).order("id").range(from, to));
  const { data: brands, error: brandError } = await supabase.from("brands").select("id,name");
  if (brandError) throw new Error(brandError.message);
  const brandById = new Map((brands ?? []).map((brand) => [brand.id, brand.name]));
  const changes = products.flatMap((product) => {
    const previous = product.extra?.generated_description;
    const needsRepair = typeof previous === "string";
    if (!needsRepair) return [];
    const generated = buildDescription({ ...product, brand: brandById.get(product.brand_id) ?? null });
    if (!generated || generated === previous) return [];
    return [{ id: product.id, slug: product.slug, extra: { ...(product.extra ?? {}), generated_description: generated } }];
  });
  console.log(`${changes.length} of ${products.length} generated descriptions need refresh.`);
  for (const change of changes.slice(0, 20)) console.log(`DESC ${change.slug}`);
  if (!apply) {
    console.log("Dry run — pass --apply to update Supabase.");
    return;
  }
  for (let index = 0; index < changes.length; index += 10) {
    await Promise.all(changes.slice(index, index + 10).map(async (change) => {
      const { error } = await supabase.from("products").update({ extra: change.extra }).eq("id", change.id);
      if (error) throw new Error(`${change.slug}: ${error.message}`);
    }));
  }
  console.log(`Updated ${changes.length} generated descriptions.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

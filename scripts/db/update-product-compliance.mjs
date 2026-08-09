#!/usr/bin/env node
/**
 * Update products.ecodesign_2022 and products.bimschv_stufe from HKI resolution.
 * Reads resolution JSON, groups by product_slug, deduces per-product compliance.
 *
 * Idempotent: safe to re-run.
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i.exec(line);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

const env = loadEnv(resolve(process.cwd(), ".env.local"));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

const INPUT = resolve(process.cwd(), "data/scraped/hki-cert/spartherm-hki-resolution.json");

async function main() {
  const resolution = JSON.parse(readFileSync(INPUT, "utf8"));
  const devices = resolution.hki_devices || [];

  // Group by product_slug
  const byProduct = {};
  for (const d of devices) {
    if (!byProduct[d.product_slug]) byProduct[d.product_slug] = [];
    byProduct[d.product_slug].push(d);
  }

  const updates = [];
  for (const [slug, devs] of Object.entries(byProduct)) {
    const eco = devs.some((d) => d.ecodesign_passed);
    const bim = devs.some((d) => d.bimschv_passed);
    const stufe = Math.max(...devs.map((d) => d.bimschv_stufe || 0), 0);
    updates.push({
      slug,
      ecodesign_2022: eco,
      bimschv_stufe: stufe > 0 ? `Stufe ${stufe}` : null,
    });
  }

  if (updates.length === 0) {
    console.log("No products to update.");
    return;
  }

  console.log(`Updating ${updates.length} products...`);

  for (const u of updates) {
    const { error } = await supabase
      .from("products")
      .update({
        ecodesign_2022: u.ecodesign_2022,
        bimschv_stufe: u.bimschv_stufe,
        compliance_verified_at: new Date().toISOString(),
      })
      .eq("slug", u.slug);
    if (error) {
      console.error(`  Error updating ${u.slug}: ${error.message}`);
    } else {
      console.log(`  ${u.slug} → eco=${u.ecodesign_2022}, bimschv=${u.bimschv_stufe}`);
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

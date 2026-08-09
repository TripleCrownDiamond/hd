#!/usr/bin/env node
/**
 * Upsert HKI device records from the resolution file into Supabase.
 *   Reads data/scraped/hki-cert/spartherm-hki-resolution.json
 *   Uses SUPABASE_SECRET_KEY (service_role) — bypasses RLS.
 *
 * Idempotent: run again to update. Devices keyed by slug.
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0_9]+)\s*=\s*(.*?)\s*$/i.exec(line);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
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

async function loadResolution() {
  return JSON.parse(readFileSync(INPUT, "utf8"));
}

async function getProductIds(slugs) {
  const unique = [...new Set(slugs)];
  const { data, error } = await supabase
    .from("products")
    .select("slug, id")
    .in("slug", unique);
  if (error) throw new Error(`products lookup: ${error.message}`);
  return new Map((data || []).map((p) => [p.slug, p.id]));
}

async function upsertDevices(devices) {
  const productSlugs = devices.map((d) => d.product_slug);
  const productIds = await getProductIds(productSlugs);

  const rows = [];
  const missing = [];

  for (const d of devices) {
    const pid = productIds.get(d.product_slug);
    if (!pid) {
      missing.push(d.product_slug);
      continue;
    }
    rows.push({
      slug: d.slug,
      product_id: pid,
      hki_url: d.hki_url,
      product_slug: d.product_slug,
      model_label: d.model_label,
      nominal_power_kw: d.nominal_power_kw,
      rlu_approved: d.rlu_approved,
      standard: d.standard,
      test_year: d.test_year,
      test_report: d.test_report,
      ecodesign_passed: d.ecodesign_passed,
      bimschv_passed: d.bimschv_passed,
      bimschv_stufe: d.bimschv_stufe,
    });
  }

  if (missing.length > 0) {
    console.warn(`Skipping ${missing.length} devices — product not found in DB: ${missing.join(", ")}`);
  }

  if (rows.length === 0) {
    console.log("No HKI devices to upsert.");
    return;
  }

  const { error } = await supabase
    .from("hki_devices")
    .upsert(rows, { onConflict: "slug" });
  if (error) throw new Error(`hki_devices upsert: ${error.message}`);
  console.log(`Upserted ${rows.length} HKI device records.`);
}

async function main() {
  const resolution = await loadResolution();
  const devices = resolution.hki_devices;
  if (!devices || devices.length === 0) {
    console.log("No HKI devices in resolution file.");
    return;
  }
  console.log(`Loading ${devices.length} HKI devices into hki_devices table...`);
  await upsertDevices(devices);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

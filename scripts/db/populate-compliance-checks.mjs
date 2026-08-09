#!/usr/bin/env node
/**
 * Populate product_compliance_checks from the HKI resolution file.
 *   Marks 'Ecodesign 2022' and '1. BImSchV Stufe 2' as verified for products
 *   with a resolved HKI device, carrying the HKI URL as reference.
 *
 *   Unresolved products keep their existing checks untouched (pending).
 *
 * Reads data/scraped/hki-cert/spartherm-hki-resolution.json
 * Uses SUPABASE_SECRET_KEY (service_role) — bypasses RLS.
 * Idempotent: safe to re-run; upserts on (product_id, standard).
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

const STANDARD_ECODESIGN = "Ecodesign 2022";
const STANDARD_BIMSCHV = "1. BImSchV Stufe 2";

async function getProductIds(slugs) {
  const unique = [...new Set(slugs)];
  const { data, error } = await supabase
    .from("products")
    .select("slug, id")
    .in("slug", unique);
  if (error) throw new Error(`products lookup: ${error.message}`);
  return new Map((data || []).map((p) => [p.slug, p.id]));
}

async function main() {
  const resolution = JSON.parse(readFileSync(INPUT, "utf8"));
  const devices = resolution.hki_devices || [];

  const byProduct = {};
  for (const d of devices) {
    if (!byProduct[d.product_slug]) byProduct[d.product_slug] = [];
    byProduct[d.product_slug].push(d);
  }

  const productIds = await getProductIds(Object.keys(byProduct));

  const rows = [];
  const missing = [];

  for (const [slug, devs] of Object.entries(byProduct)) {
    const pid = productIds.get(slug);
    if (!pid) {
      missing.push(slug);
      continue;
    }

    const eco = devs.some((d) => d.ecodesign_passed);
    const stufe = Math.max(...devs.map((d) => d.bimschv_stufe || 0), 0);
    const primary = devs[0];

    rows.push({
      product_id: pid,
      standard: STANDARD_ECODESIGN,
      status: eco ? "verified" : "pending",
      reference: primary?.hki_url ?? null,
      verified_at: eco ? new Date().toISOString() : null,
      notes: eco ? `HKI CERT ${primary?.model_label ?? ""}`.trim() : null,
    });

    rows.push({
      product_id: pid,
      standard: STANDARD_BIMSCHV,
      status: stufe >= 2 ? "verified" : "pending",
      reference: primary?.hki_url ?? null,
      verified_at: stufe >= 2 ? new Date().toISOString() : null,
      notes: stufe >= 2 ? `HKI CERT ${primary?.model_label ?? ""}`.trim() : null,
    });
  }

  if (missing.length > 0) {
    console.warn(`Skipping ${missing.length} products not found in DB: ${missing.join(", ")}`);
  }

  if (rows.length === 0) {
    console.log("No compliance checks to upsert.");
    return;
  }

  const { error } = await supabase
    .from("product_compliance_checks")
    .upsert(rows, { onConflict: "product_id,standard" });
  if (error) throw new Error(`product_compliance_checks upsert: ${error.message}`);

  console.log(`Upserted ${rows.length} compliance checks (${Object.keys(byProduct).length} products, 2 standards each).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

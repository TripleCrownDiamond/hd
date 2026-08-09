#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { rankProductImages } from "../scrape/_lib/images.mjs";

const DETAIL = /detail|zeichnung|drawing|schnitt|diagram|skizze|label|montage|explosion|abdeckung|regler|bedienhebel|griff|ersatzteil|topplatte|bodenplatte|vorlegeplatte|hitzeschild|kochplatte|zuluftstutzen|waermespeicher|speicherstein|farben|ventilator|thermometer|i-phone|mit-app/i;
const STOP = new Set(["kaminofen", "dauerbrandofen", "pelletofen", "ofen", "ofen-de", "stahl", "kw", "mit", "ausfuhrung", "schwarz"]);

function loadEnv(path) {
  const values = {};
  if (!existsSync(path)) return values;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i.exec(line);
    if (!match) continue;
    const raw = match[2];
    values[match[1]] = ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) ? raw.slice(1, -1) : raw;
  }
  return values;
}

function folded(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

function significantTokens(model) {
  return String(model ?? "")
    .toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4 && !STOP.has(token));
}

function confident(product, currentUrl, suggestedUrl) {
  if (!DETAIL.test(decodeURIComponent(currentUrl)) || DETAIL.test(decodeURIComponent(suggestedUrl))) return false;
  const safeProductAsset = /\/media\/[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]{2}\/\d{10}\//i.test(suggestedUrl)
    || /titelbild|ambiente/i.test(decodeURIComponent(suggestedUrl));
  if (!safeProductAsset) return false;
  const candidate = folded(decodeURIComponent(suggestedUrl).split("?")[0].split("/").pop());
  const matches = significantTokens(product.model).filter((token) => candidate.includes(token));
  return new Set(matches).size >= 1;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const env = loadEnv(resolve(process.cwd(), ".env.local"));
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials in .env.local.");
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: products, error: productError } = await supabase.from("products")
    .select("id,slug,model").eq("source", "ofen-de").eq("kind", "stove").eq("review_status", "approved");
  if (productError) throw new Error(productError.message);
  const changes = [];
  for (let index = 0; index < products.length; index += 100) {
    const batch = products.slice(index, index + 100);
    const { data: rows, error } = await supabase.from("product_media")
      .select("id,product_id,position,source_url").in("product_id", batch.map((product) => product.id)).order("position");
    if (error) throw new Error(error.message);
    for (const product of batch) {
      const current = rows.filter((row) => row.product_id === product.id && row.source_url);
      if (current.length < 2) continue;
      const urls = current.map((row) => row.source_url);
      const ranked = rankProductImages(urls, product.model, "ofen-de");
      if (ranked[0] !== urls[0] && confident(product, urls[0], ranked[0])) {
        changes.push({ product, current, ranked });
      }
    }
  }
  console.log(`${changes.length} high-confidence ofen.de stove heroes need correction.`);
  for (const change of changes) console.log(`HERO ${change.product.slug}: ${change.current[0].source_url} -> ${change.ranked[0]}`);
  if (!apply) {
    console.log("Dry run — pass --apply to update Supabase.");
    return;
  }
  for (const change of changes) {
    const ordered = [
      ...change.ranked.map((url) => change.current.find((row) => row.source_url === url)).filter(Boolean),
      ...change.current.filter((row) => !change.ranked.includes(row.source_url)),
    ];
    for (const row of ordered) {
      const { error } = await supabase.from("product_media").update({ position: row.position + 10000 }).eq("id", row.id);
      if (error) throw new Error(`${change.product.slug}: ${error.message}`);
    }
    for (const [position, row] of ordered.entries()) {
      const { error } = await supabase.from("product_media").update({ position }).eq("id", row.id);
      if (error) throw new Error(`${change.product.slug}: ${error.message}`);
    }
  }
  console.log(`Corrected ${changes.length} product galleries.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

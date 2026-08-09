#!/usr/bin/env node
/**
 * TEMP probe #6:
 * - brennio: full JSON-LD ItemList (offer URLs) + one offer page structure
 * - jsmshop24: one product page (price, units, h1)
 */

import { fetchUrl } from "./scrape/_lib/fetcher.mjs";

async function getItemList(key, url) {
  const cacheDir = `data/scraped/${key}/_cache`;
  const { body } = await fetchUrl(url, { cacheDir, intervalMs: 2000 });
  const m = body.match(/<script[^>]*type="application\/ld\+json"[^>]*>\s*(\{[\s\S]*?"ItemList"[\s\S]*?\})\s*<\/script>/);
  if (!m) {
    // fallback: any ld+json containing ItemList
    const all = [...body.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
    const itemList = all.map((x) => x[1]).find((x) => x.includes("ItemList"));
    if (!itemList) {
      console.log(`${key}: no ItemList JSON-LD found`);
      return null;
    }
    try {
      const parsed = JSON.parse(itemList.replace(/\\\//g, "/"));
      const items = parsed.itemListElement ?? [];
      console.log(`${key}: ItemList offers (${items.length}):`);
      for (const it of items.slice(0, 8)) console.log(`  ${it.position}: ${it.url}`);
      return parsed;
    } catch (e) {
      console.log(`${key}: JSON-LD parse error: ${e.message}`);
      return null;
    }
  }
  try {
    const parsed = JSON.parse(m[1].replace(/\\\//g, "/"));
    const items = parsed.itemListElement ?? [];
    console.log(`${key}: ItemList offers (${items.length}):`);
    for (const it of items.slice(0, 8)) console.log(`  ${it.position}: ${it.url}`);
    return parsed;
  } catch (e) {
    console.log(`${key}: JSON-LD parse error (regex): ${e.message}`);
    return null;
  }
}

async function probeOfferPage(key, url) {
  const cacheDir = `data/scraped/${key}/_cache`;
  console.log(`\n===== ${key} offer page ${url} =====`);
  try {
    const { body } = await fetchUrl(url, { cacheDir, intervalMs: 2000 });
    console.log(`html length: ${body.length}`);
    const h1 = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "(none)";
    console.log(`h1: ${h1.slice(0, 160)}`);
    const prices = [...new Set([...body.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2})\s*€/g)].map((m) => m[0]))].slice(0, 8);
    console.log(`prices: ${prices.join(" | ") || "NONE"}`);
    const perUnit = [...new Set([...body.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2})\s*€\s*\/\s*(RM|SRM|Ster|kg|m³|m3|Palette|Sack)/gi)].map((m) => `${m[1]} €/${m[2]}`))].slice(0, 8);
    console.log(`per-unit: ${perUnit.join(" | ") || "NONE"}`);
    const units = {};
    for (const u of ["RM", "SRM", "Ster", "Palette", "Sack", "kg", "Raummeter", "Schüttraummeter", "Big Bag", "Karton"]) {
      const c = body.match(new RegExp(`\\b${u}\\b`, "gi"))?.length ?? 0;
      if (c) units[u] = c;
    }
    console.log(`units: ${JSON.stringify(units)}`);
    const cm = [...new Set([...body.matchAll(/(\d{2})\s*cm/g)].map((m) => m[1]))].slice(0, 6);
    console.log(`cm: ${cm.join(", ") || "NONE"}`);
    const jsonld = body.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g) ?? [];
    for (const b of jsonld) {
      if (/Product|Offer/i.test(b)) {
        console.log(`ld+json: ${b.replace(/\s+/g, " ").slice(0, 700)}`);
        break;
      }
    }
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }
}

async function probeJsmProduct() {
  const cacheDir = "data/scraped/jsm-brennholz/_cache";
  const url = "https://www.jsmshop24.de/Brennholz-Buche-kammergetrocknet-1-6-SRM-1-RM-Scheitlaenge-25-cm/SW10018.1";
  console.log(`\n===== jsmshop24 product =====`);
  try {
    const { body } = await fetchUrl(url, { cacheDir, intervalMs: 2000 });
    console.log(`html length: ${body.length}`);
    const h1 = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "(none)";
    console.log(`h1: ${h1.slice(0, 150)}`);
    const prices = [...new Set([...body.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2})\s*€/g)].map((m) => m[0]))].slice(0, 8);
    console.log(`prices: ${prices.join(" | ") || "NONE"}`);
    const jsonld = body.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g) ?? [];
    for (const b of jsonld) {
      if (/Product|Offer/i.test(b)) {
        console.log(`ld+json: ${b.replace(/\s+/g, " ").slice(0, 700)}`);
        break;
      }
    }
    const units = {};
    for (const u of ["RM", "SRM", "Ster", "Palette", "Sack", "kg", "Raummeter", "Schüttraummeter", "Karton"]) {
      const c = body.match(new RegExp(`\\b${u}\\b`, "gi"))?.length ?? 0;
      if (c) units[u] = c;
    }
    console.log(`units: ${JSON.stringify(units)}`);
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }
}

await getItemList("brennio", "https://www.brennio.de/shop/brennholz/_buche/");
await getItemList("kaminholz-berlin", "https://www.kaminholz-berlin.com/shop/brennholz/");

// try first offer URL from brennio (guenstig-kaufen...)
const brennioBody = await (async () => {
  const { body } = await fetchUrl("https://www.brennio.de/shop/brennholz/_buche/", { cacheDir: "data/scraped/brennio/_cache", intervalMs: 2000 });
  return body;
})();
const m = brennioBody.match(/https:\/\/www\.brennio\.de\/guenstig-kaufen[^"'\\]+/);
if (m) await probeOfferPage("brennio", m[0]);

await probeJsmProduct();
console.log("\nDone.");

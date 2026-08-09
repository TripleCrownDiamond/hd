#!/usr/bin/env node
/**
 * TEMP probe #7 — brennio/kaminholz-berlin offer pages.
 * 1) find any script tag containing "ItemList" (loose), parse offer URLs
 * 2) fetch first /guenstig-kaufen/ offer URL and dump structure
 */

import { fetchUrl } from "./scrape/_lib/fetcher.mjs";

async function findItemListUrls(key, url) {
  const cacheDir = `data/scraped/${key}/_cache`;
  const { body } = await fetchUrl(url, { cacheDir, intervalMs: 2000 });
  const scripts = [...body.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const found = [];
  for (const s of scripts) {
    if (!s.includes("ItemList")) continue;
    const urls = [...s.matchAll(/https?:\\?\/\\?\/[^"\\]+/g)].map((m) => m[0].replace(/\\\//g, "/"));
    const offerUrls = [...new Set(urls.filter((u) => u.includes("guenstig") || u.includes("kaufen") || u.includes("shop")))];
    found.push(...offerUrls);
  }
  console.log(`${key}: offer URLs found (${found.length}):`);
  for (const u of found.slice(0, 10)) console.log(`  ${u}`);
  return found[0] ?? null;
}

async function probeOffer(key, url) {
  const cacheDir = `data/scraped/${key}/_cache`;
  console.log(`\n===== ${key} offer: ${url} =====`);
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
    for (const u of ["RM", "SRM", "Ster", "Palette", "Sack", "kg", "Raummeter", "Schüttraummeter", "Big Bag", "Karton", "Scheitlänge", "Ofenfertig", "trocken"]) {
      const c = body.match(new RegExp(`\\b${u}\\b`, "gi"))?.length ?? 0;
      if (c) units[u] = c;
    }
    console.log(`units: ${JSON.stringify(units)}`);
    const cm = [...new Set([...body.matchAll(/(\d{2})\s*cm/g)].map((m) => m[1]))].slice(0, 6);
    console.log(`cm: ${cm.join(", ") || "NONE"}`);
    const essences = ["Buche", "Birke", "Eiche", "Esche", "Erle", "Fichte", "Kiefer", "Lärche", "Ahorn", "Hainbuche", "Robinie", "Nadelholz"];
    const found = [...new Set(essences.filter((e) => body.includes(e)))].slice(0, 10);
    console.log(`essences: ${found.join(", ") || "NONE"}`);
    const jsonld = body.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g) ?? [];
    for (const b of jsonld) {
      if (/Product|Offer/i.test(b)) {
        console.log(`ld+json: ${b.replace(/\s+/g, " ").slice(0, 800)}`);
        break;
      }
    }
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }
}

const brennioOffer = await findItemListUrls("brennio", "https://www.brennio.de/shop/brennholz/_buche/");
if (brennioOffer) await probeOffer("brennio", brennioOffer);

const kbOffer = await findItemListUrls("kaminholz-berlin", "https://www.kaminholz-berlin.com/shop/brennholz/");
if (kbOffer) await probeOffer("kaminholz-berlin", kbOffer);

console.log("\nDone.");

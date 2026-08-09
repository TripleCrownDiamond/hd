#!/usr/bin/env node
/**
 * TEMP probe #3 — fill remaining gaps:
 * - holzmueller /detail/<uuid> product page
 * - JSM actual shop (jsmshop24.de) product + price
 * - brennio offer detail structure + how offers are listed
 * - kaminholz-berlin offer links on /shop/brennholz/
 * - holzfront Shopify product page (JSON-LD Product)
 */

import { fetchUrl } from "./scrape/_lib/fetcher.mjs";

const PAGES = [
  { key: "holzmueller", url: "https://www.holzmueller-shop.de/detail/01903a6fd5da7328849f1f93e4799bc2" },
  { key: "jsm-brennholz", url: "https://www.jsmshop24.de/" },
  { key: "jsm-brennholz", url: "https://www.jsmshop24.de/brennholz-kaufen.brennholz_buche_33.html" },
  { key: "brennio", url: "https://www.brennio.de/shop/brennholz/_buche/" },
  { key: "kaminholz-berlin", url: "https://www.kaminholz-berlin.com/shop/brennholz/" },
  { key: "holzfront", url: "https://holzfront.de/collections/holzshop/products/buche" },
];

async function inspect({ key, url }) {
  const cacheDir = `data/scraped/${key}/_cache`;
  console.log(`\n===== ${key} — ${url} =====`);
  try {
    const { body } = await fetchUrl(url, { cacheDir, intervalMs: 2000 });
    console.log(`html length: ${body.length}`);
    const h1 = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "(none)";
    console.log(`h1: ${h1.slice(0, 150)}`);
    const priceStrings = [...new Set([...body.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2})\s*€/g)].map((m) => m[0]))].slice(0, 8);
    console.log(`prices: ${priceStrings.join(" | ") || "NONE"}`);
    const dataPrice = [...new Set([...body.matchAll(/data-price="([^"]+)"/g)].map((m) => m[1]))].slice(0, 8);
    if (dataPrice.length) console.log(`data-price: ${dataPrice.join(" | ")}`);
    // JSON-LD
    const jsonld = body.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) ?? [];
    for (const block of jsonld) {
      if (/Product|Offer|price|"offers"/i.test(block)) {
        console.log(`ld+json: ${block.replace(/\s+/g, " ").slice(0, 800)}`);
        break;
      }
    }
    // unit markers
    const units = {};
    for (const u of ["RM", "SRM", "Ster", "Palette", "Sack", "kg", "Raummeter", "Schüttraummeter", "Big Bag", "Karton"]) {
      const hits = body.match(new RegExp(`\\b${u}\\b`, "gi"))?.length ?? 0;
      if (hits) units[u] = hits;
    }
    if (Object.keys(units).length) console.log(`units: ${JSON.stringify(units)}`);
    // offer/article links (brennio/kaminholz-berlin style)
    const offerLinks = [...new Set([...body.matchAll(/href="([^"]+)"/g)].map((m) => m[1]))].filter(
      (h) => /(angebot|offers?|dealer|haendler|shop\/[a-z]|artikel|_buche|produkt)/i.test(h) && !/\.(css|js|png|jpg|svg|webp)(\?|$)/i.test(h),
    ).slice(0, 20);
    if (offerLinks.length) console.log(`offer-links: ${offerLinks.join(" | ")}`);
    // first price context (100 chars around first €)
    const pIdx = body.indexOf("€");
    if (pIdx > -1) console.log(`€ context: ${body.slice(Math.max(0, pIdx - 120), pIdx + 20).replace(/\s+/g, " ")}`);
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }
}

for (const p of PAGES) await inspect(p);
console.log("\nDone.");

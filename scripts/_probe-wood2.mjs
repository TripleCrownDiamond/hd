#!/usr/bin/env node
/**
 * TEMP probe #2 — inspect ONE product page per Wave-4 wood supplier.
 * Extracts title, price markers, unit markers (RM/SRM/kg/Palette/Sack/Ster),
 * length markers (cm), essence markers, JSON-LD Product blocks.
 */

import { fetchUrl } from "./scrape/_lib/fetcher.mjs";

const PAGES = [
  { key: "holzhof24", url: "https://holzhof24.de/brennholz/birke/brennholz-birke-25-cm-2-rm/" },
  {
    key: "frankenbrennstoffe",
    url: "https://www.frankenbrennstoffe.de/1-RM-Brennholz-BUCHE-25cm-geschlichtet-1-5-SRM-1-2-Ster/20001.FB.1",
  },
  { key: "holzmueller", url: "https://www.holzmueller-shop.de/holz-brennstoffe/brennholz/" },
  { key: "jsm-brennholz", url: "https://jsm-brennholz.de/brennholz-kaufen.brennholz_buche_33.html" },
  { key: "brennio", url: "https://www.brennio.de/shop/brennholz/_buche/" },
  { key: "holzfront", url: "https://holzfront.de/collections/holzshop" },
  { key: "kaminholz-berlin", url: "https://www.kaminholz-berlin.com/shop/brennholz/" },
];

async function inspect({ key, url }) {
  const cacheDir = `data/scraped/${key}/_cache`;
  console.log(`\n===== ${key} — ${url} =====`);
  try {
    const { body } = await fetchUrl(url, { cacheDir, intervalMs: 2000 });
    console.log(`html length: ${body.length}`);
    const h1 = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "(none)";
    console.log(`h1: ${h1.slice(0, 150)}`);
    const title = body.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "(none)";
    console.log(`title: ${title.slice(0, 150)}`);
    const priceStrings = [...new Set([...body.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2})\s*€/g)].map((m) => m[0]))].slice(0, 6);
    console.log(`prices: ${priceStrings.join(" | ") || "NONE"}`);
    // data-price attributes
    const dataPrice = [...new Set([...body.matchAll(/data-price="([^"]+)"/g)].map((m) => m[1]))].slice(0, 6);
    if (dataPrice.length) console.log(`data-price: ${dataPrice.join(" | ")}`);
    // unit markers
    const units = {};
    for (const u of ["RM", "SRM", "Ster", "Palette", "Sack", "kg", "Raummeter", "Schüttraummeter", "Bündel", "Big Bag", "Karton"]) {
      const re = new RegExp(`\\b${u}\\b`, "gi");
      const hits = body.match(re)?.length ?? 0;
      if (hits) units[u] = hits;
    }
    if (Object.keys(units).length) console.log(`units: ${JSON.stringify(units)}`);
    // length cm
    const cm = [...new Set([...body.matchAll(/(\d{2})\s*cm/g)].map((m) => m[1]))].slice(0, 8);
    console.log(`cm lengths: ${cm.join(", ") || "NONE"}`);
    // essence
    const essences = ["Buche", "Birke", "Eiche", "Esche", "Erle", "Fichte", "Kiefer", "Lärche", "Ahorn", "Hainbuche", "Robinie", "Nadelholz", "Buchenholz", "Birkenscheit"];
    const found = [...new Set(essences.filter((e) => body.includes(e)))].slice(0, 12);
    console.log(`essences found: ${found.join(", ") || "NONE"}`);
    // JSON-LD Product
    const jsonld = body.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) ?? [];
    for (const block of jsonld) {
      if (/Product|Offer|price/i.test(block)) {
        const snippet = block.replace(/\s+/g, " ").slice(0, 600);
        console.log(`ld+json (product-ish): ${snippet}`);
        break;
      }
    }
    // forms / add-to-cart markers
    console.log(`addToCart: ${/add-to-cart|addToCart|warenkorb|kaufen|in den Warenkorb/i.test(body)}`);
    // product links on listing pages
    const links = [...new Set([...body.matchAll(/href="([^"]+)"/g)].map((m) => m[1]))];
    const prodLinks = links.filter((h) => /produkt|product|\.html|artikel|\/\d+[A-Z]/i.test(h) && !/\.(css|js|png|jpg|svg|webp)(\?|$)/i.test(h)).slice(0, 15);
    console.log(`product-like links (${prodLinks.length}): ${prodLinks.join(" | ")}`);
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }
}

for (const p of PAGES) await inspect(p);
console.log("\nDone.");

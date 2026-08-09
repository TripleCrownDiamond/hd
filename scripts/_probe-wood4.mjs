#!/usr/bin/env node
/**
 * TEMP probe #4 — extract structured samples:
 * - holzmueller category: <a href="/detail/...">title</a> pairs + product cards
 * - jsmshop24.de: brennholz category links + one product page price structure
 * - brennio/kaminholz-berlin: offer card blocks (title, price, unit, dealer, length)
 */

import { fetchUrl } from "./scrape/_lib/fetcher.mjs";

async function probeHolzmueller() {
  const cacheDir = "data/scraped/holzmueller/_cache";
  const url = "https://www.holzmueller-shop.de/holz-brennstoffe/brennholz/";
  console.log(`\n===== holzmueller category =====`);
  const { body } = await fetchUrl(url, { cacheDir, intervalMs: 2000 });
  // product cards: find anchors to /detail/ with nearby title
  const cards = [...body.matchAll(/<a[^>]*href="(\/detail\/[a-f0-9]{32})"[^>]*>([\s\S]*?)<\/a>/g)]
    .map((m) => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) }))
    .filter((c) => c.text);
  console.log(`detail-cards (${cards.length}):`);
  for (const c of cards.slice(0, 15)) console.log(`  ${c.href} — ${c.text}`);
  // maybe cards are structured differently: product-box
  const prodBox = body.match(/product-box|product__box|card product|product-card|listing-product/gi);
  console.log(`product-box markers: ${[...new Set(prodBox ?? [])].join(", ") || "NONE"}`);
}

async function probeJsm() {
  const cacheDir = "data/scraped/jsm-brennholz/_cache";
  console.log(`\n===== jsmshop24.de brennholz category =====`);
  const url = "https://www.jsmshop24.de/Brennholz/";
  try {
    const { body } = await fetchUrl(url, { cacheDir, intervalMs: 2000 });
    console.log(`html length: ${body.length}`);
    const links = [...new Set([...body.matchAll(/href="([^"]+)"/g)].map((m) => m[1]))];
    const prod = links.filter((h) => /brennholz|kaminholz|scheit|holz/i.test(h) && !/\.(css|js|png|jpg|svg|webp)(\?|$)/i.test(h)).slice(0, 25);
    console.log(`product-links: ${prod.join(" | ") || "NONE"}`);
    const h1 = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "(none)";
    console.log(`h1: ${h1.slice(0, 100)}`);
  } catch (e) {
    console.log(`category error: ${e.message}`);
  }
}

async function probeOffers(key, url) {
  const cacheDir = `data/scraped/${key}/_cache`;
  console.log(`\n===== ${key} offers on ${url} =====`);
  const { body } = await fetchUrl(url, { cacheDir, intervalMs: 2000 });
  // try to find offer blocks: look for articles/rows with price + title
  const pIdx = body.indexOf("€");
  console.log(`first € context: ${body.slice(Math.max(0, pIdx - 200), pIdx + 80).replace(/\s+/g, " ").slice(0, 300)}`);
  // search for offer anchors
  const anchors = [...body.matchAll(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]{0,200}?)<\/a>/g)]
    .map((m) => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 70) }))
    .filter((a) => /€|RM|SRM|Ster|kg|Holz/i.test(a.text) && !/\.(css|js|png|jpg|svg|webp)(\?|$)/i.test(a.href));
  console.log(`offer-ish anchors (${anchors.length}):`);
  for (const a of anchors.slice(0, 15)) console.log(`  ${a.href.slice(0, 90)} — ${a.text}`);
  // look for price-per-unit strings like "xx,xx €/RM"
  const perUnit = [...new Set([...body.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2})\s*€\s*\/\s*(RM|SRM|Ster|kg|Palette|Sack|m³|m3)/gi)].map((m) => `${m[1]} €/${m[2]}`))].slice(0, 8);
  console.log(`per-unit prices: ${perUnit.join(" | ") || "NONE"}`);
}

for (const s of [
  { key: "brennio", url: "https://www.brennio.de/shop/brennholz/_buche/" },
  { key: "kaminholz-berlin", url: "https://www.kaminholz-berlin.com/shop/brennholz/" },
]) await probeOffers(s.key, s.url);

await probeHolzmueller();
await probeJsm();
console.log("\nDone.");

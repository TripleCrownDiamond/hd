#!/usr/bin/env node
/**
 * TEMP probe #5:
 * - brennio/kaminholz-berlin: look for embedded JSON (window.__, __NEXT_DATA__, state) or server-rendered offer blocks
 * - holzmueller: capture product card markup + all /detail/ hrefs
 */

import { fetchUrl } from "./scrape/_lib/fetcher.mjs";

async function probeReact(key, url) {
  const cacheDir = `data/scraped/${key}/_cache`;
  console.log(`\n===== ${key} react probe ${url} =====`);
  const { body } = await fetchUrl(url, { cacheDir, intervalMs: 2000 });
  const stateVars = [...new Set([...body.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=/g)].map((m) => m[1]))].slice(0, 20);
  console.log(`window.* vars: ${stateVars.join(", ") || "NONE"}`);
  const nextData = body.includes("__NEXT_DATA__") || body.includes("__NUXT__") || body.includes("application/json");
  console.log(`next/nuxt/data: ${nextData}`);
  // count occurrences of common offer words to see if offers are server-rendered at all
  for (const w of ["ab ", "SRM", "Ster", "kg", "Scheitlänge", "Anbieter", "Händler", "Angebot", "Preis"]) {
    const c = body.match(new RegExp(w, "gi"))?.length ?? 0;
    if (c) console.log(`  "${w}" × ${c}`);
  }
  // any <script> with huge JSON?
  const scripts = [...body.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const big = scripts.filter((s) => s.length > 2000);
  console.log(`scripts >2k chars: ${big.length}`);
  for (const s of big.slice(0, 2)) {
    const hasProduct = /Product|product|offers|price|Buche/i.test(s);
    console.log(`  big script ${s.length} chars, product-ish: ${hasProduct} — head: ${s.replace(/\s+/g, " ").slice(0, 150)}`);
  }
}

async function probeHolzmueller() {
  const cacheDir = "data/scraped/holzmueller/_cache";
  console.log(`\n===== holzmueller cards =====`);
  const url = "https://www.holzmueller-shop.de/holz-brennstoffe/brennholz/";
  const { body } = await fetchUrl(url, { cacheDir, intervalMs: 2000 });
  const detailHrefs = [...new Set([...body.matchAll(/href="([^"]*\/detail\/[a-f0-9]{32})"/g)].map((m) => m[1]))];
  console.log(`detail hrefs (${detailHrefs.length}): ${detailHrefs.slice(0, 12).join(" | ")}`);
  // find one card container
  const cardIdx = body.indexOf("card product");
  if (cardIdx > -1) {
    console.log(`card markup: ${body.slice(cardIdx - 100, cardIdx + 900).replace(/\s+/g, " ").slice(0, 1000)}`);
  }
}

await probeReact("brennio", "https://www.brennio.de/shop/brennholz/_buche/");
await probeReact("kaminholz-berlin", "https://www.kaminholz-berlin.com/shop/brennholz/");
await probeHolzmueller();
console.log("\nDone.");

#!/usr/bin/env node
/**
 * TEMP probe — inspect the 7 Wave-4 wood supplier sites.
 * Fetches robots.txt + main category page, prints structural hints.
 * Respects robots.txt via _lib/fetcher (checkRobots default true).
 */

import { fetch as undiciFetch } from "undici";
import { fetchUrl } from "./scrape/_lib/fetcher.mjs";

const SOURCES = [
  { key: "holzhof24", url: "https://holzhof24.de/brennholz/", robots: "https://holzhof24.de/robots.txt" },
  {
    key: "frankenbrennstoffe",
    url: "https://www.frankenbrennstoffe.de/Brennstoffe/Sortiment/Brennholz/",
    robots: "https://www.frankenbrennstoffe.de/robots.txt",
  },
  { key: "holzmueller", url: "https://www.holzmueller-shop.de/", robots: "https://www.holzmueller-shop.de/robots.txt" },
  { key: "jsm-brennholz", url: "https://jsm-brennholz.de/", robots: "https://jsm-brennholz.de/robots.txt" },
  { key: "brennio", url: "https://www.brennio.de/", robots: "https://www.brennio.de/robots.txt" },
  { key: "holzfront", url: "https://holzfront.de/", robots: "https://holzfront.de/robots.txt" },
  { key: "kaminholz-berlin", url: "https://www.kaminholz-berlin.com/", robots: "https://www.kaminholz-berlin.com/robots.txt" },
];

async function getRobots(robotsUrl) {
  try {
    const res = await undiciFetch(robotsUrl, {
      headers: { "user-agent": "HOLZKRAFT-Catalog-Bot/1.0 (contact@holzkraft.de)" },
      redirect: "follow",
    });
    const body = await res.text();
    const disallow = [...body.matchAll(/^Disallow:\s*(.*)$/gim)].map((m) => m[1].trim());
    const sitemaps = [...body.matchAll(/^Sitemap:\s*(.*)$/gim)].map((m) => m[1].trim());
    const userAgents = [...body.matchAll(/^User-agent:\s*(.*)$/gim)].map((m) => m[1].trim());
    return { status: res.status, userAgents, disallow: disallow.slice(0, 20), sitemaps };
  } catch (e) {
    return { error: e.message };
  }
}

async function inspectSite({ key, url }) {
  const cacheDir = `data/scraped/${key}/_cache`;
  console.log(`\n===== ${key} — ${url} =====`);
  try {
    const { body, fromCache } = await fetchUrl(url, { cacheDir, intervalMs: 2000 });
    console.log(`status: fetched${fromCache ? " (cached)" : ""}, html length: ${body.length}`);
    const title = body.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "(none)";
    console.log(`title: ${title.slice(0, 120)}`);
    const og = body.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/i)?.[1] ?? null;
    if (og) console.log(`og:title: ${og.slice(0, 120)}`);
    // price hints
    const priceHits = [...new Set([...body.matchAll(/€|EUR|preis|price|Preis/gi)].map((m) => m[0]))];
    console.log(`price hints: ${priceHits.slice(0, 8).join(",") || "NONE"}`);
    const cents = body.match(/\d{1,3}(?:\.\d{3})*,\d{2}\s*€/);
    if (cents) console.log(`sample price string: ${cents[0]}`);
    // JSON-LD
    const jsonld = body.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    console.log(`json-ld blocks: ${jsonld?.length ?? 0}`);
    if (jsonld) {
      for (const block of jsonld.slice(0, 3)) {
        const types = [...block.matchAll(/"@type"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);
        console.log(`  ld+json types: ${[...new Set(types)].join(", ")}`);
      }
    }
    // product links
    const links = [...new Set([...body.matchAll(/href="([^"]+)"/g)].map((m) => m[1]))].filter(
      (h) => !/\.(css|js|png|jpg|jpeg|svg|webp|ico|woff2?)(\?|$)/i.test(h),
    );
    const productLike = links.filter(
      (h) => /produkt|brennholz|kaminholz|artikel|product|shop/i.test(h) && !/impressum|datenschutz|agb|warenkorb|kontakt/i.test(h),
    );
    console.log(`total links: ${links.length}, product-like: ${productLike.length}`);
    console.log(`sample product-like: ${productLike.slice(0, 12).join(" | ")}`);
    // form markers (shop systems)
    console.log(`woocommerce: ${/woocommerce|wc-|product_cat/i.test(body)}, shopware: ${/shopware|sw-|buy_box/i.test(body)}, magento: ${/mage-|Magento/i.test(body)}`);
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }
}

for (const s of SOURCES) {
  const rb = await getRobots(s.robots);
  console.log(`\n--- robots.txt ${s.key} ---`);
  if (rb.error) console.log(`robots fetch error: ${rb.error}`);
  else {
    console.log(`user-agents: ${rb.userAgents.slice(0, 5).join(",") || "(none)"}`);
    console.log(`disallow (${rb.disallow.length}): ${rb.disallow.slice(0, 10).join(" | ") || "(none)"}`);
    console.log(`sitemaps: ${rb.sitemaps.join(" | ") || "(none)"}`);
  }
}
for (const s of SOURCES) await inspectSite(s);

console.log("\nDone.");

import { fetchUrl } from "./scrape/_lib/fetcher.mjs";

const url = "https://camina-schmid.de/produkte/kaminoefen";
const res = await fetchUrl(url, { cacheDir: null, intervalMs: 1000, maxAttempts: 1 });
const html = res.body;
console.log("size:", html.length);

// product cards
const cards = [...html.matchAll(/<a[^>]*href="([^"]*(?:produkte|pdf|fileadmin)[^"]*)"[^>]*>([\s\S]*?)<\/a>/g)]
  .filter((m) => /fileadmin|produkt/.test(m[1]))
  .map((m) => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() }));
console.log("cards:", cards.length);
for (const c of cards.slice(0, 30)) console.log("  ", c.href, "|", c.text.slice(0, 60));

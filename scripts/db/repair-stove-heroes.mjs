#!/usr/bin/env node
/**
 * Promote a real photograph of the stove to position 0 when the main image is
 * something else.
 *
 * Scrapers pick the first usable image on a product page, and on several shops
 * that is a mounting example, an exploded view, a spare part, a control knob or
 * a dimension drawing. The product itself is fine — the gallery is simply in the
 * wrong order — so the fix is a reorder, never a deletion.
 *
 * `fix-ofen-de-stove-heroes.mjs` does the same thing for one source under a much
 * stricter confidence rule. This one covers every source and ranks on the
 * Cloudinary public id, which is present on every row (`source_url` is not).
 *
 * Usage:
 *   node scripts/db/repair-stove-heroes.mjs                 # report only
 *   node scripts/db/repair-stove-heroes.mjs --report out.md # report to a file
 *   node scripts/db/repair-stove-heroes.mjs --apply         # reorder galleries
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { rankProductImages } from "../scrape/_lib/images.mjs";

/**
 * Filename fragments that describe a part, a drawing or an installation shot
 * rather than the stove. Wider than the shared `isNonProductImage` list, which
 * targets shop chrome (payment badges, carrier logos) instead.
 */
const NOT_THE_STOVE =
  /detail|zeichnung|drawing|masse|schnitt|skizze|energielabel|(^|[^a-z])label|montage|explosion|abdeckplatte|abdeckung|regler|bedienhebel|griff|ersatzteil|symbole|schema|steuerung|feder|zubehoer|vorlegeplatte|hitzeschild|topplatte|bodenplatte|kochplatte|zuluftstutzen|speicherstein|ventilator|thermometer/i;

/**
 * Additionally barred from *becoming* a hero.
 *
 * A colour chart, a variants overview, a material sample or a dealer-finder
 * screenshot all pass the part filter — none of them shows the stove. Promoting
 * one only swaps a wrong image for another wrong image, so the candidate list
 * excludes them even though the current hero is judged on the narrower rule.
 */
const NEVER_A_HERO =
  /farben|farbmuster|varianten|muster|waermespeicher|speichersteine|zuluftkit|haendlersuche|händlersuche|grid-|uebersicht|übersicht|sortiment|serie-|vergleich|pflege|reinigung/i;

/** Tokens of a model name that a filename can be matched against. */
const MODEL_STOPWORDS = new Set([
  "kaminofen", "dauerbrandofen", "pelletofen", "ofen", "stahl", "ausfuehrung", "ausfuhrung",
  "korpus", "schwarz", "grau", "weiss", "seitenglas", "sockel", "mit", "und", "rauchabgang",
]);

function modelTokens(model) {
  return String(model ?? "")
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4 && !MODEL_STOPWORDS.has(token));
}

/**
 * A replacement we would stand behind without a human looking at it.
 *
 * Either the filename names the model, or it is one of the opaque asset ids
 * ofen.de uses for its own product photography (`162077.webp`), or the shop
 * flagged it as the title/cut-out shot.
 */
function confidentReplacement(name, tokens) {
  if (NOT_THE_STOVE.test(name) || NEVER_A_HERO.test(name)) return false;
  if (/^[0-9a-f]{6,}\.[a-z0-9]+$/i.test(name) || /^\d{4,}\./.test(name)) return true;
  if (/titelbild|freisteller|packshot|produkt/i.test(name)) return true;
  const folded = name.replace(/[^a-z0-9]/g, "");
  return tokens.some((token) => folded.includes(token));
}

function loadEnv(path) {
  const values = {};
  if (!existsSync(path)) return values;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i.exec(line);
    if (!match) continue;
    const raw = match[2];
    values[match[1]] =
      (raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))
        ? raw.slice(1, -1)
        : raw;
  }
  return values;
}

/** The asset a public_id points at, ignoring the ordering prefix. */
function assetName(publicId) {
  return (String(publicId).split("/").pop() ?? "").replace(/^\d+-/, "").toLowerCase();
}

/**
 * Retry a single write.
 *
 * Reordering a gallery is several hundred round trips to a hosted database, and
 * one dropped connection used to abort the run between parking a gallery out of
 * range and renumbering it — the window where a product has no image at
 * position 0 and therefore no main image at all.
 */
async function withRetry(label, run) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const { error } = await run();
      if (!error) return;
      lastError = new Error(error.message);
    } catch (error) {
      lastError = error;
    }
    if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
  }
  throw new Error(`${label}: ${lastError?.message ?? lastError}`);
}

async function readAll(query) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if ((data ?? []).length < 1000) return out;
  }
}

/**
 * A model name that names no model.
 *
 * Several Austroflamm listings came through the scrape carrying only the brand,
 * so the storefront shows a dozen products all called "Austroflamm". The image
 * may be fine; the listing still cannot be told apart from its neighbours.
 */
const BRAND_ONLY_MODELS = new Set([
  "austroflamm", "spartherm", "wodtke", "rika", "jotul", "jøtul",
  "hark", "camina", "skantherm", "maxblank", "max blank", "olsberg", "ofenkoppe",
]);

function isBrandOnlyModel(model) {
  const clean = String(model ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  // Only the bare brand counts. A short name is not a missing one — "ZIO"
  // (Camina) and "SOL" (RIKA) are the real model names.
  return clean === "" || BRAND_ONLY_MODELS.has(clean);
}

async function main() {
  const apply = process.argv.includes("--apply");
  const deleteAmbiguous = process.argv.includes("--delete-ambiguous");
  const reportIndex = process.argv.indexOf("--report");
  const reportPath = reportIndex === -1 ? null : process.argv[reportIndex + 1];

  const env = loadEnv(resolve(process.cwd(), ".env.local"));
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials in .env.local.");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const products = await readAll((from, to) =>
    supabase
      .from("products")
      .select("id,slug,model,source")
      .eq("kind", "stove")
      .eq("review_status", "approved")
      .eq("is_published", true)
      .order("id")
      .range(from, to),
  );

  const media = await readAll((from, to) =>
    supabase
      .from("product_media")
      .select("id,product_id,position,cloudinary_public_id")
      .order("product_id")
      .order("position")
      .range(from, to),
  );

  const galleries = new Map();
  for (const row of media) {
    if (!galleries.has(row.product_id)) galleries.set(row.product_id, []);
    galleries.get(row.product_id).push(row);
  }

  // How many distinct products use each asset as their main image. A hero shared
  // by several products identifies none of them.
  const heroOwners = new Map();
  for (const rows of galleries.values()) {
    const hero = rows.find((row) => row.position === 0);
    if (!hero) continue;
    const name = assetName(hero.cloudinary_public_id);
    heroOwners.set(name, (heroOwners.get(name) ?? 0) + 1);
  }

  const repairs = [];
  const uncertain = [];
  const unfixable = [];
  const sharedOnly = [];
  const brandOnly = [];

  for (const product of products) {
    if (isBrandOnlyModel(product.model)) brandOnly.push({ product });
    const rows = (galleries.get(product.id) ?? []).slice().sort((a, b) => a.position - b.position);
    const hero = rows.find((row) => row.position === 0);
    if (!hero) {
      unfixable.push({ product, reason: "aucune image" });
      continue;
    }
    const heroName = assetName(hero.cloudinary_public_id);
    const heroIsPart = NOT_THE_STOVE.test(heroName);
    const heroIsShared = (heroOwners.get(heroName) ?? 0) > 1;
    if (!heroIsPart && !heroIsShared) continue;

    const tokens = modelTokens(product.model);
    const ids = rows.map((row) => row.cloudinary_public_id);
    const ranked = rankProductImages(ids, product.model, product.source);
    // Never trade one wrong image for another, and never promote an asset that
    // is *already* some other product's main image — `<= 1` used to allow
    // exactly that, so a run resolved one duplicate by creating another and the
    // next run found the same number of problems in different places.
    const candidates = ranked.filter(
      (id) =>
        id !== hero.cloudinary_public_id &&
        !NOT_THE_STOVE.test(assetName(id)) &&
        !NEVER_A_HERO.test(assetName(id)) &&
        (heroOwners.get(assetName(id)) ?? 0) === 0,
    );
    const best = candidates[0];

    if (!best) {
      if (heroIsPart) unfixable.push({ product, hero: heroName, reason: "aucune alternative utilisable" });
      else sharedOnly.push({ product, hero: heroName, n: heroOwners.get(heroName) });
      continue;
    }
    // Claim the asset now: two products further apart in the same run must not
    // both settle on it.
    heroOwners.set(heroName, Math.max(0, (heroOwners.get(heroName) ?? 1) - 1));
    heroOwners.set(assetName(best), 1);

    const entry = { product, rows, from: heroName, to: assetName(best), best };
    if (confidentReplacement(assetName(best), tokens)) repairs.push(entry);
    else uncertain.push(entry);
  }

  const lines = [];
  lines.push(`# Images principales des poêles\n`);
  lines.push(`${products.length} poêles publiés analysés.\n`);
  lines.push(`- **${repairs.length}** réparables avec confiance : le remplacement nomme le modèle ou est une photo produit de la boutique.`);
  lines.push(`- **${uncertain.length}** à vérifier à l'œil : un remplacement existe mais rien ne prouve qu'il montre ce poêle.`);
  lines.push(`- **${unfixable.length}** sans alternative : la galerie ne contient aucune photo du poêle.`);
  lines.push(`- **${sharedOnly.length}** image partagée avec un autre produit, sans meilleure option.`);
  lines.push(`- **${brandOnly.length}** modèle sans nom : la fiche ne porte que la marque.\n`);
  lines.push(`Seul le premier groupe est modifié par \`--apply\`.\n`);

  lines.push(`## Réparables avec confiance (${repairs.length})\n`);
  lines.push(`| Source | Modèle | Image actuelle | Image proposée |`);
  lines.push(`| --- | --- | --- | --- |`);
  for (const item of repairs) {
    lines.push(
      `| ${item.product.source} | ${item.product.model} | \`${item.from}\` | \`${item.to}\` |`,
    );
  }

  lines.push(`\n## À vérifier à l'œil (${uncertain.length})\n`);
  lines.push(`| Source | Modèle | Image actuelle | Meilleur candidat |`);
  lines.push(`| --- | --- | --- | --- |`);
  for (const item of uncertain) {
    lines.push(
      `| ${item.product.source} | ${item.product.model} | \`${item.from}\` | \`${item.to}\` |`,
    );
  }

  lines.push(`\n## Sans alternative (${unfixable.length})\n`);
  lines.push(`| Source | Modèle | Image actuelle | Raison |`);
  lines.push(`| --- | --- | --- | --- |`);
  for (const item of unfixable) {
    lines.push(`| ${item.product.source} | ${item.product.model} | \`${item.hero ?? "—"}\` | ${item.reason} |`);
  }

  lines.push(`\n## Image partagée, pas de meilleure option (${sharedOnly.length})\n`);
  lines.push(`| Source | Modèle | Image actuelle | Produits partageant |`);
  lines.push(`| --- | --- | --- | --- |`);
  for (const item of sharedOnly) {
    lines.push(`| ${item.product.source} | ${item.product.model} | \`${item.hero}\` | ${item.n} |`);
  }

  lines.push(`\n## Modèle sans nom (${brandOnly.length})\n`);
  lines.push(`| Source | Modèle | Slug |`);
  lines.push(`| --- | --- | --- |`);
  for (const item of brandOnly) {
    lines.push(`| ${item.product.source} | ${item.product.model} | ${item.product.slug} |`);
  }

  const report = lines.join("\n");
  if (reportPath) {
    writeFileSync(reportPath, report, "utf8");
    console.log(`Rapport écrit dans ${reportPath}`);
  }
  console.log(
    `${products.length} poêles · ${repairs.length} réparables · ${uncertain.length} à vérifier · ${unfixable.length} sans alternative · ${sharedOnly.length} image partagée · ${brandOnly.length} sans nom`,
  );

  /**
   * Everything the gallery cannot rescue: no trustworthy replacement exists, or
   * the listing carries no model name to tell it apart. Deleting cascades to
   * `product_media`, `product_variants` and `product_documents`; `order_items`
   * keeps its own name snapshot, so order history survives.
   */
  const doomed = new Map();
  for (const item of [...uncertain, ...unfixable, ...sharedOnly, ...brandOnly]) {
    doomed.set(item.product.id, item.product);
  }

  if (deleteAmbiguous) {
    const ids = [...doomed.keys()];
    console.log(`Suppression de ${ids.length} poêles ambigus…`);
    for (let index = 0; index < ids.length; index += 100) {
      const { error } = await supabase.from("products").delete().in("id", ids.slice(index, index + 100));
      if (error) throw new Error(error.message);
    }
    console.log(`${ids.length} poêles supprimés.`);
  }

  if (!apply) {
    if (!deleteAmbiguous) console.log("Rapport seul — passez --apply pour réordonner les galeries.");
    return;
  }

  // A deleted product must not be "repaired" on the way out.
  const pending = repairs.filter((item) => !doomed.has(item.product.id));
  for (const item of pending) {
    const ordered = [
      item.rows.find((row) => row.cloudinary_public_id === item.best),
      ...item.rows.filter((row) => row.cloudinary_public_id !== item.best),
    ];
    // `product_media` has a unique (product_id, position) index, so the rows are
    // parked out of range before being renumbered.
    for (const row of ordered) {
      await withRetry(item.product.slug, () =>
        supabase
          .from("product_media")
          .update({ position: row.position + 10_000 })
          .eq("id", row.id),
      );
    }
    for (const [position, row] of ordered.entries()) {
      await withRetry(item.product.slug, () =>
        supabase.from("product_media").update({ position }).eq("id", row.id),
      );
    }
  }
  console.log(`${pending.length} galeries réordonnées.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

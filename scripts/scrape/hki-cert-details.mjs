#!/usr/bin/env node
/**
 * Extract HKI CERT detail pages for candidate matches and compare with
 * Spartherm product data to disambiguate versions.
 *
 * Reads:   data/scraped/hki-cert/spartherm-matches.jsonl
 * Fetches: HKI CERT detail pages for each candidate
 * Outputs: data/scraped/hki-cert/spartherm-candidates-reviewed.jsonl
 *
 * Usage:   node scripts/scrape/hki-cert-details.mjs [--limit 5] [--from 0]
 */

import { load as loadCheerio } from "cheerio";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { parseArgs } from "node:util";
import { fetchUrl } from "./_lib/fetcher.mjs";
import { createHash } from "node:crypto";

const CACHE_DIR = "data/scraped/hki-cert/_cache";
const MATCHES_FILE = "data/scraped/hki-cert/spartherm-matches.jsonl";
const DETAILS_FILE = "data/scraped/hki-cert/spartherm-candidates-details.jsonl";
const REVIEW_FILE = "data/scraped/hki-cert/spartherm-candidates-reviewed.jsonl";
const SPARTHERM_FILE = "data/scraped/spartherm/published.jsonl";

const { values } = parseArgs({
  options: {
    limit: { type: "string", default: "5" },
    from: { type: "string", default: "0" },
  },
});

const LIMIT = parseInt(values.limit, 10);
const FROM = parseInt(values.from, 10);

function ratingIcon(path) {
  if (!path) return null;
  const name = path.split("/").pop().replace(".svg", "");
  if (name === "green_check") return "pass";
  if (name === "green_check_2") return "pass_stufe2";
  if (name === "green_check_1") return "pass_stufe1";
  if (name === "green_check_2015") return "pass_at_2015";
  if (name === "green_check_7_star") return "pass_fr_7star";
  if (name === "green_check_with_4_stars") return "pass_it_4star";
  if (name === "red_hyphen") return "no";
  if (name === "grey_hyphen") return "unknown";
  if (name === "grey_exclamation_mark") return "no_data";
  return name;
}

function parseDetailPage(html, candidateUrl) {
  const $ = loadCheerio(html);
  const result = {
    url: candidateUrl,
    master: {},
    emissions: {},
    compliance: {},
  };

  // --- Stammdaten ---
  $("fieldset").each((_, fs) => {
    const legend = $(fs).find("legend").text().trim();

    if (legend === "Stammdaten") {
      $(fs).find("table tr").each((_, tr) => {
        const th = $(tr).find("th").text().trim();
        const td = $(tr).find("td").text().trim();
        if (th && td) result.master[th] = td;
      });
      // Check RLU approval specifically
      $(fs).find("table tr").each((_, tr) => {
        const th = $(tr).find("th").text().trim();
        if (th.includes("raumluftunabhängigen")) {
          const img = $(tr).find("td img.rating");
          result.master.rlu_approved = ratingIcon(img.attr("src"));
        }
      });
    }

    if (legend === "weitere wichtige Geräteeigenschaften") {
      $(fs).find("table tr").each((_, tr) => {
        const th = $(tr).find("th").text().trim();
        const img = $(tr).find("td img.rating");
        if (th.includes("raumluftunabhängigen")) {
          result.master.rlu_approved = ratingIcon(img.attr("src"));
        }
        if (th.includes("Zentralheizsystem")) {
          result.master.central_heating = ratingIcon(img.attr("src"));
        }
      });
    }

    // --- Emissions & compliance ---
    if (legend.includes("Emissionsdaten") || legend.includes("Bewertung")) {
      const fuel = legend.includes("Holz") ? "holz" : legend.includes("Braunkohlen") ? "braunkohlen" : "other";
      if (!result.emissions.fuels) result.emissions.fuels = {};
      result.emissions.fuels[fuel] = {};

      $(fs).find("table > tbody > tr").each((_, tr) => {
        const label = $(tr).find("td").first().text().trim();
        if (!label) return;

        const img = $(tr).find("td img.rating");
        const rating = ratingIcon(img.attr("src"));

        // Check for details tooltip
        const tooltipId = $(tr).find("span[data-tooltip]").attr("data-tooltip");
        const subChecks = {};
        if (tooltipId) {
          const safeId = tooltipId.replace(/[^\w-]/g, "\\$&");
          const tooltipDiv = $(`#${safeId}`);
          tooltipDiv.find("table tr").each((_, subtr) => {
            const subLabel = $(subtr).find("td").first().text().trim();
            const subImg = $(subtr).find("td img.rating");
            if (subLabel) {
              subChecks[subLabel] = ratingIcon(subImg.attr("src"));
            }
          });
        }

        const regName = label.replace(/\s+/g, " ").trim();
        result.emissions.fuels[fuel][regName] = { rating, details: subChecks };
      });
    }
  });

  return result;
}

function loadJsonl(path) {
  if (!existsSync(path)) return [];
  return readFile(path, "utf8").then((content) =>
    content
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .map((l) => JSON.parse(l)),
  );
}

async function loadProducts() {
  if (!existsSync(SPARTHERM_FILE)) return new Map();
  const products = await loadJsonl(SPARTHERM_FILE);
  return new Map(products.map((p) => [p.slug, p]));
}

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });

  const matches = await loadJsonl(MATCHES_FILE);
  const productsMap = await loadProducts();

  const batch = matches
    .filter((m) => m.candidates && m.candidates.length > 0)
    .slice(FROM, FROM + LIMIT);

  console.log(`Processing ${batch.length} products (offset=${FROM}, limit=${LIMIT})…\n`);

  const allDetails = [];

  for (const match of batch) {
    const product = productsMap.get(match.product_slug);
    console.log(`\n${"=".repeat(80)}`);
    console.log(`Product: ${match.product_model} (${match.product_slug})`);
    console.log(`Candidates: ${match.candidates.length}`);

    // Print product technical data summary
    if (product) {
      const t = product.technical;
      console.log(`  Spartherm specs:`);
      console.log(`    Power: ${t.power_kw_min ?? "?"} – ${t.power_kw_max ?? "?"} kW`);
      console.log(`    Energy class: ${t.energy_class ?? "?"}`);
      console.log(`    RLU: ${t.raw_air_independent ?? "?"}`);
      console.log(`    Dimensions: ${t.dimensions_mm?.height ?? "?"}h × ${t.dimensions_mm?.width ?? "?"}w × ${t.dimensions_mm?.depth ?? "?"}d mm`);
    }

    const candidateDetails = [];

    for (const candidate of match.candidates) {
      console.log(`\n  Fetching: ${candidate.label}`);
      try {
        const response = await fetchUrl(candidate.url, {
          cacheDir: CACHE_DIR,
          intervalMs: 2000,
        });
        const detail = parseDetailPage(response.body, candidate.url);
        detail.candidate_label = candidate.label;
        detail.product_slug = match.product_slug;
        detail.product_model = match.product_model;
        candidateDetails.push(detail);

        // Print key matching info
        const m = detail.master;
        console.log(`    Model: ${m["Modell"] ?? "?"}`);
        console.log(`    Power: ${m["Nennwärmeleistung [kW]"] ?? "?"} kW`);
        console.log(`    RLU approved: ${detail.master.rlu_approved ?? "?"}`);
        console.log(`    Standard: ${m["Norm der Typprüfung"] ?? "?"}`);
        console.log(`    Test year: ${m["Prüfjahr"] ?? "?"}`);
        console.log(`    Test report: ${m["Nummer des Prüfberichts"] ?? "?"}`);
        const holz = detail.emissions?.fuels?.holz ?? {};
        const eco = Object.entries(holz).find(([k]) => k.includes("2015/1185") || k.includes("Ökodesign"));
        const bim = Object.entries(holz).find(([k]) => k.includes("BImSchV"));
        console.log(`    Ecodesign: ${eco?.[1]?.rating ?? "?"}`);
        console.log(`    1.BImSchV: ${bim?.[1]?.rating ?? "?"}`);
      } catch (err) {
        console.error(`    Error: ${err.message}`);
      }
    }

    allDetails.push({
      product_slug: match.product_slug,
      product_model: match.product_model,
      candidates: candidateDetails,
    });
  }

  // Save raw details
  await writeFile(
    DETAILS_FILE,
    allDetails.map((d) => JSON.stringify(d)).join("\n") + "\n",
  );
  console.log(`\n${"=".repeat(80)}`);
  console.log(`Raw details saved to ${DETAILS_FILE}`);

  // Generate review suggestions
  const suggestions = [];
  for (const entry of allDetails) {
    const product = productsMap.get(entry.product_slug);
    const suggestion = {
      product_slug: entry.product_slug,
      product_model: entry.product_model,
      spartherm_specs: product ? {
        power_kw_min: product.technical.power_kw_min,
        power_kw_max: product.technical.power_kw_max,
        energy_class: product.technical.energy_class,
        raw_air_independent: product.technical.raw_air_independent,
      } : null,
      candidates: entry.candidates.map((c) => ({
        label: c.candidate_label,
        url: c.url,
        power: c.master["Nennwärmeleistung [kW]"],
        rlu_approved: c.master.rlu_approved,
        test_year: c.master["Prüfjahr"],
        test_report: c.master["Nummer des Prüfberichts"],
        ecodesign: c.emissions?.fuels?.holz ? (Object.entries(c.emissions.fuels.holz).find(([k]) => k.includes("2015/1185") || k.includes("Ökodesign"))?.[1]?.rating ?? null) : null,
        bimschv: c.emissions?.fuels?.holz ? (Object.entries(c.emissions.fuels.holz).find(([k]) => k.includes("BImSchV"))?.[1]?.rating ?? null) : null,
      })),
      suggested_version: null,
      confidence: "low",
      notes: "",
    };
    suggestions.push(suggestion);
  }

  // Also include products with no candidates for completeness
  const noMatch = matches.filter((m) => !m.candidates || m.candidates.length === 0);
  for (const m of noMatch) {
    const product = productsMap.get(m.product_slug);
    suggestions.push({
      product_slug: m.product_slug,
      product_model: m.product_model,
      spartherm_specs: product ? {
        power_kw_min: product.technical.power_kw_min,
        power_kw_max: product.technical.power_kw_max,
        energy_class: product.technical.energy_class,
        raw_air_independent: product.technical.raw_air_independent,
      } : null,
      candidates: [],
      suggested_version: null,
      confidence: "none",
      notes: "No HKI candidates found by model name matching. May need manual search on HKI CERT.",
    });
  }

  await writeFile(
    REVIEW_FILE,
    suggestions.map((s) => JSON.stringify(s, null, 2)).join("\n") + "\n",
  );
  console.log(`Review data saved to ${REVIEW_FILE}`);

  // Summary table
  console.log(`\n${"=".repeat(80)}`);
  console.log("BATCH SUMMARY");
  console.log(`${"=".repeat(80)}`);
  for (const s of suggestions) {
    const c = s.candidates;
    console.log(`\n${s.product_model}`);
    console.log(`  Candidates: ${c.length}`);
    if (c.length > 0) {
      for (const cand of c) {
        console.log(`    - ${cand.label}`);
        console.log(`      Power: ${cand.power ?? "?"} kW | RLU: ${cand.rlu_approved ?? "?"} | Ecodesign: ${cand.ecodesign ?? "?"} | BImSchV: ${cand.bimschv ?? "?"}`);
      }
    } else {
      console.log(`  ${s.notes}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

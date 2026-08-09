#!/usr/bin/env node
/**
 * Auto-resolve HKI CERT matches for Spartherm products.
 *
 * Strategy: for each product, filter candidates by name (steel, style, etc.),
 * then pick the latest version. Include RLU variant when RLU is supported.
 *
 * Output:   data/scraped/hki-cert/spartherm-hki-resolution.json
 *           (to be reviewed and then persisted to Supabase)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SPARTHERM_FILE = "data/scraped/spartherm/published.jsonl";
const DETAILS_FILE = "data/scraped/hki-cert/spartherm-candidates-details.jsonl";
const OUTPUT_FILE = "data/scraped/hki-cert/spartherm-hki-resolution.json";

function loadJsonl(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

async function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2));
}

function parseVersion(label) {
  const stripped = label.replace(/\s*\([^)]*\)\s*$/, "");
  const m = stripped.match(/(\d+)[.,]0\s*$/);
  return m ? parseInt(m[1], 10) : 0;
}

function hasToken(label, token) {
  return label.toLowerCase().includes(token.toLowerCase());
}

function resolveProduct(productModel, product, candidates) {
  const modelLower = productModel.toLowerCase();
  const hasSteel = hasToken(modelLower, "steel");
  const hasStyle = hasToken(modelLower, "style");
  const hasClassic = hasToken(modelLower, "klassik");
  const hasFashion = hasToken(modelLower, "fashion");
  const hasH2o = hasToken(modelLower, "h₂o") || hasToken(modelLower, "h2o");
  const hasTripod = hasToken(modelLower, "tripod");

  let filtered = candidates.filter((c) => {
    const cl = c.candidate_label.toLowerCase();
    // Steel match
    if (hasSteel && !hasToken(cl, "steel")) return false;
    if (!hasSteel && hasToken(cl, "steel")) return false;
    // Style match
    if (hasStyle && !hasToken(cl, "style")) return false;
    if (!hasStyle && hasToken(cl, "style")) return false;
    // Klassik match
    if (hasClassic && !hasToken(cl, "klassik")) return false;
    if (!hasClassic && hasToken(cl, "klassik")) return false;
    // Fashion match
    if (hasFashion && !hasToken(cl, "fashion")) return false;
    if (!hasFashion && hasToken(cl, "fashion")) return false;
    // H2O match
    if (hasH2o && !(hasToken(cl, "h2o") || hasToken(cl, "wasserführend"))) return false;
    if (!hasH2o && (hasToken(cl, "h2o") || hasToken(cl, "h2o"))) return false;
    // Tripod match
    if (hasTripod && !hasToken(cl, "tripod")) return false;
    if (!hasTripod && hasToken(cl, "tripod")) return false;
    // Exclude "mit Holzfach" / "mit Holzlegefach" variants unless the product name mentions them
    if (hasToken(cl, "holzfach") || hasToken(cl, "holzlegefach")) return false;
    return true;
  });

  if (filtered.length === 0) {
    // Relax filter: only keep steel vs non-steel as hard filter
    filtered = candidates.filter((c) => {
      const cl = c.candidate_label.toLowerCase();
      if (hasSteel && !hasToken(cl, "steel")) return false;
      if (!hasSteel && hasToken(cl, "steel")) return false;
      if (hasH2o && !hasToken(cl, "h2o")) return false;
      if (!hasH2o && hasToken(cl, "h2o")) return false;
      if (hasToken(cl, "holzfach") || hasToken(cl, "holzlegefach")) return false;
      return true;
    });
  }

  // Group by RLU
  const isRluLabel = (c) => hasToken(c.candidate_label, "rlu") || hasToken(c.candidate_label, "raumluftunabhängig");
  const rluField = (c) => c.master?.rlu_approved;
  const nonRlu = filtered.filter((c) => !isRluLabel(c) && (rluField(c) === "no" || rluField(c) === "unknown" || rluField(c) === null || rluField(c) === undefined));
  const rlu = filtered.filter((c) => rluField(c) === "pass" || (isRluLabel(c) && (rluField(c) === null || rluField(c) === undefined)));

  const rluSupported = product?.technical?.raw_air_independent === "optional" ||
    product?.technical?.raw_air_independent === "Ja" ||
    product?.technical?.raw_air_independent === true;

  // Pick latest by version
  const sortByVersion = (arr) => [...arr].sort((a, b) => parseVersion(b.candidate_label) - parseVersion(a.candidate_label));
  const bestNonRlu = sortByVersion(nonRlu)[0] || null;
  const bestRlu = sortByVersion(rlu)[0] || null;

  const selected = [];
  if (bestNonRlu) selected.push(bestNonRlu);
  if (bestRlu && rluSupported) selected.push(bestRlu);

  return {
    product_model: productModel,
    product_slug: product?.slug,
    candidates_available: candidates.length,
    candidates_filtered: filtered.length,
    rlu_supported: rluSupported,
    selected: selected.map((c) => ({
      label: c.candidate_label,
      url: c.url,
      power: c.master?.["Nennwärmeleistung [kW]"],
      rlu_approved: rluField(c),
      standard: c.master?.["Norm der Typprüfung"],
      test_year: c.master?.["Prüfjahr"],
      test_report: c.master?.["Nummer des Prüfberichts"],
      ecodesign: c.emissions?.fuels?.holz ? (Object.entries(c.emissions.fuels.holz).find(([k]) => k.includes("2015/1185") || k.includes("Ökodesign"))?.[1]?.rating ?? null) : null,
      bimschv: c.emissions?.fuels?.holz ? (Object.entries(c.emissions.fuels.holz).find(([k]) => k.includes("BImSchV"))?.[1]?.rating ?? null) : null,
    })),
    unselected: filtered
      .filter((c) => !selected.includes(c))
      .map((c) => c.candidate_label),
  };
}

function main() {
  const productsMap = new Map();
  const sparthermProducts = loadJsonl(SPARTHERM_FILE);
  sparthermProducts.forEach((p) => productsMap.set(p.slug, p));

  const details = loadJsonl(DETAILS_FILE);

  const results = [];
  const hkiDevices = [];

  for (const entry of details) {
    const product = productsMap.get(entry.product_slug);
    const resolution = resolveProduct(entry.product_model, product, entry.candidates);

    for (const sel of resolution.selected) {
      const isRlu = sel.rlu_approved === "pass" || (sel.rlu_approved === null && hasToken(sel.label, "rlu"));
      hkiDevices.push({
        slug: `${entry.product_slug}${isRlu ? "-rlu" : ""}`,
        hki_url: sel.url,
        product_slug: entry.product_slug,
        model_label: sel.label,
        nominal_power_kw: parseFloat(String(sel.power ?? "").replace(",", ".")) || null,
        rlu_approved: isRlu,
        standard: sel.standard,
        test_year: sel.test_year ? parseInt(String(sel.test_year).replace(/\D/g, "").slice(0, 4), 10) : null,
        test_report: sel.test_report,
        ecodesign_passed: sel.ecodesign === "pass" || sel.ecodesign === "pass_stufe2",
        bimschv_passed: sel.bimschv === "pass" || sel.bimschv === "pass_stufe1" || sel.bimschv === "pass_stufe2",
        bimschv_stufe: sel.bimschv === "pass_stufe2" ? 2 : sel.bimschv === "pass_stufe1" ? 1 : 0,
      });
    }

    results.push(resolution);
  }

  // Add products with no candidates
  const resolvedSlugs = new Set(details.map((d) => d.product_slug));
  for (const p of sparthermProducts) {
    if (!resolvedSlugs.has(p.slug)) {
      results.push({
        product_model: p.model,
        product_slug: p.slug,
        candidates_available: 0,
        candidates_filtered: 0,
        rlu_supported: p.technical?.raw_air_independent === "optional" || p.technical?.raw_air_independent === "Ja",
        selected: [],
        unselected: [],
        error: `No HKI candidates found. Manual search needed on https://www.cert.hki-online.de/de/geraete/hersteller-liste`,
      });
    }
  }

  const output = {
    generated_at: new Date().toISOString(),
    summary: {
      total_products: sparthermProducts.length,
      resolved: results.filter((r) => r.selected.length > 0).length,
      partial: results.filter((r) => r.candidates_available > 0 && r.selected.length === 0).length,
      no_candidates: results.filter((r) => r.candidates_available === 0).length,
    },
    hki_devices: hkiDevices,
    resolutions: results,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output.summary, null, 2));
  console.log(`\nFull resolution written to ${OUTPUT_FILE}`);
  console.log(`\n=== SELECTED HKI DEVICES ===`);
  for (const dev of hkiDevices) {
    console.log(`${dev.product_slug} → ${dev.model_label} (RLU: ${dev.rlu_approved ? "✓" : "✗"}, Ecodesign: ${dev.ecodesign_passed ? "✓" : "✗"}, BImSchV Stufe ${dev.bimschv_stufe})`);
  }
}

main();

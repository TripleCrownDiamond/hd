#!/usr/bin/env node
/**
 * Take products out of the storefront when their main image cannot identify
 * them: an untitled camera file or generic packaging artwork that several
 * different listings share.
 *
 * Products are marked `review_status = 'rejected'` rather than deleted — the
 * scrape stays auditable and a human can reinstate a product once the supplier
 * provides a real photo. `readRows` in src/lib/products/catalog.ts hides
 * rejected products from every catalogue page.
 *
 * Usage:
 *   node scripts/db/flag-ambiguous-media.mjs --dry-run
 *   node scripts/db/flag-ambiguous-media.mjs
 *   node scripts/db/flag-ambiguous-media.mjs --reset   # back to pending
 */

import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "node:util";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isGenericImage } from "../scrape/_lib/images.mjs";

const { values } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    reset: { type: "boolean", default: false },
    // Commercial floor: below it an order cannot carry its own delivery cost.
    // Products without a public price are unaffected (they are quote-only).
    "min-price-cents": { type: "string", default: "0" },
    // Accessories are add-ons to a main order, not standalone deliveries, so
    // they carry their own lower floor.
    "min-price-cents-accessory": { type: "string" },
    // Withhold products whose page would not let a buyer decide.
    "require-specs": { type: "boolean", default: false },
    "require-dimensions": { type: "boolean", default: false },
    // Print every withheld product of one source with its reason.
    explain: { type: "string" },
  },
});

const REQUIRE_SPECS = values["require-specs"];
const REQUIRE_DIMENSIONS = values["require-dimensions"];

const MIN_PRICE_CENTS = Number.parseInt(values["min-price-cents"], 10) || 0;
const MIN_PRICE_ACCESSORY =
  values["min-price-cents-accessory"] != null
    ? Number.parseInt(values["min-price-cents-accessory"], 10) || 0
    : MIN_PRICE_CENTS;

function floorFor(kind) {
  return kind === "accessory" ? MIN_PRICE_ACCESSORY : MIN_PRICE_CENTS;
}

/**
 * What genuinely blocks a purchase, and nothing more.
 *
 * A missing efficiency figure or wood essence does not stop anyone ordering —
 * the page simply omits that row (the storefront hides unfilled rows rather
 * than printing "Nicht angegeben"). What does block a purchase is not knowing
 * *what* is being sold: solid fuels need a quantity, because the price is
 * meaningless without it.
 *
 * `--require-specs` additionally demands the full declaration, for a stricter
 * catalogue.
 */
function missingEssentials(product, extra) {
  const has = (value) => value != null && value !== "";
  const blocking = [];
  const informative = [];

  switch (product.kind) {
    case "stove":
      informative.push(
        has(product.power_kw_nominal) || has(product.power_kw_max) ? null : "Leistung",
      );
      if (REQUIRE_DIMENSIONS && !(has(product.height_mm) || has(product.width_mm) || has(product.depth_mm))) {
        informative.push("Abmessungen");
      }
      break;
    case "wood":
    case "kindling":
      // Without a quantity the price cannot be compared to anything.
      if (!has(extra.unit_de) && !has(extra.quantity_de)) blocking.push("Menge");
      informative.push(has(extra.wood_type) ? null : "Holzart");
      informative.push(has(extra.moisture_de) ? null : "Restfeuchte");
      break;
    case "briquette":
    case "pellet":
    case "coal":
      if (!has(extra.unit_de) && !has(extra.quantity_de)) blocking.push("Menge");
      informative.push(has(extra.moisture_de) ? null : "Restfeuchte");
      break;
    default:
      break;
  }

  if (supplierFacts(product, extra) === 0) {
    // Nothing but a name, a price and a delivery unit. There is no description
    // to read and no value to compare, so the page cannot inform a buyer at
    // all — a quantity on its own is not a specification.
    blocking.push("Herstellerangaben");
  }

  return REQUIRE_SPECS
    ? [...blocking, ...informative.filter(Boolean)]
    : blocking;
}

/**
 * How much the supplier actually published about this product, beyond its name,
 * price and delivery unit.
 *
 * Counts declared technical values and the supplier's own copy. Our generated
 * sentence is derived from those same values, so it deliberately counts for
 * nothing: it cannot turn an empty listing into an informative one.
 */
function supplierFacts(product, extra) {
  const has = (value) => value != null && value !== "";
  let facts = 0;

  if (has(product.long_description)) facts += 1;
  if (has(extra.long_de_raw)) facts += 1;
  facts += Object.keys(extra.source_specs ?? {}).length;
  facts += (extra.features ?? []).length;

  if (product.kind === "stove") {
    for (const value of [
      product.power_kw_nominal,
      product.power_kw_max,
      product.efficiency_pct,
      product.energy_class,
      product.flue_diameter_mm,
      product.height_mm,
      product.width_mm,
      product.depth_mm,
      product.weight_kg,
    ]) {
      if (has(value)) facts += 1;
    }
  } else {
    for (const value of [
      extra.wood_type,
      extra.moisture_de,
      extra.length_de,
      extra.origin_de,
      extra.norm_de,
      extra.weight_de,
      extra.energy_de,
    ]) {
      if (has(value)) facts += 1;
    }
  }

  return facts;
}

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i.exec(line);
    if (!match) continue;
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

/** The asset a public_id points at, ignoring the ordering prefix. */
function assetName(publicId) {
  return (publicId.split("/").pop() ?? "").replace(/^\d+-/, "").toLowerCase();
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

async function main() {
  const env = loadEnv(resolve(process.cwd(), ".env.local"));
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials in .env.local.");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  if (values.reset) {
    const { error, count } = await supabase
      .from("products")
      .update({ review_status: "pending" }, { count: "exact" })
      .eq("review_status", "rejected");
    if (error) throw new Error(error.message);
    console.log(`Reset ${count ?? 0} products to pending.`);
    return;
  }

  const products = await readAll((from, to) =>
    supabase.from("products").select("id,slug,source,model,kind,review_status,is_published,price_cents_public,extra,long_description,power_kw_nominal,power_kw_max,efficiency_pct,energy_class,flue_diameter_mm,weight_kg,height_mm,width_mm,depth_mm").range(from, to),
  );
  const byId = new Map(products.map((product) => [product.id, product]));

  const media = [];
  for (let index = 0; index < products.length; index += 100) {
    const ids = products.slice(index, index + 100).map((product) => product.id);
    media.push(
      ...(await readAll((from, to) =>
        supabase
          .from("product_media")
          .select("product_id,cloudinary_public_id,position")
          .in("product_id", ids)
          .eq("position", 0)
          .range(from, to),
      )),
    );
  }

  // How many distinct products use each asset as their main image.
  const owners = new Map();
  for (const row of media) {
    const name = assetName(row.cloudinary_public_id);
    owners.set(name, (owners.get(name) ?? 0) + 1);
  }

  const heroByProduct = new Map(media.map((row) => [row.product_id, row.cloudinary_public_id]));
  const ambiguous = [];
  for (const product of products) {
    const price = product.price_cents_public;
    const floor = floorFor(product.kind);
    if (floor > 0 && price != null && price > 0 && price < floor) {
      ambiguous.push({
        ...product,
        reason: `below the ${(floor / 100).toFixed(0)} EUR floor for ${product.kind}`,
      });
      continue;
    }
    const missing = missingEssentials(product, product.extra ?? {});
    if (missing.length > 0) {
      ambiguous.push({ ...product, reason: `missing ${missing.join(", ")}` });
      continue;
    }
    const hero = heroByProduct.get(product.id);
    if (!hero) {
      ambiguous.push({ ...product, reason: "no image" });
      continue;
    }
    const name = assetName(hero);
    if (isGenericImage(name) && (owners.get(name) ?? 0) > 1) {
      ambiguous.push({ ...product, reason: `generic image shared by ${owners.get(name)} products` });
    }
  }

  const bySource = {};
  for (const item of ambiguous) bySource[item.source] = (bySource[item.source] ?? 0) + 1;

  console.log(`${products.length} products, ${ambiguous.length} withheld from the storefront.`);
  console.log(JSON.stringify(bySource, null, 1));
  // A per-reason tally, so a run says *why* a catalogue shrank rather than
  // showing eight arbitrary examples.
  const reasons = {};
  for (const item of ambiguous) {
    const label = item.reason.replace(/\d+/g, "N");
    reasons[label] = (reasons[label] ?? 0) + 1;
  }
  console.log(JSON.stringify(reasons, null, 1));

  if (values.explain) {
    for (const item of ambiguous.filter((x) => x.source === values.explain)) {
      console.log(`  ! ${item.model.slice(0, 60)} (${item.reason})`);
    }
  }

  for (const item of ambiguous.slice(0, 8)) {
    console.log(`  - ${item.source} | ${item.model.slice(0, 44)} (${item.reason})`);
  }

  if (values["dry-run"]) {
    console.log("\nDry run — nothing written.");
    return;
  }

  for (let index = 0; index < ambiguous.length; index += 100) {
    const ids = ambiguous.slice(index, index + 100).map((item) => item.id);
    const { error } = await supabase
      .from("products")
      // `is_published` is half of the public RLS predicate, so it has to follow
      // the review decision — otherwise a rejected product stays readable to
      // anonymous visitors even though the storefront stops linking to it.
      .update({ review_status: "rejected", is_published: false })
      .in("id", ids);
    if (error) throw new Error(error.message);
  }

  // Everything that passed every check is complete enough to stand on its own
  // page, so it is approved rather than left in review. Only approved products
  // are rendered (see readRows in src/lib/products/catalog.ts).
  //
  // The public RLS policy reads `is_published and review_status = 'approved'`,
  // so approving without publishing leaves the catalogue invisible to everyone
  // but the service role: the two flags are set together.
  const ambiguousIds = new Set(ambiguous.map((item) => item.id));
  const reinstate = products
    .filter(
      (product) =>
        !ambiguousIds.has(product.id) &&
        (product.review_status !== "approved" || product.is_published !== true),
    )
    .map((product) => product.id);
  for (let index = 0; index < reinstate.length; index += 100) {
    const { error } = await supabase
      .from("products")
      .update({
        review_status: "approved",
        is_published: true,
        reviewed_at: new Date().toISOString(),
      })
      .in("id", reinstate.slice(index, index + 100));
    if (error) throw new Error(error.message);
  }

  console.log(
    `\nRejected ${ambiguous.length} products, reinstated ${reinstate.length} that now have a usable image.`,
  );
  void byId;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

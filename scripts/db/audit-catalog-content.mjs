#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { rankProductImages } from "../scrape/_lib/images.mjs";

function loadEnv(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i.exec(line))
      .filter(Boolean)
      .map((match) => {
        const raw = match[2];
        const value = ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'")))
          ? raw.slice(1, -1)
          : raw;
        return [match[1], value];
      }),
  );
}

async function readAll(query) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if ((data ?? []).length < 1000) return rows;
  }
}

function descriptionIssues(product) {
  const generated = product.extra?.generated_description;
  if (typeof generated !== "string") {
    return product.description_authorized && product.long_description
      ? []
      : ["missing generated description"];
  }
  const issues = [];
  if (/\*\*|^#{1,6}\s|```/.test(generated)) issues.push("Markdown markers");
  if (/\.\s+wiegt\b/u.test(generated)) issues.push("missing sentence subject");
  if (generated.length > 1400) issues.push("description over 1400 characters");
  if (/Der Kaminofen Kaminofen\b/i.test(generated)) issues.push("duplicated product kind");
  return issues;
}

async function main() {
  const env = loadEnv(resolve(process.cwd(), ".env.local"));
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials in .env.local.");
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const requestedSlug = process.argv.find((argument) => argument.startsWith("--slug="))?.slice(7);
  const withholdIncomplete = process.argv.includes("--withhold-incomplete");

  const products = await readAll((from, to) => {
    let query = supabase
      .from("products")
      .select("id,slug,model,source,kind,review_status,is_published,description_authorized,long_description,extra")
      .order("slug")
      .range(from, to);
    if (requestedSlug) query = query.eq("slug", requestedSlug);
    return query;
  });
  const ids = products.map((product) => product.id);
  const media = [];
  for (let index = 0; index < ids.length; index += 100) {
    const batch = ids.slice(index, index + 100);
    media.push(...await readAll((from, to) => supabase
      .from("product_media")
      .select("product_id,position,source_url,cloudinary_public_id")
      .in("product_id", batch)
      .order("position")
      .range(from, to)));
  }
  const mediaByProduct = new Map();
  for (const item of media) {
    const current = mediaByProduct.get(item.product_id) ?? [];
    current.push(item);
    mediaByProduct.set(item.product_id, current);
  }

  const descriptionAudit = products
    .map((product) => ({ slug: product.slug, reviewStatus: product.review_status, issues: descriptionIssues(product) }))
    .filter((item) => item.issues.length > 0);
  const withoutMedia = products.filter((product) => (mediaByProduct.get(product.id) ?? []).length === 0);
  const heroChanges = products.flatMap((product) => {
    if (product.kind !== "stove") return [];
    const current = mediaByProduct.get(product.id) ?? [];
    const urls = current.map((item) => item.source_url).filter(Boolean);
    if (urls.length < 2) return [];
    const ranked = rankProductImages(urls, product.model, product.source ?? "");
    if (ranked[0] === urls[0]) return [];
    return [{
      slug: product.slug,
      reviewStatus: product.review_status,
      current: urls[0],
      suggested: ranked[0],
    }];
  });
  const issueCounts = new Map();
  for (const item of descriptionAudit) {
    for (const issue of item.issues) issueCounts.set(issue, (issueCounts.get(issue) ?? 0) + 1);
  }
  console.log(`${products.length} products audited; ${descriptionAudit.length} description warnings (${descriptionAudit.filter((item) => item.reviewStatus === "approved").length} approved); ${withoutMedia.length} without media (${withoutMedia.filter((item) => item.review_status === "approved").length} approved).`);
  console.log(`Description warning types: ${JSON.stringify(Object.fromEntries(issueCounts))}`);
  console.log(`${heroChanges.length} stove heroes have a stronger model-specific candidate (${heroChanges.filter((item) => item.reviewStatus === "approved").length} approved).`);
  for (const issue of issueCounts.keys()) {
    for (const item of descriptionAudit.filter((entry) => entry.issues.includes(issue)).slice(0, 10)) {
      console.log(`DESC ${item.slug}: ${issue}`);
    }
  }
  for (const product of withoutMedia.slice(0, 30)) console.log(`MEDIA ${product.slug}: no image`);
  for (const item of heroChanges.slice(0, 30)) console.log(`HERO ${item.slug}: ${item.current} -> ${item.suggested}`);

  if (withholdIncomplete) {
    const ids = products
      .filter((product) => product.review_status === "approved" && descriptionIssues(product).includes("missing generated description"))
      .map((product) => product.id);
    for (let index = 0; index < ids.length; index += 100) {
      const { error } = await supabase.from("products").update({ review_status: "pending", reviewed_at: null }).in("id", ids.slice(index, index + 100));
      if (error) throw new Error(error.message);
    }
    console.log(`Withheld ${ids.length} approved products whose source data cannot support a factual description.`);
  }

  if (requestedSlug) {
    for (const product of products) {
      console.log(`\n${product.slug}`);
      console.log(`generated_description: ${JSON.stringify(product.extra?.generated_description ?? null)}`);
      for (const item of mediaByProduct.get(product.id) ?? []) {
        console.log(`[${item.position}] ${item.source_url ?? "(no source URL)"} -> ${item.cloudinary_public_id}`);
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

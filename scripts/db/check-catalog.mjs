#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i.exec(line))
      .filter(Boolean)
      .map((match) => {
        let value = match[2];
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        return [match[1], value];
      }),
  );
}

const env = loadEnv(resolve(process.cwd(), ".env.local"));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function count(client, table) {
  const { count: value, error } = await client
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`${table}: ${error.message}`);
  return value ?? 0;
}

async function main() {
  const [categories, products, variants, media, documents] = await Promise.all([
    count(supabase, "categories"),
    count(supabase, "products"),
    count(supabase, "product_variants"),
    count(supabase, "product_media"),
    count(supabase, "product_documents"),
  ]);
  const { data: sample, error } = await supabase
    .from("products")
    .select("slug,kind,review_status")
    .order("model")
    .limit(5);
  if (error) throw new Error(`products sample: ${error.message}`);

  const secret = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  let staging = null;
  if (secret) {
    const service = createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const [
      allProducts,
      pendingProducts,
      variants,
      media,
      documents,
      complianceChecks,
    ] =
      await Promise.all([
        count(service, "products"),
        service
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("review_status", "pending")
          .then(({ count: value, error: pendingError }) => {
            if (pendingError) throw pendingError;
            return value ?? 0;
          }),
        count(service, "product_variants"),
        count(service, "product_media"),
        count(service, "product_documents"),
        count(service, "product_compliance_checks"),
      ]);
    staging = {
      allProducts,
      pendingProducts,
      variants,
      media,
      documents,
      complianceChecks,
    };
  }

  console.log(
    JSON.stringify(
      {
        publicRlsView: { categories, products, variants, media, documents },
        staging,
        sample,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

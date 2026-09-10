import "server-only";

import { getMigrationAwarePublicSupabase } from "@/lib/db/server";
import {
  buildMerchantFeedXml,
  toMerchantFeedItem,
  type MerchantFeedItem,
} from "./merchant-feed-xml";
import type { ProductRow } from "@/lib/db/types";

/**
 * Merchant product feed, served both as a public URL that platforms poll and
 * as a download from the admin. The document lists the catalogue the same way
 * the storefront renders it — approved and published — but only the rows an
 * aggregator can actually sell: a price is mandatory, so "Sur devis" products
 * are left out.
 *
 * The XML shape itself lives in `merchant-feed-xml.ts` (pure, unit-tested);
 * everything here is the database work.
 */

export { buildMerchantFeedXml, toMerchantFeedItem, centsToFeedPrice } from "./merchant-feed-xml";
export type { MerchantFeedItem, MerchantFeedOptions } from "./merchant-feed-xml";

const PAGE_SIZE = 1000;
const ID_BATCH_SIZE = 100;

/** The brand names a feed row needs, one map lookup per product. */
async function readBrandNames(): Promise<Map<string, string>> {
  const supabase = getMigrationAwarePublicSupabase();
  const names = new Map<string, string>();
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("brands")
      .select("id,name")
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    for (const row of (data ?? []) as Array<{ id: string; name: string }>) {
      names.set(row.id, row.name);
    }
    if ((data ?? []).length < PAGE_SIZE) break;
  }
  return names;
}

/** Hero image per product, matching the position:0 rule the storefront uses. */
async function readHeroImages(productIds: string[]): Promise<Map<string, string>> {
  const supabase = getMigrationAwarePublicSupabase();
  const heroes = new Map<string, string>();
  for (let index = 0; index < productIds.length; index += ID_BATCH_SIZE) {
    const ids = productIds.slice(index, index + ID_BATCH_SIZE);
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("product_media")
        .select("product_id,cloudinary_public_id,position")
        .in("product_id", ids)
        .eq("kind", "image")
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      const rows = (data ?? []) as Array<{
        product_id: string;
        cloudinary_public_id: string;
        position: number;
      }>;
      for (const row of rows) {
        if (row.position === 0 && !heroes.has(row.product_id)) {
          heroes.set(row.product_id, row.cloudinary_public_id);
        }
      }
      if (rows.length < PAGE_SIZE) break;
    }
  }
  return heroes;
}

function errorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

/**
 * Approved + published + priced products, in the same order the storefront
 * lists them (model, then slug to break ties).
 */
export async function getMerchantFeedProducts(): Promise<ProductRow[]> {
  const supabase = getMigrationAwarePublicSupabase();
  const unitColumns = "quantity_amount,quantity_unit,base_price_unit";
  const baseColumns =
    "id,slug,model,kind,brand_id,subtitle,short_description,price_cents_public,extra,review_status,is_published";
  // The unit columns come from a migration; a database that has not run it
  // answers an unknown column with 42703, so retry without them rather than
  // letting the whole feed fail.
  let columns = `${baseColumns},${unitColumns}`;
  const readPage = (from: number, to: number) =>
    supabase
      .from("products")
      .select(columns)
      .eq("review_status", "approved")
      .eq("is_published", true)
      .not("price_cents_public", "is", null)
      .order("model", { ascending: true })
      .order("slug", { ascending: true })
      .range(from, to);

  const out: ProductRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let { data, error } = await readPage(from, from + PAGE_SIZE - 1);
    if (error && errorCode(error) === "42703" && columns.includes(unitColumns)) {
      columns = baseColumns;
      ({ data, error } = await readPage(from, from + PAGE_SIZE - 1));
    }
    if (error) throw error;
    // `columns` is a string variable, so the typed client widens `data` to its
    // generic string-select shape — cast through `unknown` to ProductRow.
    out.push(...(((data ?? []) as unknown) as ProductRow[]));
    if ((data ?? []).length < PAGE_SIZE) break;
  }
  return out;
}

/**
 * Cheap count for the admin page — same filters as the feed itself, but without
 * fetching a single row, so opening the page does not generate the whole XML.
 */
export async function countMerchantFeedProducts(): Promise<number> {
  const supabase = getMigrationAwarePublicSupabase();
  const { count, error } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("review_status", "approved")
    .eq("is_published", true)
    .not("price_cents_public", "is", null);
  if (error) throw error;
  return count ?? 0;
}

export interface MerchantFeedDocument {
  xml: string;
  items: MerchantFeedItem[];
  generatedAt: string;
}

/** One trip through all four reads, returning the finished document. */
export async function buildMerchantFeed(baseUrl: string): Promise<MerchantFeedDocument> {
  const [products, brandNames] = await Promise.all([
    getMerchantFeedProducts(),
    readBrandNames(),
  ]);
  const heroImages = await readHeroImages(products.map((product) => product.id));
  const items = products
    .map((product) => toMerchantFeedItem(product, brandNames, heroImages, baseUrl))
    .filter((item): item is MerchantFeedItem => item !== null);
  return {
    xml: buildMerchantFeedXml(items, { baseUrl }),
    items,
    generatedAt: new Date().toISOString(),
  };
}
import "server-only";

import { getPublicSupabase, getServiceSupabase } from "@/lib/db/server";
import type {
  BrandRow,
  CategoryRow,
  Json,
  ProductKind,
  ProductMediaRow,
  ProductDocumentRow,
  ProductRow,
  ProductVariantRow,
} from "@/lib/db/types";
import type { ScrapedProduct } from "./scraped";
import { BASE_PRICE_UNIT_LABEL, computeBasePriceCents } from "@/lib/utils";
import { productDescriptionHtml } from "./product-description";

export class CatalogReadError extends Error {
  constructor(operation: string, cause: unknown) {
    super(`Supabase catalog read failed: ${operation}`, { cause });
    this.name = "CatalogReadError";
  }
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
}

export interface StorefrontProduct {
  id: string;
  type: ProductKind;
  name: string;
  slug: string;
  category: string;
  brand?: string;
  description: string;
  priceCents: number;
  basePriceCents?: number;
  basePriceUnit?: string;
  image: string;
  images: string[];
  stock: "in_stock" | "low_stock" | "out_of_stock" | "preorder";
  deliveryTime: string;
  badges: Array<{
    label: string;
    variant: "success" | "info" | "warning" | "accent" | "brand";
  }>;
  rating: number;
  reviewCount: number;
  featured?: boolean;
}

export interface WoodCatalogProduct extends StorefrontProduct {
  type: "wood";
  woodType: string;
  length: string;
  moisture: string;
  unit: string;
  quantity: string;
  origin: string;
  packaging: string;
}

export interface StoveCatalogProduct extends StorefrontProduct {
  type: "stove";
  powerKw: number;
  efficiency: number;
  energyClass: string;
  fuel: string;
  flueDiameter: number;
  connection: string;
  weight: number;
  dimensions: string;
  colors: string[];
}

interface CatalogRows {
  products: ProductRow[];
  brands: BrandRow[];
  variants: ProductVariantRow[];
  media: ProductMediaRow[];
}

function getCatalogReadSupabase() {
  // Local development preview only. Production always uses the public client
  // and therefore remains constrained by RLS.
  return process.env.NODE_ENV === "development"
    ? getServiceSupabase()
    : getPublicSupabase();
}

const PRODUCT_COLUMNS = [
  "id",
  "slug",
  "kind",
  "brand_id",
  "category_id",
  "economic_operator_id",
  "model",
  "subtitle",
  "short_description",
  "long_description",
  "description_authorized",
  "power_kw_min",
  "power_kw_max",
  "power_kw_nominal",
  "efficiency_pct",
  "energy_class",
  "fuel",
  "flue_diameter_mm",
  "connection_position",
  "height_mm",
  "width_mm",
  "depth_mm",
  "weight_kg",
  "co_mg_nm3",
  "ogc_mg_nm3",
  "particulates_mg_nm3",
  "raw_air_independent",
  "extra",
  "price_cents_public",
  "quote_mode",
  "ecodesign_2022",
  "bimschv_stufe",
  "compliance_verified_at",
  "source",
  "source_url",
  "source_scraped_at",
  "is_published",
  "is_featured",
  "review_status",
  "reviewed_at",
  "reviewed_by",
  "created_at",
  "updated_at",
].join(",");

/**
 * Added by `20260809000012_product_sales_unit.sql`. Requested separately so the
 * storefront keeps serving against a database that has not run the migration
 * yet: PostgREST answers an unknown column with 42703, and the read drops back
 * to the columns that do exist. The flag flips back on nothing — a process
 * restart after the migration is enough, and that is what a deploy does.
 */
const PRICING_UNIT_COLUMNS = "quantity_amount,quantity_unit,base_price_unit";
const PRODUCT_COLUMNS_WITH_UNITS = `${PRODUCT_COLUMNS},${PRICING_UNIT_COLUMNS}`;
let pricingUnitColumnsAvailable = true;

function errorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

/** PostgREST surfaces an unknown column as SQLSTATE 42703. */
function isUndefinedColumn(error: unknown): boolean {
  return errorCode(error) === "42703";
}

/**
 * 22P02 on a `kind` filter means the enum has no such label — the database is
 * behind on a migration that adds one. A kind the catalogue cannot name has no
 * products by definition, so the listing renders empty instead of erroring.
 */
function isUnknownEnumLabel(error: unknown): boolean {
  return errorCode(error) === "22P02";
}

/**
 * PostgREST caps a response at 1 000 rows. A catalogue of several hundred
 * products has more media and variant rows than that, so page until exhausted
 * rather than silently rendering a truncated gallery.
 */
const PAGE_SIZE = 1000;

/**
 * Reading a full catalogue takes many round-trips; a dropped one is retryable.
 * Next's dev server aborts in-flight fetches while it recompiles, so the first
 * retries need to outlast a compile rather than fire immediately.
 */
const MAX_ATTEMPTS = 4;
const RETRY_BASE_MS = 400;

async function readAllRows<T>(
  operation: string,
  page: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let lastError: unknown;
    let batch: T[] | null = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS && batch === null; attempt++) {
      const { data, error } = await page(from, from + PAGE_SIZE - 1);
      if (error) {
        lastError = error;
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_BASE_MS * 2 ** (attempt - 1)));
        }
        continue;
      }
      batch = (data ?? []) as T[];
    }
    if (batch === null) throw new CatalogReadError(operation, lastError);
    out.push(...batch);
    if (batch.length < PAGE_SIZE) return out;
  }
}

/**
 * A `product_id=in.(…)` filter over several hundred UUIDs overflows the request
 * URI, so query in id batches and page each batch.
 */
const ID_BATCH_SIZE = 100;

async function readByProductIds<T>(
  operation: string,
  productIds: string[],
  page: (
    ids: string[],
    from: number,
    to: number,
  ) => PromiseLike<{ data: unknown; error: unknown }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let index = 0; index < productIds.length; index += ID_BATCH_SIZE) {
    const ids = productIds.slice(index, index + ID_BATCH_SIZE);
    out.push(...(await readAllRows<T>(operation, (from, to) => page(ids, from, to))));
  }
  return out;
}

async function readRows(filters?: {
  kind?: ProductKind;
  slug?: string;
  /**
   * Listing pages only render the main image. Fetching the whole gallery for a
   * thousand products meant thousands of rows and a page that never finished.
   */
  heroOnly?: boolean;
}): Promise<CatalogRows> {
  const supabase = getCatalogReadSupabase();
  const selectProducts = (columns: string, from: number, to: number) => {
    let query = supabase
      .from("products")
      .select(columns)
      // Only approved products are rendered: a listing whose declaration is
      // incomplete cannot let a visitor decide, so it must not be shown at all.
      .eq("review_status", "approved")
      .order("model", { ascending: true })
      .order("slug", { ascending: true })
      .range(from, to);
    if (filters?.kind) query = query.eq("kind", filters.kind);
    if (filters?.slug) query = query.eq("slug", filters.slug);
    return query;
  };
  const productsPage = async (from: number, to: number) => {
    let result;
    if (pricingUnitColumnsAvailable) {
      result = await selectProducts(PRODUCT_COLUMNS_WITH_UNITS, from, to);
      if (isUndefinedColumn(result.error)) {
        pricingUnitColumnsAvailable = false;
        result = await selectProducts(PRODUCT_COLUMNS, from, to);
      }
    } else {
      result = await selectProducts(PRODUCT_COLUMNS, from, to);
    }
    if (filters?.kind && isUnknownEnumLabel(result.error)) {
      return { data: [], error: null };
    }
    return result;
  };

  const [products, brands] = await Promise.all([
    readAllRows<ProductRow>("products", productsPage),
    readAllRows<BrandRow>("brands", (from, to) =>
      supabase.from("brands").select("*").order("slug", { ascending: true }).range(from, to),
    ),
  ]);

  const productIds = products.map((product) => product.id);
  if (productIds.length === 0) {
    return { products, brands, variants: [], media: [] };
  }

  // Listing a whole kind means every approved product of that kind, so the
  // relation can be filtered server-side through the join instead of naming
  // 1 300 ids in batches of 100 — two round trips rather than twenty-eight.
  const wholeKind = Boolean(filters?.kind) && !filters?.slug;

  const [variants, media] = await Promise.all([
    wholeKind
      ? readAllRows<ProductVariantRow>("product variants", (from, to) =>
          supabase
            .from("product_variants")
            .select("*, products!inner()")
            .eq("products.kind", filters!.kind!)
            .eq("products.review_status", "approved")
            .eq("is_active", true)
            .order("product_id", { ascending: true })
            .order("position", { ascending: true })
            .range(from, to),
        )
      : readByProductIds<ProductVariantRow>("product variants", productIds, (ids, from, to) =>
          supabase
            .from("product_variants")
            .select("*")
            .in("product_id", ids)
            .eq("is_active", true)
            .order("product_id", { ascending: true })
            .order("position", { ascending: true })
            .range(from, to),
        ),
    wholeKind
      ? readAllRows<ProductMediaRow>("product media", (from, to) => {
          let query = supabase
            .from("product_media")
            .select("*, products!inner()")
            .eq("products.kind", filters!.kind!)
            .eq("products.review_status", "approved")
            .order("product_id", { ascending: true })
            .order("position", { ascending: true })
            .range(from, to);
          if (filters?.heroOnly) query = query.eq("position", 0);
          return query;
        })
      : readByProductIds<ProductMediaRow>("product media", productIds, (ids, from, to) => {
          let query = supabase
            .from("product_media")
            .select("*")
            .in("product_id", ids)
            .order("product_id", { ascending: true })
            .order("position", { ascending: true })
            .range(from, to);
          if (filters?.heroOnly) query = query.eq("position", 0);
          return query;
        }),
  ]);

  return { products, brands, variants, media };
}

/**
 * Products that state a price come first everywhere in the storefront: they are
 * the ones a visitor can actually evaluate. Model order is kept within each
 * group so the listing stays stable and predictable.
 */
function pricedFirst(a: { priceCents: number | null }, b: { priceCents: number | null }): number {
  const aHas = a.priceCents != null && a.priceCents > 0;
  const bHas = b.priceCents != null && b.priceCents > 0;
  return Number(bHas) - Number(aHas);
}

/**
 * How long a catalogue read stays warm. The data only changes when an import
 * script or an admin action runs, and both invalidate explicitly.
 */
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  expiresAt: number;
  value: Promise<unknown>;
}

const catalogCache = new Map<string, CacheEntry>();

/**
 * Keep a catalogue read in the worker's own memory.
 *
 * `unstable_cache` refused this data outright: the stove catalogue serialises
 * to 4.2 MB and Next's data cache rejects anything over 2 MB. Nothing was ever
 * stored, so every request re-read the whole catalogue from Supabase — 30 to
 * 90 s per page — and threw an unhandled rejection on the way out. An
 * in-process map has no size limit and skips serialisation entirely.
 */
function cachedRead<A extends string, T>(
  prefix: string,
  load: (argument: A) => Promise<T>,
): (argument: A) => Promise<T> {
  return (argument: A) => {
    const key = `${prefix}:${argument}`;
    const hit = catalogCache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.value as Promise<T>;

    // Caching the promise, not the result, collapses the concurrent requests
    // that arrive while the first read is still in flight.
    const value = load(argument).catch((error: unknown) => {
      // A failed read must not be served for the next five minutes.
      catalogCache.delete(key);
      throw error;
    });
    catalogCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
    return value;
  };
}

/** Called after an admin action so the storefront picks the change up at once. */
export function invalidateCatalogCache(): void {
  catalogCache.clear();
}

const getCachedPublishedStoves = cachedRead("stoves", async (): Promise<ScrapedProduct[]> => {
  const rows = await readRows({ kind: "stove", heroOnly: true });
  return rows.products
    .map((product) => toStove(product, rows))
    .sort((a, b) =>
      pricedFirst(
        { priceCents: a.pricing.price_cents_public },
        { priceCents: b.pricing.price_cents_public },
      ),
    );
});

export async function getPublishedStoves(): Promise<ScrapedProduct[]> {
  return getCachedPublishedStoves("");
}

export async function getPublishedStoveBySlug(slug: string): Promise<ScrapedProduct | null> {
  const rows = await readRows({ kind: "stove", slug });
  const product = rows.products[0];
  if (!product) return null;

  const supabase = getCatalogReadSupabase();
  const { data, error } = await supabase
    .from("product_documents")
    .select("*")
    .eq("product_id", product.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new CatalogReadError("product documents", error);
  }

  const documentRows = data as ProductDocumentRow[];
  const signedDocuments = await Promise.all(
    documentRows.map(async (document) => {
      const { data: signed, error: signedError } = await supabase.storage
        .from("documents")
        .createSignedUrl(document.storage_path, 3600, {
          download: `${document.title}.pdf`,
        });

      if (signedError) {
        throw new CatalogReadError(`signed document ${document.id}`, signedError);
      }

      return {
        id: document.id,
        kind: document.kind,
        title: document.title,
        download_url: signed.signedUrl,
      };
    }),
  );

  return { ...toStove(product, rows), documents: signedDocuments };
}

const getCachedPublishedCategories = cachedRead("categories", async (): Promise<CatalogCategory[]> => {
  const supabase = getCatalogReadSupabase();
  const [categories, productCategories] = await Promise.all([
    readAllRows<CategoryRow>("categories", (from, to) =>
      supabase.from("categories").select("*").order("position", { ascending: true }).range(from, to),
    ),
    // Counts must match what the category pages actually render.
    readAllRows<Pick<ProductRow, "category_id">>("category product counts", (from, to) =>
      supabase
        .from("products")
        .select("category_id")
        .eq("review_status", "approved")
        .order("id", { ascending: true })
        .range(from, to),
    ),
  ]);

  const counts = new Map<string, number>();
  for (const product of productCategories) {
    if (product.category_id) {
      counts.set(product.category_id, (counts.get(product.category_id) ?? 0) + 1);
    }
  }

  return categories.map((category: CategoryRow) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.short_description ?? "",
    image: category.hero_cloudinary_id ?? "",
    productCount: counts.get(category.id) ?? 0,
  }));
});

export async function getPublishedCategories(): Promise<CatalogCategory[]> {
  return getCachedPublishedCategories("");
}

/** Kinds rendered with the wood card (declared essence, length, moisture, unit). */
export type FuelKind = "wood" | "log" | "kindling" | "briquette" | "pellet" | "coal";

const getCachedPublishedCardProducts = cachedRead(
  "cards",
  async (
    kind: FuelKind | "accessory",
  ): Promise<Array<WoodCatalogProduct | StorefrontProduct>> => {
    const rows = await readRows({ kind, heroOnly: true });
    return rows.products
      .map((product) =>
        kind === "accessory" ? toStorefrontProduct(product, rows) : toWoodProduct(product, rows),
      )
      .sort(pricedFirst);
  },
);

export async function getPublishedCardProducts(
  kind: FuelKind | "accessory",
): Promise<Array<WoodCatalogProduct | StorefrontProduct>> {
  return getCachedPublishedCardProducts(kind);
}

const getCachedFuelProducts = cachedRead("fuel", async (kind: FuelKind): Promise<WoodCatalogProduct[]> => {
  const rows = await readRows({ kind, heroOnly: true });
  return rows.products.map((product) => toWoodProduct(product, rows)).sort(pricedFirst);
});

export async function getFuelProducts(kind: FuelKind): Promise<WoodCatalogProduct[]> {
  return getCachedFuelProducts(kind);
}

export interface WoodProductDetail extends WoodCatalogProduct {
  longDescription: string | null;
  sourceUrl: string | null;
  reviewStatus: string;
  pricePerUnitCents?: number;
  pricePerUnit?: string;
  /** The retailer's own spec table — accessories have no wood declaration. */
  sourceSpecs: Array<[string, string]>;
  categoryLabel?: string;
}

export async function getWoodProductBySlug(slug: string): Promise<WoodProductDetail | null> {
  // Every non-stove product shares this detail route.
  // Reuse the paged, retrying catalogue reader. Detail pages previously used
  // one-shot media/brand queries, so a transient Supabase failure crashed the
  // complete route while listing pages recovered normally.
  const rows = await readRows({ slug });
  const product = rows.products[0];
  const supportedKinds = new Set<ProductKind>([
    "wood",
    "kindling",
    "briquette",
    "pellet",
    "coal",
    "accessory",
  ]);
  if (!product || !supportedKinds.has(product.kind)) return null;
  const extra = asRecord(product.extra);

  return {
    ...toWoodProduct(product, rows),
    longDescription: product.description_authorized
      ? product.long_description
      : (readString(asRecord(product.extra).generated_description) ?? null),
    sourceUrl: product.source_url,
    reviewStatus: product.review_status,
    pricePerUnitCents: readNumber(extra.price_per_unit_cents),
    pricePerUnit: readString(extra.price_per_unit),
    sourceSpecs: Object.entries(asRecord((extra.source_specs ?? null) as Json))
      .filter(([, value]) => typeof value === "string" || typeof value === "number")
      // Scrapers lift a few values out under internal snake_case names
      // (norm_de, weight_kg). Those are already rendered elsewhere and would
      // otherwise appear as row labels.
      .filter(([key]) => !/^[a-z0-9]+(_[a-z0-9]+)+$/.test(key))
      .map(([key, value]) => [key, String(value)] as [string, string]),
    categoryLabel: readString(extra.category_de),
  };
}

function toStove(product: ProductRow, rows: CatalogRows): ScrapedProduct {
  const brand = rows.brands.find((item) => item.id === product.brand_id);
  const variants = rows.variants.filter((item) => item.product_id === product.id);
  const media = rows.media.filter((item) => item.product_id === product.id);
  const gallery = media
    .filter((item) => item.kind === "image")
    .map((item) => ({ public_id: item.cloudinary_public_id, source_url: item.source_url ?? "" }));

  return {
    source: product.source ?? "supabase",
    source_url: product.source_url ?? "",
    scraped_at: product.source_scraped_at,
    slug: product.slug,
    brand: brand?.name ?? "",
    model: product.model,
    category_source_label: "Kaminöfen",
    descriptions: {
      subtitle_de: product.subtitle,
      short_de: product.short_description,
      // The manufacturer's own copy may only be shown when authorised; the
      // generated factual text stands in everywhere else.
      long_de_raw: productDescriptionHtml(
        product.description_authorized
          ? product.long_description
          : readString(asRecord(product.extra).generated_description),
      ),
      long_de_authorized: product.description_authorized,
    },
    technical: {
      power_kw_min: product.power_kw_min,
      power_kw_max: product.power_kw_max,
      power_kw_nominal: product.power_kw_nominal,
      efficiency_pct: product.efficiency_pct,
      energy_class: product.energy_class,
      fuel: product.fuel,
      flue_diameter_mm: product.flue_diameter_mm,
      connection: product.connection_position,
      dimensions_mm: {
        height: product.height_mm,
        width: product.width_mm,
        depth: product.depth_mm,
      },
      weight_kg: product.weight_kg,
      raw_air_independent: product.raw_air_independent,
      extra: publicExtra(product.extra),
    },
    variants: variants.map((variant) => ({
      axis: variant.axis,
      code: variant.code,
      label_de: variant.label,
      swatch_url_source: null,
      main_image_url_source: null,
      video_url_source: null,
      surcharge_cents: variant.surcharge_cents,
    })),
    media: {
      hero_image_url_source: null,
      gallery_url_sources: [],
      video_url_sources: [],
      energy_label_url_source: null,
    },
    media_cloudinary: {
      hero: gallery[0]?.public_id ?? null,
      variants: variants.map((variant) => ({
        code: variant.code,
        main: variant.main_image_cloudinary_id,
        swatch: variant.swatch_cloudinary_id,
      })),
      gallery,
    },
    pricing: {
      price_cents_public: product.price_cents_public,
      quote_mode: product.quote_mode,
    },
    documents: [],
    review_status: product.review_status,
  };
}

function toStorefrontProduct(product: ProductRow, rows: CatalogRows): StorefrontProduct {
  const brand = rows.brands.find((item) => item.id === product.brand_id);
  const media = rows.media.filter(
    (item) => item.product_id === product.id && item.kind === "image",
  );
  const extra = asRecord(product.extra);
  const stock = readStock(extra.stock);

  return {
    id: product.id,
    type: product.kind,
    name: product.model,
    slug: product.slug,
    category: "",
    brand: brand?.name,
    description: product.short_description ?? "",
    priceCents: product.price_cents_public ?? 0,
    // Derived, never stored: a Grundpreis that lived in its own column could
    // drift away from the price it is supposed to describe.
    basePriceCents:
      computeBasePriceCents(
        product.price_cents_public ?? 0,
        product.quantity_amount,
        product.quantity_unit,
        product.base_price_unit,
      ) ?? undefined,
    basePriceUnit: product.base_price_unit
      ? BASE_PRICE_UNIT_LABEL[product.base_price_unit]
      : undefined,
    image: media[0]?.cloudinary_public_id ?? "",
    images: media.map((item) => item.cloudinary_public_id),
    stock,
    deliveryTime: readString(extra.delivery_time_de) ?? "Lieferzeit wird geprüft",
    badges: [],
    rating: 0,
    reviewCount: 0,
    featured: product.is_featured,
  };
}

function toWoodProduct(product: ProductRow, rows: CatalogRows): WoodCatalogProduct {
  const base = toStorefrontProduct(product, rows);
  const extra = asRecord(product.extra);
  return {
    ...base,
    type: "wood",
    woodType: readString(extra.wood_type) ?? "Nicht angegeben",
    length: readString(extra.length_de) ?? "Nicht angegeben",
    moisture: readString(extra.moisture_de) ?? "Nicht angegeben",
    unit: readString(extra.unit_de) ?? "Nicht angegeben",
    quantity: readString(extra.quantity_de) ?? "Nicht angegeben",
    origin: readString(extra.origin_de) ?? "Nicht angegeben",
    packaging: readString(extra.packaging_de) ?? "Nicht angegeben",
  };
}

/** Import bookkeeping that must not reach the browser. */
const INTERNAL_EXTRA_KEYS = new Set([
  "source_image_urls",
  "source_documents",
  "supplier_contacts_excluded",
  "certifications_seen",
  "feature_labels",
  "price_cents_min",
  "price_cents_max",
  "variation_axes",
  "generated_description",
]);

/**
 * The manufacturer's own spec table, flattened out of `extra`. Sending the raw
 * column would ship supplier image and document URLs to every visitor and let
 * internal keys surface in the spec list.
 */
function publicExtra(value: Json): Record<string, unknown> {
  const record = asRecord(value);
  const specs = asRecord((record.technical_specs ?? null) as Json);
  const out: Record<string, unknown> = { ...specs };
  for (const [key, entry] of Object.entries(record)) {
    if (key === "technical_specs" || INTERNAL_EXTRA_KEYS.has(key)) continue;
    if (out[key] === undefined) out[key] = entry;
  }
  return out;
}

function asRecord(value: Json): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readStock(value: unknown): StorefrontProduct["stock"] {
  return value === "in_stock" ||
    value === "low_stock" ||
    value === "out_of_stock" ||
    value === "preorder"
    ? value
    : "out_of_stock";
}

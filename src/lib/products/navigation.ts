import "server-only";

import { unstable_cache } from "next/cache";
import { getPublicSupabase, getServiceSupabase } from "@/lib/db/server";
import type { ProductRow, BrandRow, ProductMediaRow } from "@/lib/db/types";

/**
 * Data behind the header mega menu.
 *
 * Everything here is counted from the catalogue itself — no hand-maintained
 * lists — so the menu can never advertise a facet that returns nothing.
 */

export interface MegaMenuLink {
  label: string;
  href: string;
  count: number;
}

export interface MegaMenuColumn {
  title: string;
  links: MegaMenuLink[];
}

export interface MegaMenuTeaser {
  name: string;
  brand: string | null;
  href: string;
  image: string | null;
  priceCents: number | null;
}

export interface MegaMenuSection {
  label: string;
  href: string;
  count: number;
  columns: MegaMenuColumn[];
  teasers: MegaMenuTeaser[];
}

type Kind =
  | "stove"
  | "wood"
  | "log"
  | "kindling"
  | "briquette"
  | "pellet"
  | "coal"
  | "accessory";

const CATEGORY_ROUTE: Record<Kind, string> = {
  stove: "/kaminoefen",
  wood: "/brennholz",
  log: "/stammholz",
  kindling: "/anzuendholz",
  briquette: "/holzbriketts",
  pellet: "/holzpellets",
  coal: "/kohle",
  accessory: "/zubehoer",
};

function getSupabase() {
  return process.env.NODE_ENV === "development" ? getServiceSupabase() : getPublicSupabase();
}

type NavProduct = Pick<
  ProductRow,
  "id" | "slug" | "kind" | "model" | "brand_id" | "price_cents_public" | "extra" | "power_kw_nominal"
>;

/** Count values and keep the busiest ones, so a facet is never empty. */
function topFacets(
  products: NavProduct[],
  pick: (product: NavProduct) => string | null,
  buildHref: (value: string) => string,
  limit: number,
): MegaMenuLink[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    const value = pick(product);
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "de-DE"))
    .slice(0, limit)
    .map(([label, count]) => ({ label, href: buildHref(label), count }));
}

function extraString(product: NavProduct, key: string): string | null {
  const extra = product.extra;
  if (!extra || typeof extra !== "object" || Array.isArray(extra)) return null;
  const value = (extra as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value : null;
}

/**
 * The menu is identical on every page, so it is cached rather than re-queried
 * on each request — the layout runs for every navigation and the catalogue
 * changes only when an import runs.
 */
export const getMegaMenu = unstable_cache(buildMegaMenu, ["mega-menu"], {
  revalidate: 300,
  tags: ["catalog"],
});

async function buildMegaMenu(): Promise<MegaMenuSection[]> {
  const supabase = getSupabase();

  const [productsResult, brandsResult] = await Promise.all([
    supabase
      .from("products")
      .select("id,slug,kind,model,brand_id,price_cents_public,extra,power_kw_nominal")
      .eq("review_status", "approved")
      .eq("is_published", true)
      .order("model", { ascending: true })
      .range(0, 1999),
    supabase.from("brands").select("*"),
  ]);

  // The menu must never take the page down: an unavailable catalogue simply
  // renders the plain category links.
  if (productsResult.error || brandsResult.error) return fallbackSections();

  const products = (productsResult.data ?? []) as NavProduct[];
  const brandName = new Map(
    ((brandsResult.data ?? []) as BrandRow[]).map((brand) => [brand.id, brand.name]),
  );

  const byKind = new Map<Kind, NavProduct[]>();
  for (const product of products) {
    const kind = product.kind as Kind;
    if (!CATEGORY_ROUTE[kind]) continue;
    const bucket = byKind.get(kind) ?? [];
    bucket.push(product);
    byKind.set(kind, bucket);
  }

  // Pick the top 2 priced products per kind for menu teasers
  const showcase = (bucket: NavProduct[]) =>
    [...bucket]
      .sort((a, b) => {
        const priced = Number(b.price_cents_public != null) - Number(a.price_cents_public != null);
        return priced || a.model.localeCompare(b.model, "de-DE");
      })
      .slice(0, 2);

  const teaserIds = new Set<string>();
  for (const [, bucket] of byKind) {
    for (const product of showcase(bucket)) teaserIds.add(product.id);
  }
  const heroByProduct = await readHeroImages([...teaserIds], supabase);

  const teasersFor = (bucket: NavProduct[]): MegaMenuTeaser[] =>
    showcase(bucket)
      .map((product) => ({
        name: product.model,
        brand: product.brand_id ? (brandName.get(product.brand_id) ?? null) : null,
        href:
          product.kind === "stove" ? `/kaminofen/${product.slug}` : `/produkt/${product.slug}`,
        image: heroByProduct.get(product.id) ?? null,
        priceCents: product.price_cents_public,
      }));

  const stoves = byKind.get("stove") ?? [];
  const wood = byKind.get("wood") ?? [];
  const heatingCount = stoves.length + wood.length;

  const fuelKinds: Array<{ kind: Kind; label: string }> = [
    { kind: "log", label: "Stammholz" },
    { kind: "kindling", label: "Anzündholz" },
    { kind: "briquette", label: "Holzbriketts" },
    { kind: "pellet", label: "Holzpellets" },
    { kind: "coal", label: "Kohle" },
  ];

  const fuelSections = fuelKinds
    .map(({ kind, label }) => ({ kind, label, items: byKind.get(kind) ?? [] }))
    .filter((entry) => entry.items.length > 0);

  const accessories = byKind.get("accessory") ?? [];

  const sections: MegaMenuSection[] = [];

  /* ── 1. Heizen — Kaminöfen + Brennholz ────────────────────────────── */
  if (heatingCount > 0) {
    sections.push({
      label: "Heizen",
      href: "/brennholz",
      count: heatingCount,
      columns: [
        {
          title: "Kaminöfen",
          links: [
            { label: "Alle Kaminöfen", href: "/kaminoefen", count: stoves.length },
            ...topFacets(
              stoves,
              (p) => (p.brand_id ? (brandName.get(p.brand_id) ?? null) : null),
              (v) => `/kaminoefen?marke=${encodeURIComponent(v)}`,
              4,
            ),
          ],
        },
        {
          title: "Brennholz",
          links: [
            { label: "Alle Brennholz", href: "/brennholz", count: wood.length },
            ...topFacets(
              wood,
              (p) => extraString(p, "wood_type"),
              (v) => `/brennholz?holzart=${encodeURIComponent(v)}`,
              4,
            ),
          ],
        },
      ],
      teasers: teasersFor(stoves),
    });
  }

  /* ── 2. Brennstoffe — Pellets, Briketts, Kohle … ──────────────────── */
  if (fuelSections.length > 0) {
    sections.push({
      label: "Brennstoffe",
      href: CATEGORY_ROUTE[fuelSections[0]!.kind],
      count: fuelSections.reduce((s, e) => s + e.items.length, 0),
      columns: [
        {
          title: "Sortiment",
          links: fuelSections.map((e) => ({
            label: e.label,
            href: CATEGORY_ROUTE[e.kind],
            count: e.items.length,
          })),
        },
      ],
      teasers: teasersFor(wood),
    });
  }

  /* ── 3. Zubehör — standalone link ──────────────────────────────────── */
  if (accessories.length > 0) {
    sections.push({
      label: "Zubehör",
      href: "/zubehoer",
      count: accessories.length,
      columns: [],
      teasers: [],
    });
  }

  return sections.some((section) => section.count > 0) ? sections : fallbackSections();
}

function powerBand(kw: number | null): string | null {
  if (kw == null) return null;
  if (kw < 6) return "bis 6 kW";
  if (kw < 8) return "6 – 8 kW";
  if (kw < 10) return "8 – 10 kW";
  return "ab 10 kW";
}


async function readHeroImages(
  productIds: string[],
  supabase: ReturnType<typeof getSupabase>,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (productIds.length === 0) return out;
  const { data, error } = await supabase
    .from("product_media")
    .select("product_id,cloudinary_public_id,position")
    .in("product_id", productIds)
    .eq("position", 0);
  if (error) return out;
  for (const row of (data ?? []) as ProductMediaRow[]) {
    if (!out.has(row.product_id)) out.set(row.product_id, row.cloudinary_public_id);
  }
  return out;
}

/** Category links only — used when the catalogue cannot be read. */
function fallbackSections(): MegaMenuSection[] {
  return [
    {
      label: "Sortiment",
      href: "/brennholz",
      count: 0,
      columns: [
        {
          title: "Kategorien",
          links: [
            { label: "Brennholz", href: "/brennholz", count: 0 },
            { label: "Stammholz & Meterholz", href: "/stammholz", count: 0 },
            { label: "Kaminöfen", href: "/kaminoefen", count: 0 },
            { label: "Anzündholz", href: "/anzuendholz", count: 0 },
            { label: "Holzbriketts", href: "/holzbriketts", count: 0 },
            { label: "Holzpellets", href: "/holzpellets", count: 0 },
            { label: "Kohle & Grillkohle", href: "/kohle", count: 0 },
            { label: "Zubehör", href: "/zubehoer", count: 0 },
          ],
        },
      ],
      teasers: [],
    },
  ];
}

import { media } from "@/lib/media";
import { BRAND_NAME } from "@/lib/brand";
import { siteUrl } from "@/lib/site-url";
import { BASE_PRICE_UNIT_LABEL, computeBasePriceCents, formatBasePrice } from "@/lib/utils";
import type { ProductRow } from "@/lib/db/types";

/**
 * Pure feed building — no database, no `next/headers`, so it is covered by
 * `merchant-feed-xml.test.ts` with plain objects. The DB reads live in
 * `merchant-feed.ts`, which pulls these functions back in.
 *
 * The shape is RSS 2.0 with the Google Shopping namespace, accepted by most
 * price-comparison and marketplace platforms. Units and Grundpreis are the
 * fact such a feed must not drop: a pallet price next to "990 kg" means
 * nothing without the per-tonne reference, so both are folded into the
 * description when present.
 */

export interface MerchantFeedItem {
  id: string;
  title: string;
  description: string;
  link: string;
  imageLink: string | null;
  availability: "in stock" | "available for order" | "out of stock" | "preorder" | "backorder";
  price: string;
  brand: string;
  productType: string;
}

export interface MerchantFeedOptions {
  baseUrl: string;
  title?: string;
  description?: string;
}

export const KIND_LABEL: Record<string, string> = {
  stove: "Kaminöfen",
  wood: "Brennholz",
  log: "Stammholz & Meterholz",
  kindling: "Anzündholz",
  pellet: "Holzpellets",
  briquette: "Holzbriketts",
  coal: "Kohle",
  accessory: "Zubehör",
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Collapses whitespace so a multi-line description stays one clean line. */
function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Only the fields a platform accepts; anything else would trip data quality. */
const AVAILABILITY: Record<string, MerchantFeedItem["availability"]> = {
  in_stock: "in stock",
  low_stock: "in stock",
  preorder: "preorder",
  out_of_stock: "out of stock",
};

function availabilityFor(stock: unknown): MerchantFeedItem["availability"] {
  return AVAILABILITY[String(stock)] ?? "out of stock";
}

/** Price in the format aggregators expect: `799.95`, decimal point. */
export function centsToFeedPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

function readExtra(extra: unknown, key: string): unknown {
  if (extra && typeof extra === "object" && !Array.isArray(extra)) {
    return (extra as Record<string, unknown>)[key];
  }
  return undefined;
}

/**
 * Pure mapping from catalogue rows to feed items. Kept separate from the fetch
 * so the XML shape can be asserted without a database.
 */
export function toMerchantFeedItem(
  product: ProductRow,
  brandNames: Map<string, string>,
  heroImages: Map<string, string>,
  baseUrl: string,
): MerchantFeedItem | null {
  if (product.review_status !== "approved" || !product.is_published) return null;
  if (product.price_cents_public == null || product.price_cents_public <= 0) return null;

  const descriptionBits = [
    collapseWhitespace(
      product.short_description ?? product.subtitle ?? product.model ?? "",
    ),
  ];
  if (product.quantity_amount != null && product.quantity_unit != null) {
    const basePriceCents = computeBasePriceCents(
      product.price_cents_public,
      product.quantity_amount,
      product.quantity_unit,
      product.base_price_unit,
    );
    descriptionBits.push(
      `Inhalt je Einheit: ${product.quantity_amount} ${product.quantity_unit}`,
    );
    if (basePriceCents != null && product.base_price_unit != null) {
      descriptionBits.push(
        `Grundpreis: ${formatBasePrice(
          basePriceCents,
          BASE_PRICE_UNIT_LABEL[product.base_price_unit],
        )}`,
      );
    }
  }

  const imageRef = heroImages.get(product.id);
  const imageUrl = imageRef ? media(imageRef, { width: 1024, height: 1024, crop: "fill" }) : null;

  const slugPath =
    product.kind === "stove"
      ? `/kaminofen/${product.slug}`
      : `/produkt/${product.slug}`;

  return {
    id: product.id,
    title: product.model,
    description: descriptionBits.filter(Boolean).join(" · "),
    link: `${baseUrl.replace(/\/+$/, "")}${slugPath}`,
    imageLink: imageUrl ? (imageUrl.startsWith("/") ? siteUrl(imageUrl) : imageUrl) : null,
    availability: availabilityFor(readExtra(product.extra, "stock")),
    price: `${centsToFeedPrice(product.price_cents_public)} EUR`,
    brand: brandNames.get(product.brand_id ?? "") ?? BRAND_NAME,
    productType: KIND_LABEL[product.kind] ?? product.kind,
  };
}

/**
 * Serialise feed items into the RSS 2.0 merchant document.
 *
 * `image_link` is written only when present — the field is optional and an
 * empty element would still be accepted, but omitting it is cleaner.
 */
export function buildMerchantFeedXml(
  items: MerchantFeedItem[],
  options: MerchantFeedOptions,
): string {
  const channelTitle = options.title ?? `${BRAND_NAME} – Produkte`;
  const itemXml = items
    .map((item) => {
      const lines = [
        `    <item>`,
        `      <g:id>${escapeXml(item.id)}</g:id>`,
        `      <g:title>${escapeXml(item.title)}</g:title>`,
        `      <g:description>${escapeXml(item.description)}</g:description>`,
        `      <g:link>${escapeXml(item.link)}</g:link>`,
        item.imageLink ? `      <g:image_link>${escapeXml(item.imageLink)}</g:image_link>` : null,
        `      <g:availability>${item.availability}</g:availability>`,
        `      <g:price>${escapeXml(item.price)}</g:price>`,
        `      <g:brand>${escapeXml(item.brand)}</g:brand>`,
        `      <g:product_type>${escapeXml(item.productType)}</g:product_type>`,
        `      <g:condition>new</g:condition>`,
        `    </item>`,
      ];
      return lines.filter((line) => line !== null).join("\n");
    })
    .join("\n");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n` +
    `  <channel>\n` +
    `    <title>${escapeXml(channelTitle)}</title>\n` +
    `    <link>${escapeXml(options.baseUrl.replace(/\/+$/, ""))}</link>\n` +
    `    <description>${escapeXml(options.description ?? "Produktfeed für Shopping- und Preisvergleichs-Plattformen.")}</description>\n` +
    `    <lastBuildDate>${escapeXml(new Date().toUTCString())}</lastBuildDate>\n` +
    (itemXml ? `${itemXml}\n` : "") +
    `  </channel>\n` +
    `</rss>\n`
  );
}
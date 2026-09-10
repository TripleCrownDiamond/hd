import { afterEach, describe, expect, it } from "vitest";
import {
  buildMerchantFeedXml,
  centsToFeedPrice,
  toMerchantFeedItem,
  type MerchantFeedItem,
} from "./merchant-feed-xml";
import type { ProductRow } from "@/lib/db/types";

const OLD_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  if (OLD_APP_URL === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = OLD_APP_URL;
});

const BASE_URL = "https://holzdirekt.store";

function product(overrides: Partial<ProductRow> = {}): ProductRow {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "kaminofen-austria-1",
    kind: "stove",
    brand_id: "brand-1",
    category_id: null,
    economic_operator_id: null,
    model: "Austria 1 & Co",
    subtitle: "Ein Kaminofen",
    short_description: "Kurz und bündig",
    long_description: null,
    description_authorized: true,
    power_kw_min: null,
    power_kw_max: null,
    power_kw_nominal: null,
    efficiency_pct: null,
    energy_class: null,
    fuel: null,
    flue_diameter_mm: null,
    connection_position: null,
    height_mm: null,
    width_mm: null,
    depth_mm: null,
    weight_kg: null,
    co_mg_nm3: null,
    ogc_mg_nm3: null,
    particulates_mg_nm3: null,
    raw_air_independent: null,
    extra: { stock: "in_stock" },
    price_cents_public: 79995,
    quantity_amount: 990,
    quantity_unit: "kg",
    base_price_unit: "t",
    quote_mode: false,
    ecodesign_2022: null,
    bimschv_stufe: null,
    compliance_verified_at: null,
    source: null,
    source_url: null,
    source_scraped_at: null,
    is_published: true,
    is_featured: false,
    review_status: "approved",
    reviewed_at: null,
    reviewed_by: null,
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-02T00:00:00.000Z",
    ...overrides,
  };
}

const brandNames = new Map([["brand-1", "Austria"]]);
const heroImages = new Map([
  ["11111111-1111-4111-8111-111111111111", "local:holzkraft/products/austria.webp"],
]);

describe("centsToFeedPrice", () => {
  it("renders cents with a decimal point, the format aggregators expect", () => {
    expect(centsToFeedPrice(79995)).toBe("799.95");
    expect(centsToFeedPrice(800)).toBe("8.00");
  });
});

describe("toMerchantFeedItem", () => {
  it("maps a priced, published, approved stove", () => {
    const item = toMerchantFeedItem(product(), brandNames, heroImages, BASE_URL);
    expect(item).not.toBeNull();
    expect(item!.link).toBe(`${BASE_URL}/kaminofen/kaminofen-austria-1`);
    expect(item!.price).toBe("799.95 EUR");
    expect(item!.brand).toBe("Austria");
    expect(item!.productType).toBe("Kaminöfen");
    expect(item!.availability).toBe("in stock");
    expect(item!.imageLink).toBe(`${BASE_URL}/images/holzkraft/products/austria.webp`);
    expect(item!.description).toContain("Kurz und bündig");
    expect(item!.description).toContain("Inhalt je Einheit: 990 kg");
    expect(item!.description).toContain("Grundpreis:");
  });

  it("routes wood products to /produkt with the Brennholz type", () => {
    const wood = product({ kind: "wood", slug: "buche-33", quantity_amount: 3, quantity_unit: "srm" });
    const woodItem = toMerchantFeedItem(wood, brandNames, new Map(), BASE_URL);
    expect(woodItem!.link).toBe(`${BASE_URL}/produkt/buche-33`);
    expect(woodItem!.productType).toBe("Brennholz");
    expect(woodItem!.imageLink).toBeNull();
  });

  it("falls back to the brand name when the product has no brand", () => {
    const item = toMerchantFeedItem(product({ brand_id: null }), new Map(), new Map(), BASE_URL);
    expect(item!.brand).toBe("HolzDirekt");
  });

  it("omits products whose review status or visibility keeps them off the shop", () => {
    expect(toMerchantFeedItem(product({ review_status: "pending" }), brandNames, heroImages, BASE_URL)).toBeNull();
    expect(toMerchantFeedItem(product({ is_published: false }), brandNames, heroImages, BASE_URL)).toBeNull();
  });

  it("omits quote-on-request products: no price to aggregate", () => {
    expect(toMerchantFeedItem(product({ price_cents_public: null }), brandNames, heroImages, BASE_URL)).toBeNull();
  });

  it("maps unknown stock to out of stock rather than inventing a value", () => {
    const item = toMerchantFeedItem(
      product({ extra: { stock: "weird_value" } }),
      brandNames,
      heroImages,
      BASE_URL,
    );
    expect(item!.availability).toBe("out of stock");
  });
});

describe("buildMerchantFeedXml", () => {
  const item: MerchantFeedItem = {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Austria 1 & Co",
    description: "Kurz & bündig <b>kühn</b>",
    link: `${BASE_URL}/kaminofen/kaminofen-austria-1`,
    imageLink: `${BASE_URL}/images/austria.webp`,
    availability: "in stock",
    price: "799.95 EUR",
    brand: "Austria & Söhne",
    productType: "Kaminöfen",
  };

  it("wraps items in the RSS 2.0 merchant document", () => {
    const xml = buildMerchantFeedXml([item], { baseUrl: BASE_URL });
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">');
    expect(xml).toContain(`<link>${BASE_URL}</link>`);
    expect(xml).toContain(`<g:id>${item.id}</g:id>`);
    expect(xml).toContain("<g:price>799.95 EUR</g:price>");
    expect(xml).toContain("<g:availability>in stock</g:availability>");
    expect(xml).toContain("<g:image_link>");
  });

  it("escapes XML metacharacters coming from catalogue text", () => {
    const xml = buildMerchantFeedXml([item], { baseUrl: BASE_URL });
    expect(xml).not.toContain("Austria 1 & Co");
    expect(xml).toContain("Austria 1 &amp; Co");
    expect(xml).toContain("Kurz &amp; bündig &lt;b&gt;kühn&lt;/b&gt;");
    expect(xml).toContain("Austria &amp; Söhne");
  });

  it("renders a valid empty channel for no items", () => {
    const xml = buildMerchantFeedXml([], { baseUrl: BASE_URL });
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("<channel>");
    expect(xml).not.toContain("<item>");
  });
});
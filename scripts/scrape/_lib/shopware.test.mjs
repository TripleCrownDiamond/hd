import { describe, expect, it } from "vitest";
import {
  extractJsonLd,
  extractSpecTable,
  productNode,
  shopwareName,
  shopwarePriceCents,
} from "./shopware.mjs";

/** A WooCommerce page: SEO breadcrumbs first, the product in a later block. */
function wooPage({ price = "449.00", name = "Holzpellets Premium ENplus A1" } = {}) {
  const breadcrumbs = JSON.stringify({
    "@context": "https://schema.org/",
    "@graph": [{ "@type": "BreadcrumbList", itemListElement: [] }],
  });
  const product = JSON.stringify({
    "@context": "https://schema.org/",
    "@graph": [
      {
        "@type": "Product",
        name,
        description: "Herstellertext.",
        offers: [
          {
            "@type": "Offer",
            priceSpecification: [{ "@type": "UnitPriceSpecification", price }],
            price,
            priceCurrency: "EUR",
          },
        ],
      },
    ],
  });
  return `
    <script type="application/ld+json">${breadcrumbs}</script>
    <span class="price"><bdi>150,00&nbsp;&euro;</bdi></span>
    <script type="application/ld+json">${product}</script>
  `;
}

describe("extractJsonLd", () => {
  it("returns the block that carries the product, not the first one", () => {
    const found = productNode(extractJsonLd(wooPage()));
    expect(found?.name).toBe("Holzpellets Premium ENplus A1");
  });

  it("falls back to the first parseable block when no product is declared", () => {
    const html = `<script type="application/ld+json">{"@type":"WebPage","name":"x"}</script>`;
    expect(extractJsonLd(html)["@type"]).toBe("WebPage");
  });
});

describe("shopwarePriceCents", () => {
  it("reads the offer of this product, not a carousel neighbour", () => {
    const html = wooPage();
    // 150,00 € belongs to the related-products strip and must not win.
    expect(shopwarePriceCents(html, extractJsonLd(html))).toBe(44900);
  });
});

describe("shopwareName", () => {
  it("finds the name inside an @graph", () => {
    const html = wooPage({ name: "Holzbriketts Pini Kay" });
    expect(shopwareName(html, extractJsonLd(html))).toBe("Holzbriketts Pini Kay");
  });
});

describe("extractSpecTable", () => {
  it("reads header-cell declarations", () => {
    const html = "<tr><th>Heizwert</th><td>ca. 4,9 kWh/kg</td></tr>";
    expect(extractSpecTable(html)).toEqual({ Heizwert: "ca. 4,9 kWh/kg" });
  });

  it("reads WooCommerce tables that emphasise the label instead", () => {
    const html = `
      <tr><td><strong>Durchmesser</strong></td><td>6 mm (&plusmn;1 mm)</td></tr>
      <tr><td><strong>Aschegehalt</strong></td><td>&le; 0,7 %</td></tr>
    `;
    const specs = extractSpecTable(html);
    expect(specs["Durchmesser"]).toContain("6 mm");
    expect(specs["Aschegehalt"]).toContain("0,7 %");
  });

  it("ignores a two-column table whose first cell is not a label", () => {
    const html = "<tr><td>2024</td><td>Neuer Standort</td></tr>";
    expect(extractSpecTable(html)).toEqual({});
  });
});

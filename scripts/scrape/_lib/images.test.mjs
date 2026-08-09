import { describe, expect, it } from "vitest";
import { isGenericImage, isNonProductImage, rankProductImages } from "./images.mjs";

describe("isNonProductImage", () => {
  it("rejects payment badges", () => {
    for (const url of [
      "https://x.de/media/jsm-visa.png",
      "https://x.de/media/jsm-mastercard.png",
      "https://x.de/media/jsm-vorkasse-w.png",
      "https://x.de/media/bank-transfer.png",
      "https://x.de/media/delivery-cash.png",
    ]) {
      expect(isNonProductImage(url), url).toBe(true);
    }
  });

  it("rejects supplier logos whatever the separator", () => {
    // URLs encode spaces as "+", which an [-_/] separator class would miss.
    expect(isNonProductImage("https://x.de/f/CLIPx230x60/Deutsch+Logo.jpg")).toBe(true);
    expect(isNonProductImage("https://x.de/f/woodseeds%20logo.png")).toBe(true);
    expect(isNonProductImage("https://x.de/f/logo-warnecke.jpg")).toBe(true);
  });

  it("rejects carrier, trust and social assets", () => {
    expect(isNonProductImage("https://x.de/m/dhl-logo.png")).toBe(true);
    expect(isNonProductImage("https://x.de/m/jsm-fedex-versand.png")).toBe(true);
    expect(isNonProductImage("https://x.de/m/jsm-sepa-w.png")).toBe(true);
    expect(isNonProductImage("https://x.de/m/trusted-shops.png")).toBe(true);
    expect(isNonProductImage("https://x.de/m/whatsapp-bild-2025-10-21.jpg")).toBe(true);
  });

  it("keeps genuine product photography", () => {
    // "hintergrund weiß" describes a cut-out on white — the ideal hero image.
    expect(
      isNonProductImage("https://cdn/rika/trio_freisteller_hintergrund_weiß.png"),
    ).toBe(false);
    expect(isNonProductImage("https://x.de/m/SK_BELLA_Stahl_schwarz.webp")).toBe(false);
    expect(isNonProductImage("https://x.de/m/brennholz-buche-25cm-palette.jpg")).toBe(false);
  });
});

describe("rankProductImages", () => {
  it("puts the photo naming the model first", () => {
    const ranked = rankProductImages(
      [
        "https://x.de/m/ambiente-wohnzimmer.jpg",
        "https://x.de/m/jsm-visa.png",
        "https://x.de/m/brennholz-buche-25cm-palette.jpg",
      ],
      "JSM Brennholz Brennholz Buche 25 cm Palette",
    );
    expect(ranked[0]).toContain("brennholz-buche-25cm-palette");
    expect(ranked.some((url) => url.includes("visa"))).toBe(false);
  });

  it("demotes ambience shots below pack shots", () => {
    const ranked = rankProductImages(
      ["https://x.de/m/bella-ambiente-wohnzimmer.jpg", "https://x.de/m/bella-freisteller.jpg"],
      "Camina BELLA",
    );
    expect(ranked[0]).toContain("freisteller");
  });

  it("keeps the page order when nothing distinguishes the images", () => {
    const urls = ["https://x.de/m/a.jpg", "https://x.de/m/b.jpg"];
    expect(rankProductImages(urls, "Modell")).toEqual(urls);
  });

  it("puts the product render ahead of a detail crop naming the brand", () => {
    // The detail file repeats "hark"; the render's name is a bare SKU. Counting
    // the brand as a matching token used to make the close-up the main image.
    const ranked = rankProductImages(
      [
        "https://img.hark.de/out/pictures/master/product/1/h4452gteylxxx41v1v118.png",
        "https://img.hark.de/out/pictures/master/product/2/hark_044_5_2gte_det01.jpg",
        "https://img.hark.de/out/pictures/master/product/3/hark_044_5_2gte_det02.jpg",
      ],
      "HARK 44-5.2 GT ECOplus FlameKat RUA",
      "HARK",
    );
    expect(ranked[0]).toContain("h4452gteylxxx41v1v118");
  });

  it("puts the Rönky stove photo ahead of its replacement stone cover", () => {
    const ranked = rankProductImages(
      [
        "https://www.ofen.de/media/ra-abdeckung-fireplace-speckstein.jpg",
        "https://www.ofen.de/media/kaminofen-fireplace-roenky-speckstein-verbrennungsluftregler.jpg",
        "https://www.ofen.de/media/DauerbrandofenFireplaceRnkySpeckstein10kW9kW-202783.jpg",
        "https://www.ofen.de/media/kaminofen-fireplace-roenky-speckstein-montagebeispiel-1.jpg",
      ],
      "Dauerbrandofen Fireplace Rönky Speckstein 10 kW / 9 kW",
      "ofen-de",
    );
    expect(ranked[0]).toContain("DauerbrandofenFireplaceRnkySpeckstein10kW9kW");
  });

  it("drops the same file served from several paths", () => {
    const ranked = rankProductImages(
      [
        "https://img.hark.de/out/pictures/master/product/2/det02.jpg",
        "https://img.hark.de/out/pictures/master/product/3/det02.jpg",
      ],
      "HARK 44",
      "HARK",
    );
    expect(ranked).toHaveLength(1);
  });

  it("rejects catalogue mockups used across a whole range", () => {
    expect(isNonProductImage("https://x.at/m/Magazine-Mockup-Kaminöfen-braun.jpg")).toBe(true);
    expect(isNonProductImage("https://x.at/m/preisliste-2025.jpg")).toBe(true);
  });
});

describe("isGenericImage", () => {
  it("flags untitled camera files and range-wide label artwork", () => {
    expect(isGenericImage("https://x.de/m/IMG_7794.jpg")).toBe(true);
    expect(isGenericImage("https://x.de/m/schuettgut-label-fichte.jpg")).toBe(true);
    expect(isGenericImage("https://x.de/m/Karton+Label+Buche.jpg")).toBe(true);
  });

  it("does not flag a named product photo", () => {
    expect(isGenericImage("https://x.de/m/brennholz-buche-25cm-palette.jpg")).toBe(false);
    expect(isGenericImage("https://x.de/m/h4452gteylxxx41v1v118.png")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  clean,
  dedupeSlugs,
  detectLengthCm,
  detectProductKind,
  detectUnit,
  detectWoodType,
} from "./wood.mjs";

describe("clean", () => {
  it("decodes the entities shop templates emit", () => {
    expect(clean("Pellets 6&nbsp;mm &amp; 15 kg")).toBe("Pellets 6 mm & 15 kg");
    expect(clean("Holzpellets &#8211; 990 kg")).toBe("Holzpellets – 990 kg");
    expect(clean("Sch&uuml;ttdichte")).toBe("Schüttdichte");
  });

  it("decodes WordPress double encoding", () => {
    // Product names arrive as `&amp;#8211;`; one pass would leave `&#8211;`.
    expect(clean("Holzpellets &amp;#8211; Palette")).toBe("Holzpellets – Palette");
  });

  it("leaves an unknown entity alone rather than mangling it", () => {
    expect(clean("Marke &foo; Co")).toBe("Marke &foo; Co");
  });
});

describe("detectProductKind", () => {
  it("classifies firewood listings as wood", () => {
    expect(detectProductKind("Brennholz Buche 25 cm 2 RM Palette")).toBe("wood");
    expect(detectProductKind("Kaminholz reine Buche (Kiste) Ster trocken")).toBe("wood");
  });

  it("separates kindling from firewood", () => {
    expect(detectProductKind("Anzündholz im Raschelsack")).toBe("kindling");
    expect(detectProductKind("Anfeuerholz / Anzündholz für Feuer und Grill")).toBe("kindling");
  });

  it("classifies briquettes and pellets", () => {
    expect(detectProductKind("Ruf Holzbriketts in Folie 30 kg")).toBe("briquette");
    expect(detectProductKind("Holzpellets ENplus A1 15 kg")).toBe("pellet");
    expect(detectProductKind("Räucherpellets Buche")).toBe("accessory");
  });

  it("separates coal from wood briquettes", () => {
    // Brown-coal briquettes are not wood briquettes and cannot be burned in
    // the same appliances, so they must not share a category.
    expect(detectProductKind("Braunkohle Briketts 90 x 10 kg REKORD")).toBe("coal");
    expect(detectProductKind("Steinkohle 25-60 mm Nusskohle")).toBe("coal");
    expect(detectProductKind("Holzkohle Briketts 6kg Sack")).toBe("coal");
    expect(detectProductKind("Kohlepalette 100 Anthrazit")).toBe("coal");
  });

  it("does not let the packaging outrank the fuel", () => {
    // This landed in Ofenzubehör because "Box" was decided before "Briketts".
    expect(detectProductKind("Buchen Nestro Briketts – 12 kg Box – Palette")).toBe("briquette");
    expect(detectProductKind("Räucherbox Erle")).toBe("accessory");
  });

  it("keeps services and vouchers out of the catalogue", () => {
    expect(detectProductKind("Brennholz Stapelservice (Berechnung pro Srm)")).toBe("service");
    expect(detectProductKind("Brennholzlieferung bis in Garage")).toBe("service");
    expect(detectProductKind("Wärme schenken")).toBe("voucher");
  });
});

describe("detectWoodType", () => {
  it("reads the essence from the title", () => {
    expect(detectWoodType("Brennholz Hainbuche 25 cm")).toBe("Hainbuche");
    expect(detectWoodType("Buche technisch getrocknet")).toBe("Buche");
  });

  it("returns null when no essence is named", () => {
    expect(detectWoodType("Räucherbox")).toBeNull();
  });
});

describe("detectLengthCm", () => {
  it("reads whole lengths, not trailing digits", () => {
    expect(detectLengthCm("Brennholz Buche 25 cm")).toBe("25");
    expect(detectLengthCm("Scheite 30/33 cm")).toBe("30/33");
    expect(detectLengthCm("Stamm 100 cm")).toBe("100");
  });
});

describe("detectUnit", () => {
  it("keeps the German decimal comma", () => {
    expect(detectUnit("Brennholz Buche 1,6 SRM")).toEqual({ quantity: "1,6", unit: "SRM" });
    expect(detectUnit("Palette 2 RM")).toEqual({ quantity: "2", unit: "RM" });
  });

  it("reads a pack count with its pack size", () => {
    // Without this the quantity read as "36 Säcke" and never said how much a
    // sack holds, so the product was withheld for a missing quantity.
    expect(detectUnit("Brennholz Birke 33cm – 36 Säcke à 40L")).toEqual({
      quantity: "36",
      unit: "Säcke à 40 L",
    });
    expect(detectUnit("Holzpellets ENplus A1 6 mm – 66 × 15 kg (990 kg)")).toEqual({
      quantity: "66",
      unit: "× 15 kg",
    });
  });
});

describe("dedupeSlugs", () => {
  it("disambiguates offers that share a title with the URL segment", () => {
    const records = [
      { slug: "shop-brennholz-buche", source: "shop", source_url: "https://x.de/a/buche-1-6-rm/" },
      { slug: "shop-brennholz-buche", source: "shop", source_url: "https://x.de/a/buche-2-rm/" },
      { slug: "shop-brennholz-buche", source: "shop", source_url: "https://x.de/a/buche-b-ware/" },
    ];
    dedupeSlugs(records);
    expect(new Set(records.map((r) => r.slug)).size).toBe(3);
    expect(records[1].slug).toBe("shop-buche-2-rm");
  });
});

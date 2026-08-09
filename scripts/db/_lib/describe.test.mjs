import { describe, expect, it } from "vitest";
import { buildDescription } from "./describe.mjs";

describe("buildDescription", () => {
  it("states only figures the source published", () => {
    const text = buildDescription({
      kind: "stove",
      model: "Vista 11",
      brand: "Pacific Energy",
      power_kw_nominal: 11,
      extra: {},
    });
    expect(text).toContain("11 kW Nennwärmeleistung");
    // Nothing was published about efficiency, so nothing is claimed.
    expect(text).not.toContain("Wirkungsgrad");
    expect(text).not.toContain("Energieeffizienzklasse");
  });

  it("does not repeat a category the title already carries", () => {
    const text = buildDescription({
      kind: "stove",
      model: "Kaminofen Pacific Energy Vista 11 kW",
      brand: "ofen.de",
      power_kw_nominal: 11,
      extra: {},
    });
    expect(text).not.toContain("Kaminofen Kaminofen");
    const durationStove = buildDescription({
      kind: "stove",
      model: "Dauerbrandofen Fireplace Rönky Speckstein",
      brand: "ofen.de",
      power_kw_nominal: 10,
      extra: {},
    });
    expect(durationStove).toContain("Der Dauerbrandofen Fireplace Rönky Speckstein");
    expect(durationStove).not.toContain("Kaminofen Dauerbrandofen");
  });

  it("writes a power range with correct German grammar", () => {
    const text = buildDescription({
      kind: "stove",
      model: "Vista",
      brand: "Pacific Energy",
      power_kw_min: 4.5,
      power_kw_max: 7.7,
      weight_kg: 150,
      flue_diameter_mm: 150,
      height_mm: 1046,
      extra: {},
    });
    expect(text).toContain("eine Wärmeleistung von 4,5 bis 7,7 kW");
    // No comma before a closing "und" clause.
    expect(text).not.toContain(", und ");
  });

  it("keeps a grammatical subject when only the weight is known", () => {
    const text = buildDescription({
      kind: "stove",
      model: "Rönky Speckstein",
      brand: "Fireplace",
      power_kw_nominal: 10,
      weight_kg: 380,
      extra: {},
    });
    expect(text).toContain("Das Gerät wiegt 380 kg.");
    expect(text).not.toMatch(/\.\s+wiegt\b/);
  });

  it("summarises the declaration for solid fuels", () => {
    const text = buildDescription({
      kind: "wood",
      model: "Brennholz Buche 25 cm 2 RM",
      brand: "Holzhof24",
      extra: { wood_type: "Buche", length_de: "25 cm", moisture_de: "kammergetrocknet" },
    });
    expect(text).toContain("Holzart Buche");
    expect(text).toContain("Scheitlänge 25 cm");
  });

  it("uses the retailer spec table for accessories", () => {
    const text = buildDescription({
      kind: "accessory",
      model: "Kamingitter aus Glas",
      brand: "ofen.de",
      extra: { category_de: "Funkenschutzgitter", source_specs: { Material: "Glas" } },
    });
    expect(text).toContain("Funkenschutzgitter");
    expect(text).toContain("Material: Glas");
  });

  it("does not turn footnotes or raw measurements into equipment claims", () => {
    const text = buildDescription({
      kind: "stove",
      model: "Pelletofen Alea",
      power_kw_nominal: 6.2,
      extra: { feature_labels: ["5 Pa ****", "min. 3 g/smax. 4,5 g/s", "automatische Regelung"] },
    });
    expect(text).toContain("automatische Regelung");
    expect(text).not.toContain("****");
    expect(text).not.toContain("g/smax");
  });

  it("returns null when the source published nothing usable", () => {
    expect(buildDescription({ kind: "stove", model: "", brand: "", extra: {} })).toBeNull();
  });
});

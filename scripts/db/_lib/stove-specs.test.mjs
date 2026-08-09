import { describe, expect, it } from "vitest";
import { mapStoveSpecs, parseGermanNumber, parseLengthMm, parseRange } from "./stove-specs.mjs";

describe("parseGermanNumber", () => {
  it("reads German decimals and thousands separators", () => {
    expect(parseGermanNumber("1.653 mm")).toBe(1653);
    expect(parseGermanNumber("104,5")).toBe(104.5);
    expect(parseGermanNumber("≥ 75,0 %")).toBe(75);
    expect(parseGermanNumber("&lt; 0,12 %-Vol.")).toBe(0.12);
  });
});

describe("parseLengthMm", () => {
  it("honours the stated unit, including units glued to the number", () => {
    expect(parseLengthMm("1115 mm")).toBe(1115);
    expect(parseLengthMm("149 cm")).toBe(1490);
    expect(parseLengthMm("51,6cm")).toBe(516);
  });

  it("uses the hint only when no unit is stated", () => {
    expect(parseLengthMm("113", "cm")).toBe(1130);
    expect(parseLengthMm("850", "mm")).toBe(850);
  });
});

describe("parseRange", () => {
  it("reads a power range", () => {
    expect(parseRange("6,2 bis 11,4 kW")).toEqual({ min: 6.2, max: 11.4 });
    expect(parseRange("8 kW")).toEqual({ min: null, max: null });
  });
});

describe("mapStoveSpecs", () => {
  it("reads composite outer dimensions in cm", () => {
    const m = mapStoveSpecs({ Außenmaße: "H x B x T 104,5/103 x 65 x 51,6cm" });
    expect([m.height_mm, m.width_mm, m.depth_mm]).toEqual([1045, 650, 516]);
  });

  it("takes the lower bound of an adjustable range", () => {
    const m = mapStoveSpecs({ Außenmaße: "H x B x T 163-436 x 35 x 35 cm" });
    expect(m.height_mm).toBe(1630);
  });

  it("ignores dimensions that describe a part, not the stove", () => {
    const m = mapStoveSpecs({
      "Höhe ext. Verbr.-luftzufuhr (mm)": "95",
      "sichtbares Scheibenmaß Höhe": "420",
      "Höhe (cm)": "113",
    });
    expect(m.height_mm).toBe(1130);
  });

  it("takes the first figure of a variant weight list", () => {
    expect(mapStoveSpecs({ Gewicht: "Brennkammer: 145 kg, kleine Box: 18 kg" }).weight_kg).toBe(145);
    expect(
      mapStoveSpecs({ Gesamtgewicht: "150 / 202 / 180 kg (Steel / Stone / Keramik)" }).weight_kg,
    ).toBe(150);
  });

  it("normalises an energy class stated once per variant", () => {
    expect(mapStoveSpecs({ "Leistungsdaten: Energieeffizienzklasse": "A/A" }).energy_class).toBe("A");
    expect(mapStoveSpecs({ Energieeffizienzklasse: "A+" }).energy_class).toBe("A+");
  });

  it("fills emission columns only when an mg unit is stated", () => {
    expect(mapStoveSpecs({ "Staub (13%O2)": "21,7 mg/m³" }).particulates_mg_nm3).toBe(21.7);
    // A percentage is not convertible here and must not become a mg figure.
    expect(mapStoveSpecs({ "CO (13%O2)": "0,086 %" }).co_mg_nm3).toBeNull();
    expect(mapStoveSpecs({ "CO-Gehalt im Abgas": "&lt; 0,12 %-Vol." }).co_mg_nm3).toBeNull();
  });

  it("reads a flue diameter only when one is stated", () => {
    expect(mapStoveSpecs({ Rauchrohranschluss: "nach oben Ø 150 mm" }).flue_diameter_mm).toBe(150);
    expect(
      mapStoveSpecs({ Rauchrohranschluss: "oben; seitlich oder hinten" }).flue_diameter_mm,
    ).toBeNull();
  });
});

/**
 * Map manufacturer spec tables onto the typed `products` columns.
 *
 * Every manufacturer labels and formats its data differently — German decimal
 * commas, thousands dots, ranges ("6,2 bis 11,4 kW"), variant lists
 * ("150 / 202 / 180 kg (Steel / Stone / Keramik)"), qualifiers ("≥ 75,0 %"),
 * composite dimensions ("H x B x T 104,5 x 65 x 51,6 cm") and Jøtul's
 * `AtrNominelOutput` attribute names.
 *
 * Rule: never guess a unit for a regulated figure. Emission columns are filled
 * only when the source states an explicit mg unit; a percentage stays in
 * `extra.technical_specs` where it can be reviewed rather than being converted.
 */

/** Decode the HTML entities the scrapers leave in spec values. */
function decode(value) {
  return String(value ?? "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/[  ]/g, " ")
    .trim();
}

/**
 * First plausible number in a German-formatted string.
 * "1.653" -> 1653 · "104,5" -> 104.5 · "≥ 75,0 %" -> 75
 */
export function parseGermanNumber(value) {
  const text = decode(value);
  if (!text) return null;
  const match = text.match(/-?\d{1,3}(?:\.\d{3})+(?:,\d+)?|-?\d+(?:[.,]\d+)?/);
  if (!match) return null;
  let raw = match[0];
  if (/\d\.\d{3}/.test(raw)) raw = raw.replace(/\./g, ""); // thousands separator
  const parsed = Number.parseFloat(raw.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

/** All numbers in a string, in order. */
function allNumbers(value) {
  const text = decode(value);
  return [...text.matchAll(/-?\d{1,3}(?:\.\d{3})+(?:,\d+)?|-?\d+(?:[.,]\d+)?/g)]
    .map((m) => {
      let raw = m[0];
      if (/\d\.\d{3}/.test(raw)) raw = raw.replace(/\./g, "");
      return Number.parseFloat(raw.replace(",", "."));
    })
    .filter(Number.isFinite);
}

/** "6,2 bis 11,4 kW" / "4,5 - 7,7" -> { min, max }; otherwise nulls. */
export function parseRange(value) {
  const text = decode(value);
  const match = text.match(
    /(\d+(?:[.,]\d+)?)\s*(?:bis|–|—|-|–)\s*(\d+(?:[.,]\d+)?)/i,
  );
  if (!match) return { min: null, max: null };
  const min = Number.parseFloat(match[1].replace(",", "."));
  const max = Number.parseFloat(match[2].replace(",", "."));
  return Number.isFinite(min) && Number.isFinite(max) && max > min ? { min, max } : { min: null, max: null };
}

/**
 * A length in millimetres, honouring the unit written next to it.
 * "1115 mm" -> 1115 · "149 cm" -> 1490 · "1,4 m" -> 1400
 * A bare number is treated as mm only when `assume` says so.
 */
export function parseLengthMm(value, assume = "mm") {
  const text = decode(value);
  const number = parseGermanNumber(text);
  if (number == null) return null;
  // No `\b` before the unit: "51,6cm" has no word boundary between digit and c.
  if (/mm(?![a-z])/i.test(text)) return Math.round(number);
  if (/cm(?![a-z])/i.test(text)) return Math.round(number * 10);
  if (/\bm(?![a-z])/i.test(text)) return Math.round(number * 1000);
  if (assume === "cm") return Math.round(number * 10);
  return Math.round(number);
}

/** Find the first spec whose label matches, returning its key and value. */
function pickEntry(specs, pattern) {
  for (const [key, value] of Object.entries(specs)) {
    if (pattern.test(key)) {
      const decoded = decode(value);
      if (decoded) return { key, value: decoded };
    }
  }
  return null;
}

function pick(specs, pattern) {
  return pickEntry(specs, pattern)?.value ?? null;
}

/**
 * Length from a spec entry whose unit may sit in the label rather than the
 * value — HARK writes `"Höhe (cm)": "111"`.
 */
function entryLengthMm(entry) {
  if (!entry) return null;
  const hint = /cm(?![a-z])/i.test(entry.key) ? "cm" : "mm";
  return parseLengthMm(entry.value, hint);
}

/** "H x B x T 104,5 x 65 x 51,6 cm" / "500 x 275 x 275 mm" -> mm triple. */
function parseDimensionTriple(value) {
  const text = decode(value);
  if (!text) return null;
  // Require three numbers separated by "x" so prose does not match. Each may be
  // a variant list ("104,5/103") or an adjustable range ("163-436"); the first
  // value is the one that describes the product as delivered.
  const numberOrRange = String.raw`\d+(?:[.,]\d+)?(?:\s*[/–-]\s*\d+(?:[.,]\d+)?)?`;
  const match = text.match(
    new RegExp(
      `(${numberOrRange})\\s*[x×]\\s*(${numberOrRange})\\s*[x×]\\s*(${numberOrRange})`,
      "i",
    ),
  );
  if (!match) return null;
  // "51,6cm" has no word boundary before the unit, so do not require one.
  const unit = /cm(?![a-z])/i.test(text) ? "cm" : "mm";
  const toMm = (raw) => {
    const n = Number.parseFloat(raw.replace(",", "."));
    return Number.isFinite(n) ? Math.round(unit === "cm" ? n * 10 : n) : null;
  };
  // Labels state the order; H x B x T is the German convention.
  return { height: toMm(match[1]), width: toMm(match[2]), depth: toMm(match[3]) };
}

/**
 * Derive typed values from a manufacturer spec table.
 *
 * @param {Record<string,string>} rawSpecs
 * @returns {object} typed fields; every key may be null
 */
export function mapStoveSpecs(rawSpecs) {
  const specs = rawSpecs ?? {};

  const powerRaw = pick(
    specs,
    /Nennwärmeleistung|Nennleistung|^Wärmeleistung|Leistungsabgabe|AtrNominelOutput/i,
  );
  const powerRange = powerRaw ? parseRange(powerRaw) : { min: null, max: null };
  const powerNominal = powerRaw ? parseGermanNumber(powerRaw) : null;
  const powerMin = powerRange.min ?? (pick(specs, /AtrMinOutput/i) ? parseGermanNumber(pick(specs, /AtrMinOutput/i)) : null);
  const powerMax = powerRange.max ?? (pick(specs, /AtrMaxOutput/i) ? parseGermanNumber(pick(specs, /AtrMaxOutput/i)) : null);

  const efficiencyRaw = pick(specs, /Wirkungsgrad|AtrEfficiency/i);
  const energyClassRaw = pick(specs, /Energieeffizienzklasse|Energieklasse/i);
  // "A/A" lists the class per variant; they are identical, so keep one.
  const energyClass = energyClassRaw
    ? (energyClassRaw.split(/[/,]/)[0].trim().match(/^A\+{0,3}|^[A-G]$/i)?.[0] ?? null)
    : null;

  const fuelRaw = pick(specs, /Empfohlenen? Brennstoffe|^Brennstoffe?$|Brennstoffart/i);

  const outerRaw = pick(specs, /Außenmaße|Aussenmaße|Abmessungen \(H|Maße \(H|Größe \(H/i);
  const triple = outerRaw ? parseDimensionTriple(outerRaw) : null;
  // The label must be the dimension alone, optionally followed by a unit in
  // brackets. A loose match picks up "Höhe ext. Verbr.-luftzufuhr (mm)" (the
  // air-inlet height) or "sichtbares Scheibenmaß Höhe" instead of the stove.
  const outer = (word) =>
    new RegExp(`^(?:Abmessungen:\\s*|Gesamt)?${word}\\s*(?:\\([^)]*\\)|\\[[^\\]]*\\])?$`, "i");
  const heightEntry =
    pickEntry(specs, outer("Höhe")) ?? pickEntry(specs, /^AtrProductHeight$/i);
  const widthEntry =
    pickEntry(specs, outer("Breite")) ?? pickEntry(specs, /^AtrProductWidth$/i);
  const depthEntry =
    pickEntry(specs, outer("Tiefe")) ?? pickEntry(specs, /^AtrProductDepth$/i);

  const weightRaw = pick(specs, /Gesamtgewicht|^Gewicht\b|AtrProductWeight/i);
  // "Brennkammer: 145 kg, kleine Box: 18 kg" — the first figure is the body.
  const weight = weightRaw ? allNumbers(weightRaw)[0] ?? null : null;

  const flueRaw = pick(specs, /Rauchrohranschluss|Abgasstutzen|AtrFlueOutlet$|Durchmesser Rauchrohr/i);
  // Only read a diameter when one is actually stated (Ø or mm).
  const flueDiameter =
    flueRaw && /Ø|durchmesser|\bmm\b|^\d+$/i.test(flueRaw) ? parseGermanNumber(flueRaw) : null;
  const connection = pick(specs, /Rauchrohranschluss|AtrFlueExitOptions/i);

  const bimschvRaw = pick(specs, /BImSchV/i);
  const bimschv = bimschvRaw && /2/.test(bimschvRaw) ? "Stufe 2" : null;

  // Emissions: explicit mg units only — a "%" figure is not convertible here.
  const mgValue = (pattern) => {
    const raw = pick(specs, pattern);
    return raw && /\bmg\b/i.test(raw) ? parseGermanNumber(raw) : null;
  };

  return {
    power_kw_nominal: powerNominal,
    power_kw_min: powerMin,
    power_kw_max: powerMax,
    efficiency_pct: efficiencyRaw ? parseGermanNumber(efficiencyRaw) : null,
    energy_class: energyClass,
    fuel: fuelRaw,
    height_mm: triple?.height ?? entryLengthMm(heightEntry),
    width_mm: triple?.width ?? entryLengthMm(widthEntry),
    depth_mm: triple?.depth ?? entryLengthMm(depthEntry),
    weight_kg: weight,
    flue_diameter_mm: flueDiameter,
    connection_position: connection,
    bimschv_stufe: bimschv,
    co_mg_nm3: mgValue(/^CO\b|CO-Emission|CO \(/i),
    ogc_mg_nm3: mgValue(/OGC|CnHm|Kohlenwasserstoffe/i),
    particulates_mg_nm3: mgValue(/Staub|Feinstaub|Partikel/i),
  };
}

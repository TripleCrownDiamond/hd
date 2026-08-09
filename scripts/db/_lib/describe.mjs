/**
 * Compose a factual German product description from the data we hold.
 *
 * AGENTS.md forbids reusing a manufacturer's marketing copy — it is a literary
 * work. Technical values are facts and may be stated freely, so the description
 * is assembled from them rather than copied. Nothing here is inferred: a figure
 * appears only if the source published it.
 */

const KIND_NOUN = {
  stove: "Kaminofen",
  wood: "Brennholz",
  kindling: "Anzündholz",
  briquette: "Holzbriketts",
  coal: "Kohle",
  pellet: "Holzpellets",
  accessory: "Zubehör",
};

/**
 * The manufacturer's equipment terms, cleaned for use inside our own sentence.
 *
 * These are short factual designations ("AIRWASH-System für eine saubere
 * Scheibe", "schamotte im Feuerraum"), not prose. AGENTS.md forbids reusing the
 * marketing text; naming the equipment a product has is a statement of fact, and
 * it is presented here in a sentence of our own rather than the source's.
 */
function featureList(labels) {
  if (!Array.isArray(labels)) return [];
  return labels
    .map((label) => String(label).trim())
    .filter((label) => label.length > 3 && label.length < 90)
    .filter((label) => !/^(inkl\.|min\.|max\.)/i.test(label))
    .filter((label) => !/%|\bpa\b|g\/s|mg\/m|%\s*max|\bmin\.\s*\d/i.test(label))
    // Sales talk and figures already stated elsewhere add nothing.
    .filter((label) => !/^(heizleistung|nennwärmeleistung|preis|lieferzeit|jetzt |sofort)/i.test(label))
    .filter((label) => !/^(für\s|ideal\s)/i.test(label))
    .filter((label) => !/(freuen sie sich|geldbeutel|gemütlich|bezaubernd|entdecken sie|ideal für)/i.test(label))
    .map((label) => label.replace(/\*+/g, "").replace(/\s*\(optional\)\s*$/i, " (optional)").trim())
    // Lower-case a leading capital so the term reads inside a sentence.
    .map((label) => (/^[A-ZÄÖÜ][a-zäöüß]/.test(label) ? label : label))
    .slice(0, 6);
}

/** "a, b und c" — German enumeration. */
function joinDe(items) {
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} und ${items.at(-1)}`;
}

/** German number formatting: 8.5 -> "8,5". */
function de(value) {
  return String(value).replace(".", ",");
}

function sentence(parts) {
  const clean = parts.filter(Boolean);
  if (clean.length === 0) return null;
  // German takes no comma before a closing "und …" clause.
  return `${clean.join(", ").replace(/, und /g, " und ")}.`;
}

/**
 * @param {object} product row-shaped values (typed columns + extra)
 * @returns {string|null} two to four factual sentences, or null when the source
 *   published too little to say anything meaningful
 */
export function buildDescription(product) {
  const {
    kind,
    model,
    brand,
    power_kw_nominal: power,
    power_kw_min: powerMin,
    power_kw_max: powerMax,
    efficiency_pct: efficiency,
    energy_class: energyClass,
    fuel,
    height_mm: height,
    width_mm: width,
    depth_mm: depth,
    weight_kg: weight,
    flue_diameter_mm: flue,
    bimschv_stufe: bimschv,
    extra = {},
  } = product;

  const noun = KIND_NOUN[kind] ?? "Produkt";
  const sentences = [];
  // A description is only worth showing when the source published real values;
  // otherwise it would read "Der Kaminofen bietet." and say nothing.
  const facts = [
    power,
    powerMin,
    powerMax,
    efficiency,
    energyClass,
    fuel,
    height,
    width,
    depth,
    weight,
    flue,
    bimschv,
    extra.wood_type,
    extra.length_de,
    extra.moisture_de,
    extra.unit_de,
    extra.category_de,
    Object.keys(extra.source_specs ?? {}).length > 0 ? true : null,
  ].filter((value) => value != null && value !== "");
  if (facts.length === 0 || !model) return null;

  if (kind === "stove") {
    const powerText =
      powerMin != null && powerMax != null
        ? `eine Wärmeleistung von ${de(powerMin)} bis ${de(powerMax)} kW`
        : power != null
          ? `${de(power)} kW Nennwärmeleistung`
          : null;

    // Retailer titles already start with the category ("Kaminofen Pacific …"),
    // so repeating the noun would read "Der Kaminofen Kaminofen …".
    const alreadyNamesStoveKind = /^(kaminofen|dauerbrandofen|pelletofen|gussofen|werkstattofen)\b/i.test(model);
    const lead = alreadyNamesStoveKind ? model : `${noun} ${model}`;
    const showBrand = brand && !model.toLowerCase().includes(brand.toLowerCase());

    sentences.push(
      sentence([
        `Der ${lead}${showBrand ? ` von ${brand}` : ""} bietet${powerText ? ` ${powerText}` : ""}`,
        efficiency != null ? `${de(efficiency)} % Wirkungsgrad` : null,
        energyClass ? `Energieeffizienzklasse ${energyClass}` : null,
      ]),
    );

    const dims = [
      height != null ? `${height} mm hoch` : null,
      width != null ? `${width} mm breit` : null,
      depth != null ? `${depth} mm tief` : null,
    ].filter(Boolean);
    const physical = [];
    if (dims.length > 0) physical.push(`Er ist ${dims.join(", ")}`);
    if (weight != null) {
      physical.push(`${physical.length > 0 ? "wiegt" : "Das Gerät wiegt"} ${de(weight)} kg`);
    }
    if (flue != null) {
      physical.push(
        physical.length > 0
          ? `und hat einen Rauchrohranschluss mit ${flue} mm Durchmesser`
          : `Der Rauchrohranschluss hat ${flue} mm Durchmesser`,
      );
    }
    sentences.push(sentence(physical));

    if (fuel) sentences.push(`Zugelassener Brennstoff: ${fuel}.`);
    if (bimschv) sentences.push(`Der Hersteller gibt ${bimschv} der 1. BImSchV an.`);

    const equipment = featureList(extra.feature_labels);
    if (equipment.length > 0) {
      sentences.push(`Zur Ausstattung gehören ${joinDe(equipment)}.`);
    }
  } else if (kind === "accessory") {
    const specs = extra.source_specs ?? {};
    const facts = [];
    for (const label of ["Maße", "Material", "Farbe", "Durchmesser", "Länge", "Stärke"]) {
      const key = Object.keys(specs).find((k) => k.toLowerCase().startsWith(label.toLowerCase()));
      if (key && specs[key]) facts.push(`${key}: ${specs[key]}`);
    }
    sentences.push(
      sentence([
        `${model} aus dem Ofenzubehör`,
        extra.category_de ? `Kategorie ${extra.category_de}` : null,
      ]),
    );
    if (facts.length > 0) sentences.push(`${facts.slice(0, 4).join(" · ")}.`);
  } else {
    // Solid fuels: the declaration is what a buyer compares.
    // A pellet or briquette has no split length; the figure a shop publishes
    // there is the pressed length, so the label has to follow the kind.
    const pressed = kind === "pellet" || kind === "briquette" || kind === "coal";
    // The shop's own table lands under `source_specs`; the named fields sit
    // beside it only when a scraper lifted them out.
    const specs = extra.source_specs ?? {};
    const norm = extra.norm_de ?? specs.norm_de ?? specs.Zertifikate ?? specs.Zertifizierung;
    const energy = extra.energy_de ?? specs.energy_de ?? specs.Heizwert;
    const declared = [
      extra.wood_type ? `Holzart ${extra.wood_type}` : null,
      extra.length_de ? `${pressed ? "Länge" : "Scheitlänge"} ${extra.length_de}` : null,
      // A bare "≤ 10,0 %" says nothing on its own.
      extra.moisture_de
        ? /[a-zà-ÿ]/i.test(extra.moisture_de)
          ? extra.moisture_de
          : `Restfeuchte ${extra.moisture_de}`
        : null,
      pressed && norm ? `Zertifizierung ${norm}` : null,
      pressed && energy ? `Heizwert ${energy}` : null,
      extra.unit_de ? `Liefermenge ${extra.unit_de}` : null,
      extra.packaging_de && extra.packaging_de !== extra.unit_de
        ? `Verpackung ${extra.packaging_de}`
        : null,
    ].filter(Boolean);

    sentences.push(
      sentence([
        brand ? `${model} — ${noun} vom Lieferanten ${brand}` : `${model} — ${noun}`,
      ]),
    );
    if (declared.length > 0) sentences.push(`Deklaration: ${declared.join(", ")}.`);
  }

  sentences.push(
    "Diese Beschreibung wurde aus den erfassten Herstellerangaben zusammengestellt und vor der Veröffentlichung geprüft.",
  );

  const text = sentences.filter(Boolean).join(" ");
  // Only the boilerplate sentence means the source told us nothing usable.
  return sentences.filter(Boolean).length > 1 ? text : null;
}

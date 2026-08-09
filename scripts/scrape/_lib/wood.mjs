/**
 * Shared helpers for Wave-4 wood-supplier scrapers (Brennholz).
 *
 * - euroToCents: "1.234,56 €" / "1 234,56 €" -> 123456
 * - detectWoodType: map a title/html to a wood essence (Buche, Birke, Eiche, …)
 * - detectUnit: RM | SRM | Ster | Palette | Sack | Big Bag | Karton | kg
 * - detectLengthCm: "25 cm" | "30/33 cm" | "50 cm"
 * - detectMoisture: "kammergetrocknet" | "naturgetrocknet" | "trocken" | "frisch"
 * - pricePerUnit: "75,00 €/SRM" -> { cents, unit }
 * - buildWoodRecord: assemble the standard scraped record shape for wood
 */

const ESSENCES = [
  { re: /hainbuche/i, de: "Hainbuche" },
  { re: /rotbuche|buche/i, de: "Buche" },
  { re: /birke/i, de: "Birke" },
  { re: /eiche/i, de: "Eiche" },
  { re: /esche/i, de: "Esche" },
  { re: /erle/i, de: "Erle" },
  { re: /larche|lärche/i, de: "Lärche" },
  { re: /fichte/i, de: "Fichte" },
  { re: /kiefer/i, de: "Kiefer" },
  { re: /ahorn/i, de: "Ahorn" },
  { re: /robinie/i, de: "Robinie" },
  { re: /nadelholz/i, de: "Nadelholz" },
  { re: /hartholz/i, de: "Hartholz" },
  { re: /weichholz/i, de: "Weichholz" },
];

/** The named entities German shop templates actually emit. */
const NAMED_ENTITIES = {
  amp: "&",
  nbsp: " ",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  ndash: "\u2013",
  mdash: "\u2014",
  auml: "\u00e4",
  ouml: "\u00f6",
  uuml: "\u00fc",
  Auml: "\u00c4",
  Ouml: "\u00d6",
  Uuml: "\u00dc",
  szlig: "\u00df",
  euro: "\u20ac",
  deg: "\u00b0",
  times: "\u00d7",
  hellip: "\u2026",
};

function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => NAMED_ENTITIES[name] ?? match);
}

export function clean(value) {
  if (value == null) return "";
  // Decode after stripping tags so an entity-encoded angle bracket in the text
  // cannot be mistaken for markup, and before collapsing whitespace so a
  // decoded &nbsp; folds into the run next to it. WordPress stores product
  // names double-encoded (`&amp;#8211;`), hence the second pass.
  let text = String(value).replace(/[\u00ad\u202f]/g, "").replace(/<\/?[^>]+>/g, "");
  for (let pass = 0; pass < 2; pass++) {
    const decoded = decodeEntities(text);
    if (decoded === text) break;
    text = decoded;
  }
  return text.replace(/[\s\u00a0]+/g, " ").trim();
}

export function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/æ/g, "ae")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "1.234,56 €" | "1 234,56 €" | "1234,56" -> 123456 (int cents) or null */
export function euroToCents(value) {
  if (value == null || value === "") return null;
  const m = String(value).match(/(\d{1,3}(?:[.\s]\d{3})*,\d{2}|\d+,\d{2})/);
  if (!m) return null;
  const num = Number.parseFloat(m[1].replace(/[.\s]/g, "").replace(",", "."));
  return Number.isFinite(num) ? Math.round(num * 100) : null;
}

/** First price in html: "…1.234,56 €…" -> 123456 (first occurrence wins). */
export function firstPriceCents(html) {
  const m = String(html).match(/(\d{1,3}(?:[.\s]\d{3})*,\d{2})\s*€/);
  return m ? euroToCents(m[1]) : null;
}

/** "75,00 €/SRM" | "12,50 €/Sack" -> { cents, unit } */
export function pricePerUnit(html) {
  const m = String(html).match(
    /(\d{1,3}(?:[.\s]\d{3})*,\d{2})\s*€\s*\/\s*(RM|SRM|Ster|m3|m³|kg|Palette|Sack|Big\s*Bag|Karton)/i,
  );
  if (!m) return { cents: null, unit: null };
  return { cents: euroToCents(m[1]), unit: m[2].replace(/\s+/g, " ").toUpperCase() };
}

export function detectWoodType(text) {
  if (!text) return null;
  for (const e of ESSENCES) {
    if (e.re.test(text)) return e.de;
  }
  return null;
}

/**
 * What the listing actually sells. Firewood shops mix logs with kindling,
 * briquettes, smoking chips, delivery services and gift vouchers; each needs a
 * different catalogue category and some must not become products at all.
 *
 * Order matters: the most specific label wins.
 *
 * @returns {'wood'|'kindling'|'briquette'|'pellet'|'accessory'|'service'|'voucher'}
 */
export function detectProductKind(title, description = "") {
  const t = String(title ?? "");
  if (/gutschein|wärme schenken|warme schenken|geschenkkarte/i.test(t)) return "voucher";
  if (/lieferung|stapelservice|stapeln|montage|zustellung|anlieferung|service\b/i.test(t)) {
    return "service";
  }
  if (/räucher|raeucher|grillanzünder|grillanzuender|kaminanzünder|kaminanzuender|anzünder|anzuender|firecube|schwedenfeuer|feueranzünder|feueranzuender/i.test(t)) {
    return "accessory";
  }
  if (/anzündholz|anzuendholz|anfeuerholz|anmachholz|anzündspäne|kleinholz/i.test(t)) {
    return "kindling";
  }
  // Coal before briquettes: "Braunkohlebriketts" is coal, not a wood briquette,
  // and the two are not interchangeable in an appliance.
  //
  // "Anthrazit" is deliberately absent: in German it is far more often a paint
  // finish ("Kaminbesteck … Anthrazit") than a coal grade, and every real
  // anthracite listing also says Kohle.
  // A tool named after what it handles stays a tool: "Kohlenzange" is tongs.
  const coalTool = /zange|schaufel|eimer|korb\b|sieb|besteck|handschuh|rost\b|anzündkamin/i;
  if (/kohle|koks\b/i.test(t) && !coalTool.test(t)) return "coal";
  if (/brikett/i.test(t)) return "briquette";
  if (/pellet/i.test(t)) return "pellet";
  // A packaging word must not outrank the fuel it contains: "Buchen Nestro
  // Briketts – 12 kg Box" is a briquette, so `box` is only decisive once no
  // fuel has been named. "Fackel" is left out of the accessory rule above for
  // the same reason — "Buchen-Pellets … für Pellet-Smoker & Fackel" states a
  // use, not the product — and reaches `accessory` through the fallback.
  if (/box\b/i.test(t)) return "accessory";
  if (/brennholz|kaminholz|scheitholz|feuerholz|grillholz|pizzaofenholz|feuerschalenholz|stückholz|hartholz|weichholz|buche|birke|eiche|esche|erle|fichte|kiefer|hainbuche|mischholz|nadelholz|laubholz/i.test(t)) {
    return "wood";
  }
  // Fall back to the description only when the title carries no signal at all.
  if (/brennholz|kaminholz|scheitholz/i.test(String(description ?? ""))) return "wood";
  return "accessory";
}

export function detectUnit(text) {
  if (!text) return null;
  const value = String(text);

  // "36 Säcke à 40 L", "65 x 15 kg", "13 × 15 kg": the pack count and the size
  // of one pack. Read first, because the plain pattern below would stop at the
  // count and report "36 Säcke" without saying how much a sack holds.
  const pack = value.match(
    /\b(\d+)\s*(?:x|×|St(?:ü|ue)ck)?\s*(S(?:ä|ae)cke?|Kartons?|Beutel|Bündel|Buendel)?\s*(?:à|a|x|×)\s*(\d+(?:[.,]\d+)?)\s*(kg|l|liter|dm3|dm³)\b/i,
  );
  if (pack) {
    const container = pack[2]?.replace(/ae/i, "ä") ?? null;
    const rawSize = pack[4].toLowerCase() === "liter" ? "L" : pack[4];
    const size = `${pack[3].replace(".", ",")} ${rawSize}`;
    return {
      quantity: pack[1],
      unit: container ? `${container} à ${size}` : `× ${size}`,
    };
  }

  const m = value.match(/\b(\d+(?:[.,]\d+)?)\s*(RM|SRM|Ster|Raummeter|Schüttraummeter|Palette|Sack|Big\s*Bag|Karton|kg|m3|m³)\b/i);
  if (!m) return null;
  // Keep the German decimal comma: this string is shown as-is in the storefront.
  return { quantity: m[1].replace(".", ","), unit: m[2].replace(/\s+/g, " ") };
}

export function detectUnitLabel(text) {
  const d = detectUnit(text);
  return d ? `${d.quantity} ${d.unit}` : null;
}

/** "25 cm", "30/33 cm", "50 cm", "25-27 cm" -> "25 cm" style label or null */
export function detectLengthCm(text) {
  if (!text) return null;
  // \b prevents "100 cm" from being read as "00 cm".
  const m = String(text).match(/\b(\d{2,3}(?:[/-]\d{2,3})?)\s*cm\b/);
  return m ? m[1].replace(/\s+/g, "") : null;
}

export function detectMoisture(text) {
  if (!text) return null;
  if (/kammergetrocknet|kammertrocken/i.test(text)) return "kammergetrocknet";
  if (/naturgetrocknet|luftgetrocknet/i.test(text)) return "naturgetrocknet";
  if (/\bfrisch\b/i.test(text)) return "frisch";
  if (/\btrocken\b/i.test(text)) return "trocken";
  return null;
}

/**
 * Some shops render the same <h1> for several distinct offers (a 1,6 Rm pallet
 * and a 2 Rm B-Ware pallet both titled "Brennholz Buche 25 cm"). Slugs must stay
 * unique or the database upsert silently keeps only one of them, so collisions
 * are resolved with the offer's own URL segment.
 *
 * @param {Array<{slug:string, source:string, source_url:string}>} records mutated in place
 * @returns {Array} the same array
 */
export function dedupeSlugs(records) {
  const seen = new Set();
  for (const record of records) {
    if (!seen.has(record.slug)) {
      seen.add(record.slug);
      continue;
    }
    const segment = new URL(record.source_url).pathname.split("/").filter(Boolean).pop() ?? "";
    let candidate = `${record.source}-${slugify(segment)}`;
    let counter = 2;
    while (seen.has(candidate)) candidate = `${record.source}-${slugify(segment)}-${counter++}`;
    record.slug = candidate;
    seen.add(candidate);
  }
  return records;
}

/**
 * Build the standard wood record.
 * @param {object} p
 * @param {string} p.source        license key / scraper name
 * @param {string} p.sourceUrl
 * @param {string} p.contentHash
 * @param {string} p.brand         supplier brand (e.g. "Holzhof24")
 * @param {string} p.model         full product name
 * @param {number|null} p.priceCentsPublic
 * @param {string|null} p.priceTextRaw
 * @param {object} [p.extra]       extra technical fields
 * @param {string[]} [p.images]
 * @param {string[]} [p.pdfUrls]
 * @param {string|null} [p.description]
 */
export function buildWoodRecord(p) {
  // Fail closed: a scraper that forgets its license yields authorized:false.
  //
  // `text` is the right to publish the shop's own prose, which is separate from
  // the right to use its technical values: figures are facts, sentences are a
  // literary work (AGENTS.md). A scraper that passes neither keeps the old
  // behaviour of deriving the text right from the specs right.
  const licenseTxt = p.license?.text ?? p.license?.specs ?? { authorized: false };
  const licenseImg = p.license?.images ?? { authorized: false };
  const licensePdf = p.license?.pdf ?? { authorized: false };
  // Detect only from the product title. Descriptions mention other essences
  // ("wie Buche oder Esche"), other lengths and other pack sizes, which used to
  // leak into the typed fields (e.g. "Räucherpellets Apfel" -> Erle).
  const title = String(p.model ?? "");
  const description = p.extra?.description ?? null;
  const productKind = p.extra?.product_kind ?? detectProductKind(title, description);
  const isFirewood = productKind === "wood" || productKind === "kindling";

  // The shop's own property table is authoritative where it exists: briquettes
  // and pellets have no split length or essence in their title, but the table
  // states Holzart, Restfeuchte, Wassergehalt and Holzlänge.
  const specs = p.specs ?? {};
  const spec = (...names) => {
    for (const name of names) {
      const key = Object.keys(specs).find((k) => k.toLowerCase().startsWith(name.toLowerCase()));
      if (key && specs[key]) return specs[key];
    }
    return null;
  };

  const woodType = p.extra?.wood_type ?? spec("Holzart") ?? (isFirewood ? detectWoodType(title) : null);
  const unitInfo = detectUnit(title);
  const lengthCm = isFirewood ? detectLengthCm(title) : null;
  const declaredLength = spec("Holzlänge", "Scheitlänge", "Länge");
  const moisture =
    spec("Restfeuchte", "Wassergehalt") ?? (isFirewood ? detectMoisture(title) : null);
  const perUnit = pricePerUnit(p.priceTextRaw ?? "");

  return {
    source: p.source,
    source_url: p.sourceUrl,
    source_locale: "de-DE",
    scraped_at: new Date().toISOString(),
    content_hash: p.contentHash,
    type: "wood",
    product_kind: productKind,
    // Services and vouchers are listings, not catalogue products. `excluded` is
    // a free-form notes block in the manufacturer scrapers, so importers key on
    // this dedicated flag instead.
    skip_import:
      productKind === "service" || productKind === "voucher"
        ? `not a product (${productKind})`
        : null,
    brand: p.brand,
    model: p.model,
    slug: `${p.source}-${slugify(p.model)}`,
    identifiers: { ean: null, sku: null, hki_id: null, manufacturer_id: null },
    descriptions: {
      short_de: null,
      long_de_raw: p.extra?.description ?? null,
      long_de_authorized: licenseTxt.authorized,
    },
    technical: {
      extra: {
        wood_type: woodType,
        unit_de: unitInfo ? `${unitInfo.quantity} ${unitInfo.unit}` : null,
        length_de: lengthCm ? `${lengthCm} cm` : (declaredLength ?? null),
        moisture_de: moisture,
        quantity_de: unitInfo?.quantity ?? null,
        origin_de: p.extra?.origin_de ?? spec("Herkunft", "Nachhaltigkeit") ?? null,
        packaging_de: p.extra?.packaging_de ?? detectUnitLabel(title),
        // Everything the shop published, so the product page can show a real
        // table instead of a row of "Nicht angegeben".
        ...specs,
        ...(p.extra?.extra ?? {}),
      },
    },
    pricing: {
      currency: "EUR",
      vat_included: true,
      price_cents_public: p.priceCentsPublic ?? null,
      price_visible_on_source: p.priceCentsPublic != null,
      price_per_unit_cents: perUnit.cents,
      price_per_unit: perUnit.unit,
      price_text_raw: p.priceTextRaw ?? null,
      quote_mode: false,
    },
    media: {
      image_urls_source: p.images ?? [],
      licensed_to_download: licenseImg.authorized,
      downloaded_local_paths: [],
    },
    documents: {
      sources: (p.pdfUrls ?? []).map((url) => ({ url })),
      licensed_to_download: licensePdf.authorized,
      downloaded_local_paths: [],
    },
    authorized: licenseTxt.authorized && licenseImg.authorized,
    review_status: "pending",
  };
}



import "server-only";

/**
 * The German postcode table, used to confirm that a delivery address exists.
 *
 * Built by scripts/data/build-plz.mjs from the GeoNames export (CC BY 4.0).
 * It stays on the server: 330 kB has no business in a page bundle, and the
 * checkout only ever needs the one row the visitor typed.
 */

import table from "../../../data/geo/plz-de.json";

interface PostcodeTable {
  generated_at: string;
  source: string;
  license: string;
  count: number;
  /** `[city, stateCode]`. TypeScript widens the imported JSON to string[]. */
  places: Record<string, string[]>;
}

const data = table as PostcodeTable;

/** Bundesland names for the two-letter codes GeoNames uses. */
const STATE_NAMES: Record<string, string> = {
  BW: "Baden-Württemberg",
  BY: "Bayern",
  BE: "Berlin",
  BB: "Brandenburg",
  HB: "Bremen",
  HH: "Hamburg",
  HE: "Hessen",
  MV: "Mecklenburg-Vorpommern",
  NI: "Niedersachsen",
  NW: "Nordrhein-Westfalen",
  RP: "Rheinland-Pfalz",
  SL: "Saarland",
  SN: "Sachsen",
  ST: "Sachsen-Anhalt",
  SH: "Schleswig-Holstein",
  TH: "Thüringen",
};

export interface PostcodePlace {
  postcode: string;
  city: string;
  stateCode: string;
  state: string;
}

export const POSTCODE_COUNT = data.count;
export const POSTCODE_ATTRIBUTION = data.license;

export function lookupPostcode(input: string): PostcodePlace | null {
  const postcode = input.trim();
  if (!/^\d{5}$/.test(postcode)) return null;
  const entry = data.places[postcode];
  const city = entry?.[0];
  if (!city) return null;
  const stateCode = entry[1] ?? "";
  return { postcode, city, stateCode, state: STATE_NAMES[stateCode] ?? stateCode };
}

/**
 * Postcodes starting with `prefix`, for the checkout's suggestion list.
 * Capped because a one-digit prefix matches over a thousand rows.
 */
export function searchPostcodes(prefix: string, limit = 8): PostcodePlace[] {
  const clean = prefix.trim();
  if (!/^\d{2,5}$/.test(clean)) return [];
  const out: PostcodePlace[] = [];
  for (const postcode of Object.keys(data.places)) {
    if (!postcode.startsWith(clean)) continue;
    const found = lookupPostcode(postcode);
    if (found) out.push(found);
    if (out.length >= limit) break;
  }
  return out;
}

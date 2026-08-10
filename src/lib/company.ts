import { BRAND_NAME } from "@/lib/brand";

/**
 * The operating company behind the shop.
 *
 * These are the defaults every legal page falls back to. An admin can override
 * any of them through `site_settings`, which is why the pages read that table
 * first — but the shop must never render an Impressum with nothing in it, so
 * what the company has confirmed lives here in code.
 *
 * `null` means "not supplied yet", and it is load-bearing. § 5 DDG makes the
 * address, a means of fast electronic contact and the representative's name
 * mandatory for a GmbH; a plausible-looking invention would be worse than a
 * visible gap, because only the gap gets fixed. Pages render a marked
 * placeholder for every null and the Impressum warns while any remain.
 */
export interface CompanyProfile {
  name: string;
  legalForm: string;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  state: string;
  countryCode: string;
  country: string;
  email: string | null;
  supportEmail: string | null;
  phone: string | null;
  managingDirector: string | null;
  registerCourt: string;
  commercialRegister: string;
  vatId: string | null;
  taxNumber: string | null;
  social: {
    facebook: string | null;
    instagram: string | null;
    tiktok: string | null;
    linkedin: string | null;
    youtube: string | null;
  };
}

export const COMPANY: CompanyProfile = {
  name: "Holz Direkt GmbH",
  legalForm: "GmbH",
  street: "Bergweg 24",
  postalCode: "48485",
  city: "Neuenkirchen",
  state: "Nordrhein-Westfalen",
  countryCode: "DE",
  country: "Deutschland",
  email: "kontakt@holzdirekt.store",
  supportEmail: null,
  phone: "+49 1521 6824424",
  managingDirector: null,
  registerCourt: "Amtsgericht Steinfurt",
  commercialRegister: "HRB 3447",
  vatId: null,
  taxNumber: null,
  social: {
    facebook: "https://www.facebook.com/profile.php?id=61592760945569",
    instagram: null,
    tiktok: "https://www.tiktok.com/@holz_direkt",
    linkedin: null,
    youtube: null,
  },
};

/** The trading name shown to customers. The GmbH is the contracting party. */
export const TRADING_NAME = BRAND_NAME;

/**
 * Fields § 5 DDG requires that the profile does not yet carry. The Impressum
 * keeps its warning banner for as long as this is non-empty.
 */
export function missingMandatoryFields(company: CompanyProfile): string[] {
  const missing: string[] = [];
  if (!company.street || !company.postalCode || !company.city) {
    missing.push("Ladungsfähige Anschrift");
  }
  if (!company.email) missing.push("E-Mail-Adresse");
  if (!company.managingDirector) missing.push("Vertretungsberechtigte Person");
  if (!company.vatId) missing.push("Umsatzsteuer-Identifikationsnummer");
  return missing;
}

/** Renders a value, or a marked gap that cannot be mistaken for real data. */
export function orGap(value: string | null | undefined): string {
  return value && value.trim() ? value : "— noch zu ergänzen —";
}

/**
 * A `wa.me` link for the company phone, or null if there is no number.
 *
 * wa.me wants digits only in full international form — no `+`, spaces or
 * dashes — and silently shows "phone number shared via url is invalid" for
 * anything else. A number that is not international (no leading `+` or `00`)
 * is refused rather than guessed at, since prefixing the wrong country code
 * sends the customer to a stranger.
 */
export function whatsappHref(company: CompanyProfile, message?: string): string | null {
  const raw = company.phone?.trim();
  if (!raw) return null;
  if (!raw.startsWith("+") && !raw.startsWith("00")) return null;
  const digits = raw.replace(/\D/g, "").replace(/^00/, "");
  if (digits.length < 8) return null;
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}

/** `Straße 1, 48431 Rheine` with whatever parts exist. */
export function formatAddressLine(company: CompanyProfile): string {
  const parts = [
    company.street,
    [company.postalCode, company.city].filter(Boolean).join(" ") || null,
    company.country,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 1 ? parts.join(", ") : orGap(null);
}

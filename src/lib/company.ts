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
}

export const COMPANY: CompanyProfile = {
  name: "Holz Direkt GmbH",
  legalForm: "GmbH",
  street: null,
  postalCode: null,
  city: null,
  state: "Nordrhein-Westfalen",
  countryCode: "DE",
  country: "Deutschland",
  email: null,
  supportEmail: null,
  phone: "+49 1521 6824424",
  managingDirector: null,
  registerCourt: "Amtsgericht Steinfurt",
  commercialRegister: "HRB 3447",
  vatId: null,
  taxNumber: null,
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

/** `Straße 1, 48431 Rheine` with whatever parts exist. */
export function formatAddressLine(company: CompanyProfile): string {
  const parts = [
    company.street,
    [company.postalCode, company.city].filter(Boolean).join(" ") || null,
    company.country,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 1 ? parts.join(", ") : orGap(null);
}

import "server-only";

/**
 * Fill `[shortcode]` placeholders in CMS content with live company data.
 *
 * Legal pages and articles are written once and must stay correct when the
 * company details change, so instead of hard-coding an address into every page,
 * an editor writes `[company_name]` and it is replaced at render time.
 *
 * Resolution order is settings first, then the confirmed company profile in
 * code. An admin edit therefore always wins, but a column nobody has filled in
 * yet still renders what the company has confirmed rather than a blank.
 *
 * A shortcode with no value anywhere resolves to a visible gap marker, never to
 * an empty string: a missing IBAN that silently disappears from a payment page
 * is worse than one that says it is missing.
 */

import { COMPANY, orGap, TRADING_NAME } from "@/lib/company";
import { getMigrationAwarePublicSupabase } from "@/lib/db/server";
import { getSiteSettings } from "@/lib/settings-server";
import type { PaymentSettingsRow } from "@/lib/payments/config";
import type { SiteSettingsRow } from "@/lib/db/types";
import {
  FREE_SHIPPING_FROM_CENTS,
  ISLAND_SURCHARGE_CENTS,
  SHIPPING_RATES,
} from "@/lib/shipping/rates";
import { POSTCODE_COUNT } from "@/lib/shipping/postcodes";
import { formatPrice } from "@/lib/utils";

/** Shortcodes backed by a `site_settings` column, with a code-level fallback. */
const SETTINGS_FIELDS: Record<string, [keyof SiteSettingsRow, string | null]> = {
  company_name: ["company_name", COMPANY.name],
  legal_form: ["legal_form", COMPANY.legalForm],
  street: ["street", COMPANY.street],
  postal_code: ["postal_code", COMPANY.postalCode],
  city: ["city", COMPANY.city],
  phone: ["phone", COMPANY.phone],
  phone_secondary: ["phone_secondary", null],
  email: ["email", COMPANY.email],
  support_email: ["support_email", COMPANY.supportEmail],
  vat_id: ["vat_id", COMPANY.vatId],
  tax_number: ["tax_number", COMPANY.taxNumber],
  commercial_register: ["commercial_register", COMPANY.commercialRegister],
  register_court: ["register_court", COMPANY.registerCourt],
  managing_director: ["managing_director", COMPANY.managingDirector],
  support_hours: ["support_hours", null],
};

/** Shortcodes backed by `payment_settings`. Public-safe fields only. */
const PAYMENT_FIELDS: Record<string, keyof PaymentSettingsRow> = {
  bank_account_holder: "bank_account_holder",
  bank_iban: "bank_iban",
  bank_bic: "bank_bic",
  bank_name: "bank_name",
  bank_reference_prefix: "bank_reference_prefix",
};

/**
 * Shipping figures, so a legal text quoting a rate can never disagree with the
 * rate the checkout charges. These come from code, not settings — changing a
 * tariff is a deploy, not a content edit.
 */
const SHIPPING_VALUES: Record<string, () => string> = {
  shipping_parcel: () => formatPrice(SHIPPING_RATES.parcel),
  shipping_freight: () => formatPrice(SHIPPING_RATES.freight),
  shipping_bulky: () => formatPrice(SHIPPING_RATES.bulky),
  island_surcharge: () => formatPrice(ISLAND_SURCHARGE_CENTS),
  free_shipping_from: () => formatPrice(FREE_SHIPPING_FROM_CENTS),
  postcode_count: () => POSTCODE_COUNT.toLocaleString("de-DE"),
};

/** The shortcodes an editor can use, for the admin hint list. */
export const AVAILABLE_SHORTCODES = [
  ...Object.keys(SETTINGS_FIELDS),
  ...Object.keys(PAYMENT_FIELDS),
  ...Object.keys(SHIPPING_VALUES),
  "company_full",
  "address",
  "trading_name",
  "state",
  "country",
  "year",
];

let cache: {
  settings: SiteSettingsRow | null;
  payment: PaymentSettingsRow | null;
  at: number;
} | null = null;
const TTL_MS = 60_000;

async function load() {
  if (cache && Date.now() - cache.at < TTL_MS) return cache;
  const supabase = getMigrationAwarePublicSupabase();
  const [settings, payment] = await Promise.all([
    // Deduped with the layout, footer and company profile.
    getSiteSettings(),
    supabase
      .from("payment_settings")
      .select("bank_account_holder,bank_iban,bank_bic,bank_name,bank_reference_prefix")
      .eq("id", 1)
      .maybeSingle(),
  ]);
  cache = {
    settings,
    payment: (payment.data as PaymentSettingsRow | null) ?? null,
    at: Date.now(),
  };
  return cache;
}

/** Drops the memoised settings so an admin save shows up on the next render. */
export function invalidateShortcodeCache() {
  cache = null;
}

function read(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

/** Replace every `[tag]` with its live value, leaving unknown tags untouched. */
export async function expandShortcodes(text: string): Promise<string> {
  if (!text.includes("[")) return text;

  let settings: SiteSettingsRow | null = null;
  let payment: PaymentSettingsRow | null = null;
  try {
    const loaded = await load();
    settings = loaded.settings;
    payment = loaded.payment;
  } catch {
    // A database that is unreachable must not take the legal pages with it;
    // fall through to the code-level company profile.
  }

  const resolve = (name: string): string | null | undefined => {
    const settingsField = SETTINGS_FIELDS[name];
    if (settingsField) {
      const [column, fallback] = settingsField;
      return read(settings?.[column]) ?? fallback;
    }
    const paymentField = PAYMENT_FIELDS[name];
    if (paymentField) return read(payment?.[paymentField]);

    const shipping = SHIPPING_VALUES[name];
    if (shipping) return shipping();

    switch (name) {
      case "trading_name":
        return TRADING_NAME;
      case "state":
        return COMPANY.state;
      case "country":
        return COMPANY.country;
      case "year":
        return String(new Date().getFullYear());
      case "company_full":
        return read(settings?.company_name) ?? COMPANY.name;
      case "address": {
        const street = read(settings?.street) ?? COMPANY.street;
        const postal = read(settings?.postal_code) ?? COMPANY.postalCode;
        const city = read(settings?.city) ?? COMPANY.city;
        const line = [street, [postal, city].filter(Boolean).join(" ") || null]
          .filter(Boolean)
          .join(", ");
        return line || null;
      }
      default:
        return undefined; // not a shortcode we know
    }
  };

  return text.replace(/\[([a-z_]+)\]/g, (whole, name: string) => {
    const value = resolve(name);
    if (value === undefined) return whole; // unknown tag: leave as written
    return orGap(value);
  });
}

import "server-only";

/**
 * Fill `[shortcode]` placeholders in CMS content with live company data.
 *
 * Legal pages and articles are written once and must stay correct when the
 * company details change, so instead of hard-coding an address into every page,
 * an editor writes `[company_name]` and it is replaced at render time from
 * site_settings. A shortcode that has no value resolves to an empty string, so
 * an unset field never leaves a raw `[tag]` in the text.
 */

import { getMigrationAwarePublicSupabase } from "@/lib/db/server";
import type { SiteSettingsRow } from "@/lib/db/types";

/** The shortcode name a customer/editor may use, mapped to the settings field. */
const SHORTCODE_FIELDS: Record<string, keyof SiteSettingsRow> = {
  company_name: "company_name",
  legal_form: "legal_form",
  street: "street",
  postal_code: "postal_code",
  city: "city",
  phone: "phone",
  email: "email",
  support_email: "support_email",
  vat_id: "vat_id",
  tax_number: "tax_number",
  commercial_register: "commercial_register",
  register_court: "register_court",
  managing_director: "managing_director",
};

/** The shortcodes an editor can use, for the admin hint list. */
export const AVAILABLE_SHORTCODES = Object.keys(SHORTCODE_FIELDS);

/** Composite shortcodes built from several fields. */
function composites(settings: SiteSettingsRow): Record<string, string> {
  const address = [
    settings.street,
    [settings.postal_code, settings.city].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
  return {
    company_full: [settings.company_name, settings.legal_form].filter(Boolean).join(" "),
    address,
    year: String(new Date().getFullYear()),
  };
}

let cache: { settings: SiteSettingsRow | null; at: number } | null = null;
const TTL_MS = 60_000;

async function loadSettings(): Promise<SiteSettingsRow | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.settings;
  const supabase = getMigrationAwarePublicSupabase();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  cache = { settings: (data as SiteSettingsRow | null) ?? null, at: Date.now() };
  return cache.settings;
}

/** Replace every `[tag]` with its live value, leaving unknown tags untouched. */
export async function expandShortcodes(text: string): Promise<string> {
  if (!text.includes("[")) return text;
  const settings = await loadSettings();
  if (!settings) return text;

  const composite = composites(settings);
  return text.replace(/\[([a-z_]+)\]/g, (whole, name: string) => {
    if (name in composite) return composite[name] ?? "";
    const field = SHORTCODE_FIELDS[name];
    if (!field) return whole; // unknown tag: leave as written
    const value = settings[field];
    return value == null ? "" : String(value);
  });
}

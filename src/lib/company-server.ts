import "server-only";

import { COMPANY, type CompanyProfile } from "@/lib/company";
import { getMigrationAwarePublicSupabase } from "@/lib/db/server";
import type { SiteSettingsRow } from "@/lib/db/types";

/**
 * The company profile the legal pages render.
 *
 * `site_settings` wins field by field so an admin can correct the Impressum
 * without a deploy, but an empty column never blanks out a value the code
 * already knows. A read failure falls back to the code profile rather than
 * taking the legal pages down with it.
 */
export async function getCompany(): Promise<CompanyProfile> {
  let settings: Partial<SiteSettingsRow> | null = null;
  try {
    const { data } = await getMigrationAwarePublicSupabase()
      .from("site_settings")
      .select(
        "company_name,legal_form,street,postal_code,city,country_code,phone,email,support_email,vat_id,tax_number,commercial_register,register_court,managing_director",
      )
      .eq("id", 1)
      .maybeSingle();
    settings = data as Partial<SiteSettingsRow> | null;
  } catch {
    settings = null;
  }

  const pick = (value: string | null | undefined, fallback: string | null) => {
    const trimmed = typeof value === "string" ? value.trim() : "";
    return trimmed || fallback;
  };

  return {
    ...COMPANY,
    name: pick(settings?.company_name, COMPANY.name) ?? COMPANY.name,
    legalForm: pick(settings?.legal_form, COMPANY.legalForm) ?? COMPANY.legalForm,
    street: pick(settings?.street, COMPANY.street),
    postalCode: pick(settings?.postal_code, COMPANY.postalCode),
    city: pick(settings?.city, COMPANY.city),
    phone: pick(settings?.phone, COMPANY.phone),
    email: pick(settings?.email, COMPANY.email),
    supportEmail: pick(settings?.support_email, COMPANY.supportEmail),
    vatId: pick(settings?.vat_id, COMPANY.vatId),
    taxNumber: pick(settings?.tax_number, COMPANY.taxNumber),
    commercialRegister:
      pick(settings?.commercial_register, COMPANY.commercialRegister) ??
      COMPANY.commercialRegister,
    registerCourt: pick(settings?.register_court, COMPANY.registerCourt) ?? COMPANY.registerCourt,
    managingDirector: pick(settings?.managing_director, COMPANY.managingDirector),
  };
}

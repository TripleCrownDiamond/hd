// Seed the confirmed company profile into site_settings so legal pages,
// invoices and the footer carry the real data. Fields the company has not
// supplied yet (tax_number, managing_director) stay NULL — never invented.
// Run: set -a; source .env.local; set +a; node scripts/db/_seed-company.mjs
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

const patch = {
  company_name: "holz direkt GmbH - Holzimport",
  legal_form: "GmbH",
  street: "Bergweg 24",
  postal_code: "48485",
  city: "Neuenkirchen",
  country_code: "DE",
  email: "kontakt@holzdirekt.store",
  phone: "+49 1521 6824424",
  commercial_register: "HRB 3447",
  register_court: "Amtsgericht Steinfurt",
  vat_id: "DE813362690",
  // tax_number, managing_director: intentionally NOT set (unconfirmed)
};

const { data, error } = await supabase.from("site_settings").update(patch).eq("id", 1).select();
if (error) throw new Error(`seed failed: ${error.message}`);
console.log("site_settings updated:", data?.[0]?.company_name, "| vat_id:", data?.[0]?.vat_id ?? "(null)");

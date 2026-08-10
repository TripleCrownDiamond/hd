import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { AdminHeader, Field, fieldClass } from "@/components/admin/admin-ui";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveSiteSettings } from "../actions";

const fields = [
  ["company_name","Firmenname"],["legal_form","Rechtsform"],["street","Straße und Hausnummer"],["postal_code","PLZ"],["city","Ort"],["country_code","Ländercode"],
  ["phone","Telefon"],["phone_secondary","Weiteres Telefon"],["email","E-Mail"],["support_email","Support-E-Mail"],
  ["vat_id","USt-IdNr."],["tax_number","Steuernummer"],["commercial_register","Handelsregisternummer"],["register_court","Registergericht"],["managing_director","Vertretungsberechtigte Person"],
  ["social_facebook","Facebook-URL"],["social_tiktok","TikTok-URL"],["social_instagram","Instagram-URL"],["social_linkedin","LinkedIn-URL"],["social_youtube","YouTube-URL"],
  ["logo_url","Logo-URL (optional)"],["invoice_prefix","Rechnungspräfix"],["invoice_footer","Rechnungsfußzeile"],["chatbot_name","Name des Assistenten"],["support_hours","Support-Zeiten"],
] as const;

export default async function SettingsAdminPage() {
  const supabase = await getMigrationAwareServerSupabase();
  const { data: settings } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return <div className="space-y-8"><AdminHeader eyebrow="Storefront" title="Website-Einstellungen" description="Leere Angaben werden im Store nicht angezeigt. Rechtliche Nummern niemals mit Beispieldaten füllen." /><Card><CardContent className="pt-6"><form action={saveSiteSettings} className="grid gap-4 md:grid-cols-2">{fields.map(([name,label]) => <Field key={name} label={label}><input name={name} defaultValue={settings?.[name] ?? ""} className={fieldClass} /></Field>)}
    <Field label="Zahlungsziel (Tage)"><input className={fieldClass} name="invoice_payment_terms_days" type="number" min="0" max="365" defaultValue={settings?.invoice_payment_terms_days ?? 14} /></Field><Field label="Rechnung auslösen"><select className={fieldClass} name="invoice_trigger" defaultValue={settings?.invoice_trigger ?? "manual"}><option value="manual">Manuell</option><option value="order">Bei Bestellung</option><option value="payment">Bei Zahlung</option><option value="shipment">Bei Versand</option></select></Field>
    <Field label="Erste Warenkorb-Erinnerung (Minuten)"><input className={fieldClass} name="cart_recovery_first_delay_minutes" type="number" min="30" defaultValue={settings?.cart_recovery_first_delay_minutes ?? 60} /></Field><Field label="Zweite Erinnerung (Minuten)"><input className={fieldClass} name="cart_recovery_second_delay_minutes" type="number" min="60" defaultValue={settings?.cart_recovery_second_delay_minutes ?? 1440} /></Field><Field label="Maximale Erinnerungen"><input className={fieldClass} name="cart_recovery_max_reminders" type="number" min="1" max="3" defaultValue={settings?.cart_recovery_max_reminders ?? 2} /></Field>
    <label className="text-text flex items-center gap-2 text-sm"><input type="checkbox" name="newsletter_enabled" defaultChecked={settings?.newsletter_enabled ?? false} /> Newsletter anzeigen</label><label className="text-text flex items-center gap-2 text-sm"><input type="checkbox" name="chatbot_enabled" defaultChecked={settings?.chatbot_enabled ?? false} /> KI-Assistent aktivieren</label><label className="text-text flex items-center gap-2 text-sm"><input type="checkbox" name="cart_recovery_enabled" defaultChecked={settings?.cart_recovery_enabled ?? false} /> Einwilligungsbasierte Warenkorb-Erinnerung aktivieren</label><div className="md:col-span-2"><Button type="submit">Einstellungen speichern</Button></div></form></CardContent></Card></div>;
}

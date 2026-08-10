import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { AdminHeader, Field, fieldClass } from "@/components/admin/admin-ui";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveSiteSettings } from "../actions";

const fields = [
  ["company_name","Nom de l'entreprise"],["legal_form","Forme juridique"],["street","Rue et numéro"],["postal_code","Code postal"],["city","Ville"],["country_code","Code pays"],
  ["phone","Téléphone"],["phone_secondary","Téléphone secondaire"],["email","E-mail"],["support_email","E-mail support"],
  ["vat_id","N° TVA (USt-IdNr.)"],["tax_number","N° fiscal"],["commercial_register","N° de registre du commerce"],["register_court","Tribunal d'enregistrement"],["managing_director","Personne habilitée à représenter"],
  ["social_facebook","URL Facebook"],["social_tiktok","URL TikTok"],["social_instagram","URL Instagram"],["social_linkedin","URL LinkedIn"],["social_youtube","URL YouTube"],
  ["logo_url","URL du logo (facultatif)"],["invoice_prefix","Préfixe de facture"],["invoice_footer","Pied de page de facture"],["chatbot_name","Nom de l'assistant"],["support_hours","Horaires de support"],
] as const;

export default async function SettingsAdminPage() {
  const supabase = await getMigrationAwareServerSupabase();
  const { data: settings } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return <div className="space-y-8"><AdminHeader eyebrow="Boutique" title="Réglages du site" description="Les champs vides ne sont pas affichés dans la boutique. Ne jamais remplir les numéros juridiques avec des données d'exemple." /><Card><CardContent className="pt-6"><form action={saveSiteSettings} className="grid gap-4 md:grid-cols-2">{fields.map(([name,label]) => <Field key={name} label={label}><input name={name} defaultValue={settings?.[name] ?? ""} className={fieldClass} /></Field>)}
    <Field label="Délai de paiement des factures (jours)"><input className={fieldClass} name="invoice_payment_terms_days" type="number" min="0" max="365" defaultValue={settings?.invoice_payment_terms_days ?? 14} /></Field><Field label="Émettre la facture"><select className={fieldClass} name="invoice_trigger" defaultValue={settings?.invoice_trigger ?? "manual"}><option value="manual">Manuellement</option><option value="order">À la commande</option><option value="payment">Au paiement</option><option value="shipment">À l’expédition</option></select></Field>
    <Field label="Première relance panier (minutes)"><input className={fieldClass} name="cart_recovery_first_delay_minutes" type="number" min="30" defaultValue={settings?.cart_recovery_first_delay_minutes ?? 60} /></Field><Field label="Deuxième relance (minutes)"><input className={fieldClass} name="cart_recovery_second_delay_minutes" type="number" min="60" defaultValue={settings?.cart_recovery_second_delay_minutes ?? 1440} /></Field><Field label="Relances maximales"><input className={fieldClass} name="cart_recovery_max_reminders" type="number" min="1" max="3" defaultValue={settings?.cart_recovery_max_reminders ?? 2} /></Field>
    <label className="text-text flex items-center gap-2 text-sm"><input type="checkbox" name="newsletter_enabled" defaultChecked={settings?.newsletter_enabled ?? false} /> Afficher la newsletter</label><label className="text-text flex items-center gap-2 text-sm"><input type="checkbox" name="chatbot_enabled" defaultChecked={settings?.chatbot_enabled ?? false} /> Activer l’assistant IA</label><label className="text-text flex items-center gap-2 text-sm"><input type="checkbox" name="cart_recovery_enabled" defaultChecked={settings?.cart_recovery_enabled ?? false} /> Activer la relance panier sur consentement</label><div className="md:col-span-2"><Button type="submit">Enregistrer les réglages</Button></div></form></CardContent></Card></div>;
}

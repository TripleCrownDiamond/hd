import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { AdminHeader, Field, fieldClass, areaClass } from "@/components/admin/admin-ui";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CRYPTO_CHOICES, type PaymentSettingsRow } from "@/lib/payments/config";
import { savePaymentSettings } from "../actions";

export const dynamic = "force-dynamic";

const CARD_PROVIDERS = ["stripe", "mollie", "adyen"];
const CRYPTO_PROVIDERS = ["btcpay", "coinbase", "bitpay"];

export default async function PaymentSettingsAdminPage() {
  const supabase = await getMigrationAwareServerSupabase();
  const { data } = await supabase.from("payment_settings").select("*").eq("id", 1).maybeSingle();
  const settings = (data as PaymentSettingsRow | null) ?? null;
  const selectedCurrencies = new Set(settings?.crypto_currencies ?? []);

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Storefront"
        title="Zahlungsarten"
        description="Nur aktivierte und vollständig konfigurierte Methoden erscheinen an der Kasse. Geheime Schlüssel (Stripe Secret Key, BTCPay API Key) gehören in die Server-Umgebung, nicht hierher."
      />

      <form action={savePaymentSettings} className="space-y-6">
        {/* Bank transfer */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <label className="text-text flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="bank_transfer_enabled"
                defaultChecked={settings?.bank_transfer_enabled ?? false}
              />
              Überweisung anbieten
            </label>
            <p className="text-muted text-sm">
              Ohne externen Anbieter. Der Kunde erhält Kontodaten und eine Referenz; die Bestellung
              wartet auf Ihren Zahlungsabgleich.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Kontoinhaber">
                <input
                  name="bank_account_holder"
                  defaultValue={settings?.bank_account_holder ?? ""}
                  className={fieldClass}
                />
              </Field>
              <Field label="IBAN">
                <input
                  name="bank_iban"
                  defaultValue={settings?.bank_iban ?? ""}
                  placeholder="DE00 0000 0000 0000 0000 00"
                  className={fieldClass}
                />
              </Field>
              <Field label="BIC">
                <input name="bank_bic" defaultValue={settings?.bank_bic ?? ""} className={fieldClass} />
              </Field>
              <Field label="Bank">
                <input name="bank_name" defaultValue={settings?.bank_name ?? ""} className={fieldClass} />
              </Field>
              <Field label="Referenz-Präfix" hint="z. B. HK → HK-2026-000123">
                <input
                  name="bank_reference_prefix"
                  defaultValue={settings?.bank_reference_prefix ?? "HK"}
                  maxLength={6}
                  className={fieldClass}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Card */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <label className="text-text flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="card_enabled" defaultChecked={settings?.card_enabled ?? false} />
              Kreditkarte anbieten
            </label>
            <p className="text-muted text-sm">
              Über einen Zahlungsdienstleister, der die Karte im Browser tokenisiert. Es wird nur der
              öffentliche Publishable Key gespeichert; der Secret Key bleibt in der Server-Umgebung
              (<code>STRIPE_SECRET_KEY</code>).
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Anbieter">
                <select name="card_provider" defaultValue={settings?.card_provider ?? ""} className={fieldClass}>
                  <option value="">— wählen —</option>
                  {CARD_PROVIDERS.map((provider) => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Publishable Key" hint="öffentlicher Schlüssel, z. B. pk_live_…">
                <input
                  name="card_publishable_key"
                  defaultValue={settings?.card_publishable_key ?? ""}
                  className={fieldClass}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Hinweis an den Kunden (optional)">
                  <textarea name="card_note" defaultValue={settings?.card_note ?? ""} className={areaClass} />
                </Field>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Crypto */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <label className="text-text flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="crypto_enabled" defaultChecked={settings?.crypto_enabled ?? false} />
              Kryptowährung anbieten
            </label>
            <p className="text-muted text-sm">
              Über einen Anbieter, der die Adresse erzeugt und die Zahlung on-chain bestätigt. Wir
              verwahren weder Schlüssel noch Guthaben. Der API-Schlüssel des Anbieters gehört in die
              Server-Umgebung.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Anbieter">
                <select name="crypto_provider" defaultValue={settings?.crypto_provider ?? ""} className={fieldClass}>
                  <option value="">— wählen —</option>
                  {CRYPTO_PROVIDERS.map((provider) => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Anbieter-URL" hint="z. B. Ihre BTCPay-Server-Instanz">
                <input
                  name="crypto_provider_url"
                  defaultValue={settings?.crypto_provider_url ?? ""}
                  className={fieldClass}
                />
              </Field>
            </div>
            <fieldset className="grid gap-2">
              <legend className="text-text text-sm font-medium">Akzeptierte Währungen</legend>
              <div className="flex flex-wrap gap-3">
                {CRYPTO_CHOICES.map((currency) => (
                  <label key={currency} className="text-text flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="crypto_currencies"
                      value={currency}
                      defaultChecked={selectedCurrencies.has(currency)}
                    />
                    {currency}
                  </label>
                ))}
              </div>
            </fieldset>
            <Field label="Hinweis an den Kunden (optional)">
              <textarea name="crypto_note" defaultValue={settings?.crypto_note ?? ""} className={areaClass} />
            </Field>
          </CardContent>
        </Card>

        <Button type="submit">Zahlungsarten speichern</Button>
      </form>
    </div>
  );
}

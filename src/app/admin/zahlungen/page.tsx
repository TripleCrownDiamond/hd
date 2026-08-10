import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { AdminHeader, Field, fieldClass, areaClass } from "@/components/admin/admin-ui";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CRYPTO_CHOICES,
  isPlaceholderBankData,
  type PaymentSettingsRow,
} from "@/lib/payments/config";
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
        eyebrow="Boutique"
        title="Moyens de paiement"
        description="Seules les méthodes activées et entièrement configurées apparaissent à la caisse. Les clés secrètes (Stripe Secret Key, BTCPay API Key) appartiennent à l’environnement serveur, pas ici."
      />

      {settings &&
        isPlaceholderBankData({
          method: "bank_transfer",
          accountHolder: settings.bank_account_holder ?? "",
          iban: settings.bank_iban ?? "",
          bic: settings.bank_bic,
          bankName: settings.bank_name,
        }) && (
          <div
            role="status"
            className="border-warning/40 bg-warning/5 text-text rounded-lg border p-4 text-sm"
          >
            <strong className="font-semibold">Coordonnées bancaires provisoires actives.</strong>{" "}Le virement utilise encore les valeurs par défaut. Remplacez l’IBAN et le titulaire par un vrai compte avant que la boutique ne prenne des commandes réelles. Tant que le placeholder est en place, les clients voient « Coordonnées bancaires par e-mail » après leur commande, au lieu d’un compte.
          </div>
        )}

      <form action={savePaymentSettings} className="space-y-6">
        {/* Virement */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <label className="text-text flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="bank_transfer_enabled"
                defaultChecked={settings?.bank_transfer_enabled ?? false}
              />
              Proposer le virement (Überweisung)
            </label>
            <p className="text-muted text-sm">
              Sans prestataire externe. Le client reçoit les coordonnées et une référence ; la
              commande attend votre rapprochement de paiement.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Titulaire du compte">
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
              <Field label="Banque">
                <input name="bank_name" defaultValue={settings?.bank_name ?? ""} className={fieldClass} />
              </Field>
              <Field label="Préfixe de référence" hint="ex. HK → HK-2026-000123">
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

        {/* Acompte (Anzahlung) */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <label className="text-text flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="deposit_enabled"
                defaultChecked={settings?.deposit_enabled ?? true}
              />
              Proposer l&apos;acompte (Anzahlung)
            </label>
            <p className="text-muted text-sm">
              Au-dessus du seuil, le client paie un pourcentage de la somme par virement et le reste
              après livraison. L&apos;acompte apparaît à la caisse, sur la page de confirmation, dans
              l&apos;e-mail et sur la facture. Il exige un virement activé avec un vrai compte bancaire ;
              désactivé, il disparaît de la caisse.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Montant minimum (€)" hint="défaut 10 000 — en dessous, pas d'acompte à la caisse">
                <input
                  name="deposit_min"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={((settings?.deposit_min_cents ?? 1_000_000) / 100).toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}
                  className={fieldClass}
                />
              </Field>
              <Field label="Pourcentage de l'acompte (%)" hint="défaut 30">
                <input
                  name="deposit_percent"
                  type="number"
                  min="1"
                  max="100"
                  defaultValue={settings?.deposit_percent ?? 30}
                  className={fieldClass}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Carte */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <label className="text-text flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="card_enabled" defaultChecked={settings?.card_enabled ?? false} />
              Proposer la carte bancaire
            </label>
            <p className="text-muted text-sm">
              Via un prestataire de paiement qui tokenise la carte dans le navigateur. Seule la clé
              publishable est stockée ; la clé secrète reste dans l’environnement serveur (
              <code>STRIPE_SECRET_KEY</code>).
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Prestataire">
                <select name="card_provider" defaultValue={settings?.card_provider ?? ""} className={fieldClass}>
                  <option value="">— choisir —</option>
                  {CARD_PROVIDERS.map((provider) => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Clé publishable" hint="clé publique, ex. pk_live_…">
                <input
                  name="card_publishable_key"
                  defaultValue={settings?.card_publishable_key ?? ""}
                  className={fieldClass}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Note au client (facultatif)">
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
              Proposer la cryptomonnaie
            </label>
            <p className="text-muted text-sm">
              Via un prestataire qui génère l’adresse et confirme le paiement on-chain. Nous ne
              détenons ni clés ni fonds. La clé API du prestataire appartient à l’environnement
              serveur.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Prestataire">
                <select name="crypto_provider" defaultValue={settings?.crypto_provider ?? ""} className={fieldClass}>
                  <option value="">— choisir —</option>
                  {CRYPTO_PROVIDERS.map((provider) => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="URL du prestataire" hint="ex. votre instance BTCPay">
                <input
                  name="crypto_provider_url"
                  defaultValue={settings?.crypto_provider_url ?? ""}
                  className={fieldClass}
                />
              </Field>
            </div>
            <fieldset className="grid gap-2">
              <legend className="text-text text-sm font-medium">Devises acceptées</legend>
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
            <Field label="Note au client (facultatif)">
              <textarea name="crypto_note" defaultValue={settings?.crypto_note ?? ""} className={areaClass} />
            </Field>
          </CardContent>
        </Card>

        <Button type="submit">Enregistrer les moyens de paiement</Button>
      </form>
    </div>
  );
}

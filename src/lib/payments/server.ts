import "server-only";

import { getMigrationAwarePublicSupabase, getMigrationAwareServiceSupabase } from "@/lib/db/server";
import {
  paymentReference,
  toPaymentOptions,
  type PaymentOption,
  type PaymentSettingsRow,
} from "./config";

/** The stored payment configuration, or null when the row is missing. */
export async function readPaymentSettings(): Promise<PaymentSettingsRow | null> {
  const supabase = getMigrationAwarePublicSupabase();
  const { data } = await supabase
    .from("payment_settings")
    .select(
      "bank_transfer_enabled,bank_account_holder,bank_iban,bank_bic,bank_name,bank_reference_prefix," +
        "crypto_enabled,crypto_provider,crypto_provider_url,crypto_currencies,crypto_note," +
        "card_enabled,card_provider,card_publishable_key,card_note," +
        "deposit_enabled,deposit_min_cents,deposit_percent",
    )
    .eq("id", 1)
    .maybeSingle();
  return (data as PaymentSettingsRow | null) ?? null;
}

/** The methods the checkout may show, already filtered to the configured ones. */
export async function getPaymentOptions(): Promise<PaymentOption[]> {
  return toPaymentOptions(await readPaymentSettings());
}


export { paymentReference };
export { getMigrationAwareServiceSupabase as getServiceSupabase };

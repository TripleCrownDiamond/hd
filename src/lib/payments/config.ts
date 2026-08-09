/**
 * Which payment methods the storefront offers, and their public-safe config.
 *
 * The row is stored in `payment_settings` (public read) and holds only what the
 * customer is allowed to see: an IBAN, a card publishable key, a crypto
 * provider URL. Secret keys live in server environment variables and are read
 * only where a payment is actually created — never sent to the browser.
 */

export type PaymentMethod = "bank_transfer" | "crypto" | "card";

export type CryptoProvider = "btcpay" | "coinbase" | "bitpay";
export type CardProvider = "stripe" | "mollie" | "adyen";

export interface PaymentSettingsRow {
  bank_transfer_enabled: boolean;
  bank_account_holder: string | null;
  bank_iban: string | null;
  bank_bic: string | null;
  bank_name: string | null;
  bank_reference_prefix: string | null;
  crypto_enabled: boolean;
  crypto_provider: CryptoProvider | null;
  crypto_provider_url: string | null;
  crypto_currencies: string[] | null;
  crypto_note: string | null;
  card_enabled: boolean;
  card_provider: CardProvider | null;
  card_publishable_key: string | null;
  card_note: string | null;
}

export interface BankTransferOption {
  method: "bank_transfer";
  accountHolder: string;
  iban: string;
  bic: string | null;
  bankName: string | null;
}

export interface CryptoOption {
  method: "crypto";
  provider: CryptoProvider;
  currencies: string[];
  note: string | null;
}

export interface CardOption {
  method: "card";
  provider: CardProvider;
  publishableKey: string;
  note: string | null;
}

export type PaymentOption = BankTransferOption | CryptoOption | CardOption;

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  bank_transfer: "Überweisung",
  crypto: "Kryptowährung",
  card: "Kreditkarte",
};

/**
 * Turn the stored row into the options the checkout can actually show.
 *
 * A method appears only when it is both enabled and completely configured: a
 * bank transfer with no IBAN, or a card with no publishable key, cannot take a
 * payment, so offering it would only strand the customer. The order matters —
 * bank transfer first — because it is the one that always works without a
 * third party.
 */
export function toPaymentOptions(row: PaymentSettingsRow | null): PaymentOption[] {
  if (!row) return [];
  const options: PaymentOption[] = [];

  if (row.bank_transfer_enabled && row.bank_iban && row.bank_account_holder) {
    options.push({
      method: "bank_transfer",
      accountHolder: row.bank_account_holder,
      iban: row.bank_iban,
      bic: row.bank_bic,
      bankName: row.bank_name,
    });
  }

  if (row.card_enabled && row.card_provider && row.card_publishable_key) {
    options.push({
      method: "card",
      provider: row.card_provider,
      publishableKey: row.card_publishable_key,
      note: row.card_note,
    });
  }

  if (
    row.crypto_enabled &&
    row.crypto_provider &&
    (row.crypto_currencies?.length ?? 0) > 0
  ) {
    options.push({
      method: "crypto",
      provider: row.crypto_provider,
      currencies: row.crypto_currencies ?? [],
      note: row.crypto_note,
    });
  }

  return options;
}

/** Cryptocurrencies commonly accepted by German-facing processors. */
export const CRYPTO_CHOICES = ["BTC", "ETH", "USDT", "USDC", "LTC", "XMR"] as const;

/**
 * The reference a customer writes on their transfer, and the admin reconciles.
 *
 * Derived from the order number so it is stable and unique, with the admin's
 * prefix so several shops sharing a bank account stay distinguishable.
 */
export function paymentReference(prefix: string | null, orderNumber: string): string {
  const clean = (prefix ?? "HK").replace(/[^A-Za-z0-9]/g, "").slice(0, 6) || "HK";
  return `${clean}-${orderNumber}`;
}

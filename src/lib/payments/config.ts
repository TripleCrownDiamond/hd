/**
 * Which payment methods the storefront offers, and their public-safe config.
 *
 * The row is stored in `payment_settings` (public read) and holds only what the
 * customer is allowed to see: an IBAN, a card publishable key, a crypto
 * provider URL. Secret keys live in server environment variables and are read
 * only where a payment is actually created — never sent to the browser.
 */

export type PaymentMethod = "bank_transfer" | "crypto" | "card" | "deposit";

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
  /**
   * Deposit (Anzahlung): the customer pays a percentage of the total up front
   * by transfer and the rest later. Optional because a database that has not
   * yet run 20260810000018_deposit_payment.sql returns rows without them.
   */
  deposit_enabled?: boolean;
  /** Orders below this total (cents) cannot use the deposit. Default 10 000 €. */
  deposit_min_cents?: number;
  /** Percentage of the total paid up front. Default 30. */
  deposit_percent?: number;
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

export interface DepositOption {
  method: "deposit";
  /** Percentage of the total paid up front. */
  percent: number;
  /** Orders below this total (cents) are not offered the deposit. */
  minCents: number;
  // The deposit is settled by transfer, so it carries the bank destination.
  accountHolder: string;
  iban: string;
  bic: string | null;
  bankName: string | null;
}

export type PaymentOption =
  | BankTransferOption
  | CryptoOption
  | CardOption
  | DepositOption;

/**
 * The seeded placeholder account.
 *
 * The checkout offers bank transfer with it so the shop can take orders right
 * away, but no customer ever sees these values: the confirmation page and the
 * order e-mails say the account details arrive by e-mail instead. Replace them
 * in the admin (/admin/zahlungen) before going live.
 */
export const PLACEHOLDER_IBAN = "DE00000000000000000000";
export const PLACEHOLDER_ACCOUNT_HOLDER = "Bitte in der Verwaltung hinterlegen";

/** True while the seeded placeholder account is still configured. */
export function isPlaceholderBankData(option: BankTransferOption): boolean {
  return (
    option.iban.replace(/\s+/g, "").toUpperCase() === PLACEHOLDER_IBAN ||
    option.accountHolder.trim() === PLACEHOLDER_ACCOUNT_HOLDER
  );
}

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  bank_transfer: "Überweisung",
  crypto: "Kryptowährung",
  card: "Kreditkarte",
  deposit: "Anzahlung",
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

  let bank: BankTransferOption | null = null;
  if (row.bank_transfer_enabled && row.bank_iban && row.bank_account_holder) {
    bank = {
      method: "bank_transfer",
      accountHolder: row.bank_account_holder,
      iban: row.bank_iban,
      bic: row.bank_bic,
      bankName: row.bank_name,
    };
    options.push(bank);
  }

  // Deposit is settled by transfer, so it only exists alongside a real bank
  // account — never with the seeded placeholder, whose IBAN must not reach a
  // customer who is being asked to pay now.
  if (row.deposit_enabled && bank && !isPlaceholderBankData(bank)) {
    options.push({
      method: "deposit",
      percent: row.deposit_percent ?? 30,
      minCents: row.deposit_min_cents ?? 1_000_000,
      accountHolder: bank.accountHolder,
      iban: bank.iban,
      bic: bank.bic,
      bankName: bank.bankName,
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

import { describe, expect, it } from "vitest";
import {
  isPlaceholderBankData,
  paymentReference,
  PLACEHOLDER_ACCOUNT_HOLDER,
  PLACEHOLDER_IBAN,
  toPaymentOptions,
  type BankTransferOption,
  type PaymentSettingsRow,
} from "./config";

const EMPTY: PaymentSettingsRow = {
  bank_transfer_enabled: false,
  bank_account_holder: null,
  bank_iban: null,
  bank_bic: null,
  bank_name: null,
  bank_reference_prefix: null,
  crypto_enabled: false,
  crypto_provider: null,
  crypto_provider_url: null,
  crypto_currencies: null,
  crypto_note: null,
  card_enabled: false,
  card_provider: null,
  card_publishable_key: null,
  card_note: null,
  deposit_enabled: true,
  deposit_min_cents: 1_000_000,
  deposit_percent: 30,
};

/** A fully configured real bank account. */
const BANK: PaymentSettingsRow = {
  ...EMPTY,
  bank_transfer_enabled: true,
  bank_account_holder: "HolzDirekt GmbH",
  bank_iban: "DE89370400440532013000",
};

describe("toPaymentOptions", () => {
  it("returns nothing when no method is configured", () => {
    expect(toPaymentOptions(null)).toEqual([]);
    expect(toPaymentOptions(EMPTY)).toEqual([]);
  });

  it("hides a method that is enabled but incomplete", () => {
    // Enabled without an IBAN would strand the customer, so it must not show.
    const noIban: PaymentSettingsRow = {
      ...EMPTY,
      bank_transfer_enabled: true,
      bank_account_holder: "HolzDirekt GmbH",
    };
    expect(toPaymentOptions(noIban)).toEqual([]);

    const noKey: PaymentSettingsRow = {
      ...EMPTY,
      card_enabled: true,
      card_provider: "stripe",
    };
    expect(toPaymentOptions(noKey)).toEqual([]);

    const noCurrency: PaymentSettingsRow = {
      ...EMPTY,
      crypto_enabled: true,
      crypto_provider: "btcpay",
      crypto_currencies: [],
    };
    expect(toPaymentOptions(noCurrency)).toEqual([]);
  });

  it("shows a fully configured bank transfer", () => {
    // Deposit is disabled here so the test isolates the transfer option.
    const row: PaymentSettingsRow = {
      ...EMPTY,
      deposit_enabled: false,
      bank_transfer_enabled: true,
      bank_account_holder: "HolzDirekt GmbH",
      bank_iban: "DE89370400440532013000",
      bank_bic: "COBADEFFXXX",
    };
    const options = toPaymentOptions(row);
    expect(options).toHaveLength(1);
    expect(options[0]).toMatchObject({ method: "bank_transfer", iban: "DE89370400440532013000" });
  });

  it("shows bank transfer with the seeded placeholder account", () => {
    // The shop ships with the placeholder enabled so the checkout always has a
    // working method; it must surface as an option but be flagged as placeholder.
    const row: PaymentSettingsRow = {
      ...EMPTY,
      bank_transfer_enabled: true,
      bank_account_holder: PLACEHOLDER_ACCOUNT_HOLDER,
      bank_iban: PLACEHOLDER_IBAN,
    };
    const options = toPaymentOptions(row);
    expect(options).toHaveLength(1);
    expect(options[0]).toMatchObject({ method: "bank_transfer" });
    expect(isPlaceholderBankData(options[0] as BankTransferOption)).toBe(true);
  });

  it("orders bank transfer before card before crypto", () => {
    const row: PaymentSettingsRow = {
      ...EMPTY,
      deposit_enabled: false,
      bank_transfer_enabled: true,
      bank_account_holder: "HolzDirekt GmbH",
      bank_iban: "DE89370400440532013000",
      card_enabled: true,
      card_provider: "stripe",
      card_publishable_key: "pk_test_123",
      crypto_enabled: true,
      crypto_provider: "btcpay",
      crypto_currencies: ["BTC", "ETH"],
    };
    expect(toPaymentOptions(row).map((option) => option.method)).toEqual([
      "bank_transfer",
      "card",
      "crypto",
    ]);
  });
});

describe("isPlaceholderBankData", () => {
  it("detects the seeded placeholder account", () => {
    expect(
      isPlaceholderBankData({
        method: "bank_transfer",
        accountHolder: PLACEHOLDER_ACCOUNT_HOLDER,
        iban: PLACEHOLDER_IBAN,
        bic: null,
        bankName: null,
      }),
    ).toBe(true);
  });

  it("accepts a real account", () => {
    expect(
      isPlaceholderBankData({
        method: "bank_transfer",
        accountHolder: "HolzDirekt GmbH",
        iban: "DE89370400440532013000",
        bic: "COBADEFFXXX",
        bankName: null,
      }),
    ).toBe(false);
  });

  it("ignores spacing when comparing the IBAN", () => {
    expect(
      isPlaceholderBankData({
        method: "bank_transfer",
        accountHolder: "Jemand",
        iban: "DE00 0000 0000 0000 0000 00",
        bic: null,
        bankName: null,
      }),
    ).toBe(true);
  });
});

describe("deposit option", () => {
  it("offers the deposit alongside a real bank account", () => {
    const options = toPaymentOptions(BANK);
    expect(options.map((option) => option.method)).toContain("deposit");
    const deposit = options.find((option) => option.method === "deposit");
    expect(deposit).toMatchObject({ method: "deposit", percent: 30, minCents: 1_000_000, iban: "DE89370400440532013000" });
  });

  it("hides the deposit when the bank account is the seeded placeholder", () => {
    const options = toPaymentOptions({ ...EMPTY, bank_transfer_enabled: true, bank_account_holder: PLACEHOLDER_ACCOUNT_HOLDER, bank_iban: PLACEHOLDER_IBAN });
    expect(options.map((option) => option.method)).not.toContain("deposit");
  });

  it("hides the deposit when the bank transfer is disabled", () => {
    const options = toPaymentOptions({ ...BANK, bank_transfer_enabled: false });
    expect(options.map((option) => option.method)).toEqual([]);
  });

  it("hides the deposit when deposit is disabled in settings", () => {
    const options = toPaymentOptions({ ...BANK, deposit_enabled: false });
    expect(options.map((option) => option.method)).not.toContain("deposit");
  });
});

describe("paymentReference", () => {
  it("prefixes the order number and strips punctuation", () => {
    expect(paymentReference("HK", "2026-000123")).toBe("HK-2026-000123");
    expect(paymentReference("HK Shop!", "2026-000123")).toBe("HKShop-2026-000123");
  });

  it("falls back to HK when no prefix is set", () => {
    expect(paymentReference(null, "2026-000001")).toBe("HK-2026-000001");
    expect(paymentReference("", "2026-000001")).toBe("HK-2026-000001");
  });
});

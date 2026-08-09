import { describe, expect, it } from "vitest";
import { paymentReference, toPaymentOptions, type PaymentSettingsRow } from "./config";

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
    const row: PaymentSettingsRow = {
      ...EMPTY,
      bank_transfer_enabled: true,
      bank_account_holder: "HolzDirekt GmbH",
      bank_iban: "DE89370400440532013000",
      bank_bic: "COBADEFFXXX",
    };
    const options = toPaymentOptions(row);
    expect(options).toHaveLength(1);
    expect(options[0]).toMatchObject({ method: "bank_transfer", iban: "DE89370400440532013000" });
  });

  it("orders bank transfer before card before crypto", () => {
    const row: PaymentSettingsRow = {
      ...EMPTY,
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

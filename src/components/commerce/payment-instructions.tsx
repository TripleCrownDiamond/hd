"use client";

import { CheckCircle2, Copy } from "lucide-react";
import { useState } from "react";
import { isPlaceholderBankData, type PaymentOption } from "@/lib/payments/config";
import { formatPrice } from "@/lib/utils";

export interface PlacedOrderResult {
  orderNumber: string;
  totalCents: number;
  shippingCents: number;
  paymentMethod: "bank_transfer" | "crypto" | "card";
  paymentReference: string | null;
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="border-border flex items-center justify-between gap-3 border-b py-2 last:border-0">
      <div className="min-w-0">
        <dt className="text-muted text-xs">{label}</dt>
        <dd className="text-text font-mono text-sm break-all">{value}</dd>
      </div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(value).then(
            () => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            },
            () => undefined,
          );
        }}
        className="text-muted hover:text-text shrink-0 rounded-md p-1.5"
        aria-label={`${label} kopieren`}
      >
        {copied ? (
          <CheckCircle2 className="text-success size-4" aria-hidden="true" />
        ) : (
          <Copy className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

/**
 * What the customer does next, per method.
 *
 * The order already exists and waits for payment; this only tells the customer
 * how to pay it. Bank transfer is self-contained; card and crypto hand off to
 * their provider, which is wired once the provider keys are configured.
 */
export function PaymentInstructions({
  order,
  option,
}: {
  order: PlacedOrderResult;
  option: PaymentOption | undefined;
}) {
  if (order.paymentMethod === "bank_transfer" && option?.method === "bank_transfer") {
    // The seeded placeholder account must never be shown as a real destination:
    // the customer gets the reference and amount, the account arrives by mail.
    if (isPlaceholderBankData(option)) {
      return (
        <div>
          <p className="text-muted text-sm">
            Bitte überweisen Sie den Gesamtbetrag und geben Sie unbedingt die Referenz an, damit wir
            Ihre Zahlung zuordnen können. Die Kontodaten erhalten Sie per E-Mail.
          </p>
          <dl className="mt-4">
            {order.paymentReference && (
              <CopyRow label="Verwendungszweck" value={order.paymentReference} />
            )}
            <CopyRow label="Betrag" value={formatPrice(order.totalCents)} />
          </dl>
          <p className="text-muted mt-3 text-xs">
            Nach Zahlungseingang bestätigen wir Ihre Bestellung und bereiten den Versand vor.
          </p>
        </div>
      );
    }
    return (
      <div>
        <p className="text-muted text-sm">
          Bitte überweisen Sie den Gesamtbetrag auf folgendes Konto. Geben Sie unbedingt die
          Referenz an, damit wir Ihre Zahlung zuordnen können.
        </p>
        <dl className="mt-4">
          <CopyRow label="Kontoinhaber" value={option.accountHolder} />
          <CopyRow label="IBAN" value={option.iban} />
          {option.bic && <CopyRow label="BIC" value={option.bic} />}
          {option.bankName && <CopyRow label="Bank" value={option.bankName} />}
          {order.paymentReference && (
            <CopyRow label="Verwendungszweck" value={order.paymentReference} />
          )}
          <CopyRow label="Betrag" value={formatPrice(order.totalCents)} />
        </dl>
        <p className="text-muted mt-3 text-xs">
          Nach Zahlungseingang bestätigen wir Ihre Bestellung und bereiten den Versand vor.
        </p>
      </div>
    );
  }

  if (order.paymentMethod === "crypto" && option?.method === "crypto") {
    return (
      <div className="text-sm">
        <p className="text-muted">
          Ihre Bestellung ist reserviert. Die Zahlung wird über {option.provider} abgewickelt —
          Sie erhalten die Zahlungsadresse für {option.currencies.join(", ")}, sobald der Anbieter
          verbunden ist.
        </p>
        {option.note && <p className="text-muted mt-2">{option.note}</p>}
      </div>
    );
  }

  if (order.paymentMethod === "card" && option?.method === "card") {
    return (
      <div className="text-sm">
        <p className="text-muted">
          Die Kartenzahlung wird über {option.provider} abgewickelt. Die Karte wird sicher beim
          Anbieter eingegeben; wir speichern keine Kartendaten. Der Bezahlvorgang wird aktiv,
          sobald die Anbieter-Schlüssel hinterlegt sind.
        </p>
        {option.note && <p className="text-muted mt-2">{option.note}</p>}
      </div>
    );
  }

  return (
    <p className="text-muted text-sm">
      Ihre Bestellung ist eingegangen. Zahlungsdetails folgen per E-Mail.
    </p>
  );
}

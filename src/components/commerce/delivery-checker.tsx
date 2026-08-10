"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDelivery } from "@/lib/shipping/delivery-store";
import { cn, formatPrice } from "@/lib/utils";

export function DeliveryChecker({ compact = false }: { compact?: boolean }) {
  const inputId = useId();
  const resultId = useId();
  // The postcode is shared with the checkout, so a visitor who checks it here
  // does not retype it at the till and both see the same shipping figure.
  const { postcode, setPostcode, result, checking, hydrated } = useDelivery();
  const [draft, setDraft] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Adopt the remembered postcode once it arrives, without overwriting typing.
  useEffect(() => {
    if (hydrated && postcode && !draft) setDraft(postcode);
  }, [hydrated, postcode, draft]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setPostcode(draft);
  };

  const tooShort = submitted && draft.length !== 5;
  const showResult = draft === postcode && draft.length === 5;

  return (
    <Card
      className={cn("overflow-hidden p-0", compact ? "" : "shadow-md")}
      role="region"
      aria-label="Liefergebiet prüfen"
    >
      <div className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="bg-brand/5 flex size-8 items-center justify-center rounded-md">
            <Truck className="text-brand size-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-display text-text text-base font-semibold">
              Liefern wir zu Ihnen?
            </h3>
            <p className="text-muted text-xs">
              Postleitzahl eingeben — wir zeigen Ort, Versandart und Kosten.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 sm:flex-row"
          aria-label="Postleitzahl eingeben"
          noValidate
        >
          <div className="flex-1">
            <Label htmlFor={inputId} className="sr-only">
              Postleitzahl
            </Label>
            <Input
              id={inputId}
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={5}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value.replace(/\D/g, "").slice(0, 5));
                setSubmitted(false);
              }}
              placeholder="Ihre PLZ, z. B. 10115"
              aria-invalid={
                tooShort || (showResult && result?.ok === false && result.reason !== "unknown")
              }
              aria-describedby={resultId}
              className="font-mono tabular-nums"
            />
          </div>
          <Button type="submit" variant="outline" disabled={checking}>
            {checking ? "Prüfe …" : "Prüfen"}
          </Button>
        </form>
      </div>

      <div id={resultId} role="status" aria-live="polite">
        {tooShort && (
          <div className="border-danger/20 bg-danger/5 text-danger border-t px-6 py-3 text-sm">
            <div className="flex items-start gap-2">
              <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>Bitte geben Sie eine 5-stellige Postleitzahl ein.</span>
            </div>
          </div>
        )}

        {showResult && result?.ok === false && result.reason === "unknown" && (
          <div className="border-warning/30 bg-warning/5 border-t px-6 py-3 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-warning mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <span>{result.message}</span>
                {result.shipping && (
                  <p className="text-muted mt-1">
                    {result.shippingLabel} ·{" "}
                    {result.shipping.free ? (
                      <span className="text-success font-medium">versandkostenfrei</span>
                    ) : (
                      <span className="text-text font-mono font-medium tabular-nums">
                        {formatPrice(result.shipping.totalCents)}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {showResult && result?.ok === false && result.reason !== "unknown" && (
          <div className="border-danger/20 bg-danger/5 text-danger border-t px-6 py-3 text-sm">
            <div className="flex items-start gap-2">
              <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{result.message}</span>
            </div>
          </div>
        )}

        {showResult && result?.ok === true && (
          <div className="border-success/20 bg-success/5 border-t px-6 py-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-text font-medium">
                  Wir liefern nach {result.place.city} ({result.place.postcode}),{" "}
                  {result.place.state}.
                </p>
                <p className="text-muted mt-1">
                  {result.shippingLabel} ·{" "}
                  {result.shipping.free ? (
                    <span className="text-success font-medium">versandkostenfrei</span>
                  ) : (
                    <>
                      <span className="text-text font-mono font-medium tabular-nums">
                        {formatPrice(result.shipping.totalCents)}
                      </span>
                      {result.shipping.surchargeCents > 0 && (
                        <> (inkl. {formatPrice(result.shipping.surchargeCents)} Inselzuschlag)</>
                      )}
                    </>
                  )}
                </p>
                {!result.shipping.free && result.shipping.remainingForFreeCents > 0 && (
                  <p className="text-muted mt-1">
                    Noch {formatPrice(result.shipping.remainingForFreeCents)} bis zur kostenlosen
                    Lieferung bis zur Haustür.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

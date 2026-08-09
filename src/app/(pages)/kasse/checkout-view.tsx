"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { CheckCircle2, Loader2, ShoppingBag, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart/cart-store";
import { useDelivery } from "@/lib/shipping/delivery-store";
import { CartPageLoading } from "@/components/ui/loading-states";
import { formatPrice } from "@/lib/utils";
import { PAYMENT_LABEL, type PaymentMethod, type PaymentOption } from "@/lib/payments/config";
import {
  PaymentInstructions,
  type PlacedOrderResult,
} from "@/components/commerce/payment-instructions";

interface AddressFields {
  firstName: string;
  lastName: string;
  street: string;
  houseNumber: string;
  postcode: string;
  city: string;
  email: string;
  phone: string;
}

const EMPTY: AddressFields = {
  firstName: "",
  lastName: "",
  street: "",
  houseNumber: "",
  postcode: "",
  city: "",
  email: "",
  phone: "",
};

const ADDRESS_KEY = "holzkraft:delivery-address";
const ORDER_KEY = "holzkraft:last-order";

function validate(
  fields: AddressFields,
  resolvedCity: string | null,
): Partial<Record<keyof AddressFields, string>> {
  const errors: Partial<Record<keyof AddressFields, string>> = {};
  if (fields.firstName.trim().length < 2) errors.firstName = "Bitte Vornamen angeben.";
  if (fields.lastName.trim().length < 2) errors.lastName = "Bitte Nachnamen angeben.";
  if (fields.street.trim().length < 3) errors.street = "Bitte Straße angeben.";
  if (fields.houseNumber.trim().length < 1) errors.houseNumber = "Bitte Hausnummer angeben.";
  if (!/^\d{5}$/.test(fields.postcode)) errors.postcode = "Bitte 5-stellige PLZ angeben.";
  if (fields.city.trim().length < 2) errors.city = "Bitte Ort angeben.";
  else if (
    resolvedCity &&
    fields.city.trim().toLowerCase() !== resolvedCity.toLowerCase() &&
    !resolvedCity.toLowerCase().includes(fields.city.trim().toLowerCase())
  ) {
    errors.city = `Zu dieser PLZ gehört ${resolvedCity}.`;
  }
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(fields.email)) {
    errors.email = "Bitte gültige E-Mail-Adresse angeben.";
  }
  if (fields.phone.replace(/\D/g, "").length < 6) {
    errors.phone = "Für die Speditionsavisierung benötigen wir eine Telefonnummer.";
  }
  return errors;
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  autoComplete,
  type = "text",
  inputMode,
  maxLength,
  className,
  hint,
}: {
  label: string;
  name: keyof AddressFields;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  type?: string;
  inputMode?: "numeric" | "tel" | "email" | "text";
  maxLength?: number;
  className?: string;
  hint?: string;
}) {
  const id = useId();
  const messageId = `${id}-message`;
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? messageId : undefined}
        className="mt-1"
      />
      {(error || hint) && (
        <p
          id={messageId}
          className={error ? "text-danger mt-1 text-xs" : "text-muted mt-1 text-xs"}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

function OrderPlaced({
  order,
  option,
  onReset,
}: {
  order: PlacedOrderResult;
  option: PaymentOption | undefined;
  onReset: () => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-5 py-8">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="text-success size-8 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="font-display text-text text-2xl font-semibold">
              Bestellung eingegangen
            </h2>
            <p className="text-muted text-sm">
              Bestellnummer{" "}
              <span className="text-text font-mono font-medium">{order.orderNumber}</span> ·{" "}
              {PAYMENT_LABEL[order.paymentMethod]}
            </p>
          </div>
        </div>

        <div className="border-border rounded-lg border p-4">
          <PaymentInstructions order={order} option={option} />
        </div>

        <p className="text-muted text-xs">
          Diese Seite bleibt für Sie gespeichert — Sie können jederzeit hierher zurückkehren, um
          die Zahlungsdaten erneut anzusehen.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href="/">Zur Startseite</Link>
          </Button>
          <Button variant="ghost" onClick={onReset}>
            Neue Bestellung
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function CheckoutView({ paymentOptions }: { paymentOptions: PaymentOption[] }) {
  const { items, count, subtotalCents, clear, hydrated: cartHydrated } = useCart();
  const { postcode, setPostcode, result, checking, hydrated: deliveryHydrated } = useDelivery();

  const [fields, setFields] = useState<AddressFields>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [restored, setRestored] = useState(false);
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [placing, setPlacing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<PlacedOrderResult | null>(null);
  const [promotionInput, setPromotionInput] = useState("");
  const [promotionCode, setPromotionCode] = useState<string | null>(null);
  const [discountCents, setDiscountCents] = useState(0);
  const [promotionState, setPromotionState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [promotionMessage, setPromotionMessage] = useState<string | null>(null);
  const [recoveryConsent, setRecoveryConsent] = useState(false);
  const [cartSessionToken, setCartSessionToken] = useState("");

  // A placed order persists so a reload or a return visit still shows the
  // number and the payment details rather than an empty cart.
  useEffect(() => {
    try {
      const address = window.localStorage.getItem(ADDRESS_KEY);
      if (address) setFields({ ...EMPTY, ...(JSON.parse(address) as Partial<AddressFields>) });
      const order = window.localStorage.getItem(ORDER_KEY);
      if (order) setPlaced(JSON.parse(order) as PlacedOrderResult);
    } catch {
      // A blocked or corrupt store only costs the convenience of prefilling.
    }
    setRestored(true);
    const storedToken = window.localStorage.getItem("holzkraft:cart-session") || crypto.randomUUID();
    window.localStorage.setItem("holzkraft:cart-session", storedToken); setCartSessionToken(storedToken);
  }, []);

  useEffect(() => {
    if (!recoveryConsent || !cartSessionToken || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(fields.email) || items.length === 0) return;
    const timer = window.setTimeout(() => { void fetch("/api/warenkorb/recovery", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ consent: true, sessionToken: cartSessionToken, email: fields.email, name: `${fields.firstName} ${fields.lastName}`.trim(), items, subtotalCents, promotionCode }) }); }, 900);
    return () => window.clearTimeout(timer);
  }, [recoveryConsent, cartSessionToken, fields.email, fields.firstName, fields.lastName, items, subtotalCents, promotionCode]);

  useEffect(() => {
    if (!restored) return;
    try {
      window.localStorage.setItem(ADDRESS_KEY, JSON.stringify(fields));
    } catch {
      // ignore
    }
  }, [fields, restored]);

  useEffect(() => {
    if (restored && deliveryHydrated && postcode && !fields.postcode) {
      setFields((previous) => ({ ...previous, postcode }));
    }
  }, [restored, deliveryHydrated, postcode, fields.postcode]);

  const resolvedCity = result?.ok ? result.place.city : null;

  useEffect(() => {
    if (resolvedCity && !fields.city) {
      setFields((previous) => ({ ...previous, city: resolvedCity }));
    }
  }, [resolvedCity, fields.city]);

  // Default to the first offered method, but never override a manual choice.
  useEffect(() => {
    if (!method && paymentOptions.length > 0) setMethod(paymentOptions[0]!.method);
  }, [method, paymentOptions]);

  const errors = useMemo(() => validate(fields, resolvedCity), [fields, resolvedCity]);
  const quote = result?.ok ? result.shipping : null;
  const totalCents = subtotalCents - discountCents + (quote?.totalCents ?? 0);
  const deliverable = result?.ok === true;
  const hasPayment = paymentOptions.length > 0;
  const canOrder =
    Object.keys(errors).length === 0 && deliverable && count > 0 && Boolean(method) && hasPayment;

  const update = (name: keyof AddressFields) => (value: string) => {
    if (name === "postcode") {
      const clean = value.replace(/\D/g, "").slice(0, 5);
      setFields((previous) => ({ ...previous, postcode: clean }));
      setPostcode(clean);
      return;
    }
    setFields((previous) => ({ ...previous, [name]: value }));
  };

  const submit = async () => {
    setTouched(true);
    setSubmitError(null);
    if (!canOrder || !method) return;

    setPlacing(true);
    try {
      const response = await fetch("/api/bestellung", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            slug: item.slug,
            name: item.name,
            variant: item.variant,
            quantity: item.quantity,
            kind: item.imageKind,
          })),
          address: fields,
          paymentMethod: method,
          promotionCode,
          cartSessionToken: recoveryConsent ? cartSessionToken : null,
        }),
      });
      const data = (await response.json()) as
        | { ok: true; order: PlacedOrderResult }
        | { ok: false; message: string };

      if (!response.ok || !data.ok) {
        setSubmitError(
          "message" in data ? data.message : "Die Bestellung konnte nicht abgeschlossen werden.",
        );
        return;
      }

      try {
        window.localStorage.setItem(ORDER_KEY, JSON.stringify(data.order));
      } catch {
        // ignore
      }
      setPlaced(data.order);
      clear();
    } catch {
      setSubmitError("Netzwerkfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setPlacing(false);
    }
  };

  const applyPromotion = async () => {
    setPromotionState("loading"); setPromotionMessage(null);
    try {
      const response = await fetch("/api/rabatt", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: promotionInput, items: items.map((item) => ({ slug: item.slug, quantity: item.quantity })) }) });
      const data = await response.json() as { ok: boolean; code?: string; discountCents?: number; message?: string };
      if (!response.ok || !data.ok || !data.code || !data.discountCents) throw new Error(data.message ?? "Ungültiger Rabattcode.");
      setPromotionCode(data.code); setPromotionInput(data.code); setDiscountCents(data.discountCents); setPromotionState("success"); setPromotionMessage(`${formatPrice(data.discountCents)} Rabatt angewendet.`);
    } catch (error) {
      setPromotionCode(null); setDiscountCents(0); setPromotionState("error"); setPromotionMessage(error instanceof Error ? error.message : "Ungültiger Rabattcode.");
    }
  };

  const resetOrder = () => {
    try {
      window.localStorage.removeItem(ORDER_KEY);
    } catch {
      // ignore
    }
    setPlaced(null);
    setTouched(false);
  };

  if (!cartHydrated || !restored) return <CartPageLoading />;

  if (placed) {
    const option = paymentOptions.find((entry) => entry.method === placed.paymentMethod);
    return <OrderPlaced order={placed} option={option} onReset={resetOrder} />;
  }

  if (count === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-elevated mb-5 flex size-16 items-center justify-center rounded-full">
            <ShoppingBag className="text-muted size-7" aria-hidden="true" />
          </div>
          <h2 className="font-display text-text text-2xl font-semibold">
            Ihr Warenkorb ist leer
          </h2>
          <p className="text-muted mt-2 max-w-md">
            Legen Sie Artikel in den Warenkorb, um zur Kasse zu gehen.
          </p>
          <Button asChild className="mt-6">
            <Link href="/brennholz">Zum Sortiment</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
      <form
        className="space-y-6"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lieferadresse</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Vorname"
              name="firstName"
              autoComplete="given-name"
              value={fields.firstName}
              onChange={update("firstName")}
              error={touched ? errors.firstName : undefined}
            />
            <Field
              label="Nachname"
              name="lastName"
              autoComplete="family-name"
              value={fields.lastName}
              onChange={update("lastName")}
              error={touched ? errors.lastName : undefined}
            />
            <Field
              label="Straße"
              name="street"
              autoComplete="address-line1"
              value={fields.street}
              onChange={update("street")}
              error={touched ? errors.street : undefined}
            />
            <Field
              label="Hausnummer"
              name="houseNumber"
              autoComplete="address-line2"
              value={fields.houseNumber}
              onChange={update("houseNumber")}
              error={touched ? errors.houseNumber : undefined}
            />
            <Field
              label="Postleitzahl"
              name="postcode"
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={5}
              value={fields.postcode}
              onChange={update("postcode")}
              error={touched ? errors.postcode : undefined}
              className="font-mono"
            />
            <Field
              label="Ort"
              name="city"
              autoComplete="address-level2"
              value={fields.city}
              onChange={update("city")}
              error={touched ? errors.city : undefined}
              hint={resolvedCity ? `Laut PLZ: ${resolvedCity}` : undefined}
            />
            <div className="sm:col-span-2">
              <Label>Land</Label>
              <Input value="Deutschland" readOnly disabled className="mt-1" />
              <p className="text-muted mt-1 text-xs">
                Wir liefern derzeit ausschließlich innerhalb Deutschlands.
              </p>
            </div>
            <Field
              label="E-Mail"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={fields.email}
              onChange={update("email")}
              error={touched ? errors.email : undefined}
            />
            <Field
              label="Telefon"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={fields.phone}
              onChange={update("phone")}
              error={touched ? errors.phone : undefined}
              hint="Für die Avisierung der Spedition."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="text-brand size-4" aria-hidden="true" />
              Liefergebiet und Versand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div role="status" aria-live="polite" className="text-sm">
              {fields.postcode.length !== 5 && (
                <p className="text-muted">
                  Geben Sie Ihre Postleitzahl ein, um Versandart und Kosten zu sehen.
                </p>
              )}
              {fields.postcode.length === 5 && checking && (
                <p className="text-muted flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Liefergebiet wird geprüft …
                </p>
              )}
              {!checking && result?.ok === false && (
                <p className="text-danger flex items-start gap-2">
                  <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{result.message}</span>
                </p>
              )}
              {!checking && result?.ok === true && (
                <div className="flex items-start gap-2">
                  <CheckCircle2
                    className="text-success mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-text font-medium">
                      Lieferung nach {result.place.city} ({result.place.postcode}),{" "}
                      {result.place.state}
                    </p>
                    <p className="text-muted mt-1">{result.shippingLabel}</p>
                    <p className="text-muted">{result.zoneLabel}</p>
                    {result.shipping.surchargeCents > 0 && !result.shipping.free && (
                      <p className="text-muted mt-1">
                        Inselzuschlag {formatPrice(result.shipping.surchargeCents)} — Fähre bzw.
                        Autozug.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Zahlungsart</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasPayment ? (
              <p className="text-muted text-sm">
                Zurzeit ist keine Zahlungsart freigeschaltet. Bitte versuchen Sie es später erneut.
              </p>
            ) : (
              <fieldset className="space-y-3">
                <legend className="sr-only">Zahlungsart wählen</legend>
                {paymentOptions.map((option) => (
                  <label
                    key={option.method}
                    className="border-border hover:bg-elevated/60 flex cursor-pointer items-start gap-3 rounded-lg border p-3"
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={option.method}
                      checked={method === option.method}
                      onChange={() => setMethod(option.method)}
                      className="mt-1"
                    />
                    <span className="min-w-0">
                      <span className="text-text block text-sm font-medium">
                        {PAYMENT_LABEL[option.method]}
                      </span>
                      <span className="text-muted block text-xs">
                        {option.method === "bank_transfer" &&
                          "Sie erhalten Kontodaten und eine Referenz nach der Bestellung."}
                        {option.method === "card" &&
                          `Sichere Zahlung über ${option.provider}. Keine Kartendaten bei uns.`}
                        {option.method === "crypto" &&
                          `Über ${option.provider} · ${option.currencies.join(", ")}`}
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
          </CardContent>
        </Card>

        <Button type="submit" size="lg" disabled={!canOrder || placing} fullWidth>
          {placing ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Bestellung wird angelegt …
            </>
          ) : (
            "Zahlungspflichtig bestellen"
          )}
        </Button>

        {submitError && (
          <p className="text-danger text-sm" role="alert">
            {submitError}
          </p>
        )}
        {touched && !canOrder && !submitError && (
          <p className="text-danger text-sm" role="alert">
            {!deliverable
              ? "Bitte geben Sie eine gültige deutsche Lieferadresse an."
              : !hasPayment
                ? "Zurzeit ist keine Zahlungsart verfügbar."
                : !method
                  ? "Bitte wählen Sie eine Zahlungsart."
                  : "Bitte prüfen Sie die markierten Felder."}
          </p>
        )}
      </form>

      <aside className="lg:sticky lg:top-28 lg:self-start" aria-label="Bestellübersicht">
        <Card>
          <CardHeader>
            <CardTitle>Bestellübersicht</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-border divide-y text-sm">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 py-2 first:pt-0">
                  <span className="text-muted min-w-0">
                    <span className="text-text block truncate font-medium">{item.name}</span>
                    {item.quantity} ×{" "}
                    <span className="font-mono tabular-nums">{formatPrice(item.priceCents)}</span>
                  </span>
                  <span className="text-text shrink-0 font-mono tabular-nums">
                    {formatPrice(item.priceCents * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <Separator className="my-4" />

            <div className="mb-5">
              <Label htmlFor="promotion-code">Rabattcode</Label>
              <div className="mt-2 flex gap-2"><Input id="promotion-code" value={promotionInput} onChange={(event) => setPromotionInput(event.target.value.toUpperCase())} placeholder="Code eingeben" /><Button type="button" variant="secondary" onClick={applyPromotion} disabled={promotionState === "loading" || promotionInput.trim().length < 2}>{promotionState === "loading" ? <Loader2 className="size-4 animate-spin" /> : "Einlösen"}</Button></div>
              {promotionMessage ? <p role="status" className={`mt-2 text-xs ${promotionState === "error" ? "text-destructive" : "text-success"}`}>{promotionMessage}</p> : null}
            </div>
            <label className="mb-5 flex items-start gap-3 rounded-lg border p-3 text-xs"><input className="mt-0.5" type="checkbox" checked={recoveryConsent} onChange={(event) => setRecoveryConsent(event.target.checked)} /><span><strong className="block text-sm">Warenkorb-Erinnerung per E-Mail</strong>Ich möchte eine begrenzte Anzahl automatischer Erinnerungen erhalten, falls ich die Bestellung nicht abschließe. Jederzeit abmeldbar; keine Newsletter-Einwilligung.</span></label>

            <dl className="space-y-2 text-sm">
              <div className="text-muted flex justify-between">
                <dt>Zwischensumme</dt>
                <dd className="text-text font-mono tabular-nums">{formatPrice(subtotalCents)}</dd>
              </div>
              {discountCents > 0 ? <div className="text-success flex justify-between"><dt>Rabatt ({promotionCode})</dt><dd className="font-mono">-{formatPrice(discountCents)}</dd></div> : null}
              <div className="text-muted flex justify-between">
                <dt>Versand</dt>
                <dd className="text-text font-mono tabular-nums">
                  {quote ? (
                    quote.free ? (
                      <span className="text-success">kostenlos</span>
                    ) : (
                      formatPrice(quote.totalCents)
                    )
                  ) : (
                    <span className="text-muted font-sans">Nach PLZ</span>
                  )}
                </dd>
              </div>
              <div className="text-muted flex justify-between">
                <dt>Enthaltene MwSt. (19 %)</dt>
                <dd className="text-text font-mono tabular-nums">
                  {formatPrice(Math.round(totalCents * (0.19 / 1.19)))}
                </dd>
              </div>
              <Separator className="my-3" />
              <div className="flex items-baseline justify-between">
                <dt className="font-display text-text text-lg font-semibold">Summe</dt>
                <dd className="text-text font-mono text-2xl font-semibold tabular-nums">
                  {formatPrice(totalCents)}
                </dd>
              </div>
            </dl>

            {quote && !quote.free && quote.remainingForFreeCents > 0 && (
              <p className="text-muted mt-3 text-xs">
                Noch {formatPrice(quote.remainingForFreeCents)} bis zur kostenlosen Lieferung bis
                zur Haustür.
              </p>
            )}

            <Button asChild variant="secondary" size="sm" fullWidth className="mt-4">
              <Link href="/warenkorb">Zurück zum Warenkorb</Link>
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

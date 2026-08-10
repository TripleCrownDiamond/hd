"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import {
  ArrowRight,
  Flame,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Trash2,
  TreeDeciduous,
  Truck,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart, type CartItem } from "@/lib/cart/cart-store";
import { useSearchParams } from "next/navigation";
import { media } from "@/lib/media";
import { formatPrice, formatBasePrice } from "@/lib/utils";
import { DeliveryChecker } from "@/components/commerce/delivery-checker";
import { useDelivery } from "@/lib/shipping/delivery-store";
import { CartPageLoading } from "@/components/ui/loading-states";

const iconByKind = {
  wood: TreeDeciduous,
  stove: Flame,
  briquette: Package,
  pellet: Package,
  accessory: Wrench,
} as const;

function LineRow({ item }: { item: CartItem }) {
  const { setQuantity, remove } = useCart();
  const Icon = iconByKind[item.imageKind];
  const lineTotal = item.priceCents * item.quantity;
  const href =
    item.href ??
    (item.imageKind === "stove" ? `/kaminofen/${item.slug}` : `/produkt/${item.slug}`);

  return (
    <li className="flex gap-4 py-5 first:pt-0 last:pb-0">
      <Link
        href={href}
        aria-label={item.name}
        className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-wood/15 via-elevated to-brand/10"
      >
        {item.image ? (
          <Image
            src={media(item.image, { width: 160, height: 160, crop: "fill" })}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <Icon className="size-8 text-brand/60" strokeWidth={1.5} aria-hidden="true" />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={href}
              className="font-display text-base font-semibold text-text hover:text-accent"
            >
              {item.name}
            </Link>
            {item.variant && <p className="text-xs text-muted">{item.variant}</p>}
            {item.basePriceCents && item.basePriceUnit && (
              <p className="mt-1 font-mono text-xs text-muted tabular-nums">
                {formatBasePrice(item.basePriceCents, item.basePriceUnit)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => remove(item.id)}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-danger/5 hover:text-danger focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
            aria-label={`Entfernen: ${item.name}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="inline-flex items-center rounded-md border border-border">
            <button
              type="button"
              onClick={() => setQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="flex size-9 items-center justify-center rounded-l-md text-muted transition-colors hover:bg-elevated hover:text-text disabled:opacity-40 focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
              aria-label={`Menge verringern: ${item.name}`}
            >
              <Minus className="size-3.5" />
            </button>
            <span
              className="flex min-w-10 items-center justify-center font-mono text-sm tabular-nums text-text"
              aria-live="polite"
            >
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(item.id, item.quantity + 1)}
              className="flex size-9 items-center justify-center rounded-r-md text-muted transition-colors hover:bg-elevated hover:text-text focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
              aria-label={`Menge erhöhen: ${item.name}`}
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <p className="font-mono text-lg font-semibold tabular-nums text-text">
            {formatPrice(lineTotal)}
          </p>
        </div>
      </div>
    </li>
  );
}

export function CartView() {
  const { items, count, subtotalCents, clear, replace, hydrated } = useCart();
  const searchParams = useSearchParams();
  const recoveryToken = searchParams.get("recovery");
  useEffect(() => { if (!hydrated || !recoveryToken) return; void fetch(`/api/warenkorb/recover?token=${encodeURIComponent(recoveryToken)}`).then((response) => response.json()).then((data: { ok?: boolean; items?: CartItem[] }) => { if (data.ok && Array.isArray(data.items)) replace(data.items); }).catch(() => undefined); }, [hydrated, recoveryToken, replace]);
  // Shipping is only known once a postcode is: the summary says so rather than
  // showing a figure that the checkout would then contradict.
  const { result } = useDelivery();
  // The API answers an unknown postcode with the standard-tariff quote, so the
  // summary can still show a shipping figure instead of an empty placeholder.
  const quote = result?.shipping ?? null;
  const totalCents = subtotalCents + (quote?.totalCents ?? 0);

  if (!hydrated) return <CartPageLoading />;

  if (count === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-elevated">
            <ShoppingBag className="size-7 text-muted" aria-hidden="true" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-text">
            Ihr Warenkorb ist leer
          </h2>
          <p className="mt-2 max-w-md text-muted">
            Entdecken Sie unser Sortiment an Brennholz, Kaminöfen und Zubehör.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/brennholz">Brennholz entdecken</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/kaminoefen">Kaminöfen entdecken</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
      <div className="space-y-6">
        <Card className="p-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border">
            <CardTitle>
              Ihre Artikel{" "}
              <span className="ml-2 font-mono text-sm font-normal tabular-nums text-muted">
                ({count})
              </span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              className="text-muted hover:text-danger"
            >
              <Trash2 className="size-3.5" />
              Alles entfernen
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <LineRow key={item.id} item={item} />
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="size-4 text-brand" aria-hidden="true" />
              Lieferung prüfen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DeliveryChecker compact />
          </CardContent>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start" aria-label="Zusammenfassung">
        <Card>
          <CardHeader>
            <CardTitle>Zusammenfassung</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between text-muted">
                <dt>Zwischensumme ({count} Artikel)</dt>
                <dd className="font-mono tabular-nums text-text">
                  {formatPrice(subtotalCents)}
                </dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Versand{result?.ok ? ` nach ${result.place.city}` : ""}</dt>
                <dd className="font-mono tabular-nums text-text">
                  {quote ? (
                    quote.free ? (
                      <span className="text-success">kostenlos</span>
                    ) : (
                      formatPrice(quote.totalCents)
                    )
                  ) : (
                    <span className="font-sans text-muted">Nach PLZ berechnet</span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Enthaltene MwSt. (19 %)</dt>
                <dd className="font-mono tabular-nums text-text">
                  {formatPrice(Math.round(totalCents * (0.19 / 1.19)))}
                </dd>
              </div>
              <Separator className="my-3" />
              <div className="flex items-baseline justify-between">
                <dt className="font-display text-lg font-semibold text-text">Summe</dt>
                <dd className="font-mono text-2xl font-semibold tabular-nums text-text">
                  {formatPrice(totalCents)}
                </dd>
              </div>
              <p className="text-xs text-muted">
                {quote
                  ? "in EUR, inkl. MwSt. und Versand"
                  : "zzgl. Versand · in EUR, inkl. MwSt."}
              </p>
              {quote && !quote.free && quote.remainingForFreeCents > 0 && (
                <p className="text-xs text-muted">
                  Noch {formatPrice(quote.remainingForFreeCents)} bis zur kostenlosen Lieferung.
                </p>
              )}
            </dl>

            <div className="mt-6 space-y-2">
              <Button asChild size="lg" fullWidth>
                <Link href="/kasse">
                  Zur Kasse
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm" fullWidth>
                <Link href="/brennholz">Weiter einkaufen</Link>
              </Button>
            </div>

            <Separator className="my-5" />

            <ul className="space-y-2 text-xs text-muted">
              <li className="flex items-start gap-2">
                <Badge variant="success" className="mt-0.5 shrink-0">Sicher</Badge>
                {/* Naming providers here claimed methods the shop had not
                    switched on. The checkout is the only place that knows. */}
                <span>Verschlüsselte Übertragung. Zahlungsarten sehen Sie an der Kasse.</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="default" className="mt-0.5 shrink-0">14 Tage</Badge>
                <span>Widerrufsrecht nach § 355 BGB.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Package, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";
import { STATUS_LABEL, type OrderStatus } from "@/lib/orders/status";

interface TrackedOrder {
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  createdAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  totalCents: number;
  tracking: { carrier: string; number: string; url: string | null } | null;
}

type Result =
  | { ok: true; order: TrackedOrder }
  | { ok: false; message: string };

// The customer-facing milestones, in order. Internal statuses (draft) are left
// out; cancelled/refunded are terminal and shown as their own note.
const TIMELINE: OrderStatus[] = [
  "pending_payment",
  "paid",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

function Timeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled" || status === "refunded") {
    return (
      <p className="text-muted text-sm">
        Diese Bestellung wurde {STATUS_LABEL[status].toLowerCase()}.
      </p>
    );
  }
  const currentIndex = TIMELINE.indexOf(status);
  return (
    <ol className="space-y-3">
      {TIMELINE.map((step, index) => {
        const done = index <= currentIndex;
        return (
          <li key={step} className="flex items-center gap-3">
            <span
              className={
                done
                  ? "bg-brand text-white"
                  : "bg-elevated text-muted border-border border"
              }
              style={{ borderRadius: 9999, padding: 4, display: "inline-flex" }}
            >
              <CheckCircle2 className="size-4" aria-hidden="true" />
            </span>
            <span className={done ? "text-text text-sm font-medium" : "text-muted text-sm"}>
              {STATUS_LABEL[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function TrackingView() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/bestellung/verfolgen", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), email: email.trim() }),
      });
      setResult((await response.json()) as Result);
    } catch {
      setResult({ ok: false, message: "Netzwerkfehler. Bitte erneut versuchen." });
    } finally {
      setLoading(false);
    }
  };

  const order = result?.ok ? result.order : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-8">
      <Card className="lg:self-start">
        <CardContent className="pt-6">
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="ordernr">Bestellnummer</Label>
              <Input
                id="ordernr"
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                placeholder="2026-000123"
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ihre@email.de"
                className="mt-1"
              />
            </div>
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Suche …
                </>
              ) : (
                "Bestellung verfolgen"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div aria-live="polite">
        {result?.ok === false && (
          <Card>
            <CardContent className="text-danger flex items-start gap-2 py-6 text-sm">
              <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{result.message}</span>
            </CardContent>
          </Card>
        )}

        {order && (
          <Card>
            <CardContent className="space-y-6 py-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-muted text-xs">Bestellnummer</p>
                  <p className="text-text font-mono font-medium">{order.orderNumber}</p>
                </div>
                <span className="bg-brand/10 text-brand inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium">
                  <Package className="size-4" aria-hidden="true" />
                  {order.statusLabel}
                </span>
              </div>

              <Timeline status={order.status} />

              {order.tracking && (
                <div className="border-border rounded-lg border p-4 text-sm">
                  <p className="text-text flex items-center gap-2 font-medium">
                    <Truck className="text-brand size-4" aria-hidden="true" />
                    {order.tracking.carrier}: {order.tracking.number}
                  </p>
                  {order.tracking.url && (
                    <a
                      href={order.tracking.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand mt-1 inline-block"
                    >
                      Sendung beim Versanddienstleister verfolgen
                    </a>
                  )}
                </div>
              )}

              <p className="text-muted text-xs">Bestellwert: {formatPrice(order.totalCents)}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

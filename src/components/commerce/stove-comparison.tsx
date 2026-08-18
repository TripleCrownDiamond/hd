"use client";

import Link from "next/link";
import Image from "next/image";
import { GitCompareArrows, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { media } from "@/lib/media";
import { COMPARE_LIMIT, useShortlists } from "@/lib/shortlists/shortlist-store";
import { ComparisonLoading } from "@/components/ui/loading-states";

export interface ComparableStove {
  slug: string;
  model: string;
  brand: string;
  image: string | null;
  priceCents: number | null;
  powerKwNominal: number | null;
  powerKwMin: number | null;
  powerKwMax: number | null;
  efficiencyPct: number | null;
  energyClass: string | null;
  fuel: string | null;
  heightMm: number | null;
  widthMm: number | null;
  depthMm: number | null;
  weightKg: number | null;
  flueDiameterMm: number | null;
}

function euro(cents: number | null) {
  return cents == null
    ? "Auf Anfrage"
    : new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

const DASH = "—";

function power(stove: ComparableStove) {
  if (stove.powerKwMin != null && stove.powerKwMax != null) {
    return `${stove.powerKwMin}–${stove.powerKwMax} kW`;
  }
  return stove.powerKwNominal != null ? `${stove.powerKwNominal} kW` : DASH;
}

const ROWS: Array<{ label: string; value: (stove: ComparableStove) => string }> = [
  { label: "Preis", value: (s) => euro(s.priceCents) },
  { label: "Nennwärmeleistung", value: power },
  { label: "Wirkungsgrad", value: (s) => (s.efficiencyPct != null ? `${s.efficiencyPct} %` : DASH) },
  { label: "Energieeffizienzklasse", value: (s) => s.energyClass ?? DASH },
  { label: "Brennstoff", value: (s) => s.fuel ?? DASH },
  { label: "Höhe", value: (s) => (s.heightMm != null ? `${s.heightMm} mm` : DASH) },
  { label: "Breite", value: (s) => (s.widthMm != null ? `${s.widthMm} mm` : DASH) },
  { label: "Tiefe", value: (s) => (s.depthMm != null ? `${s.depthMm} mm` : DASH) },
  { label: "Gewicht", value: (s) => (s.weightKg != null ? `${s.weightKg} kg` : DASH) },
  {
    label: "Rauchrohr Ø",
    value: (s) => (s.flueDiameterMm != null ? `${s.flueDiameterMm} mm` : DASH),
  },
];

export function StoveComparison() {
  const { compare, remove, clear, hydrated } = useShortlists();

  if (!hydrated) return <ComparisonLoading />;

  const selected = compare
    .filter((entry) => entry.kind === "stove")
    .map<ComparableStove>((entry) => ({
      slug: entry.slug,
      model: entry.name,
      brand: entry.brand ?? DASH,
      image: entry.image ?? null,
      priceCents: entry.priceCents ?? null,
      powerKwNominal: entry.comparison?.powerKwNominal ?? null,
      powerKwMin: entry.comparison?.powerKwMin ?? null,
      powerKwMax: entry.comparison?.powerKwMax ?? null,
      efficiencyPct: entry.comparison?.efficiencyPct ?? null,
      energyClass: entry.comparison?.energyClass ?? null,
      fuel: entry.comparison?.fuel ?? null,
      heightMm: entry.comparison?.heightMm ?? null,
      widthMm: entry.comparison?.widthMm ?? null,
      depthMm: entry.comparison?.depthMm ?? null,
      weightKg: entry.comparison?.weightKg ?? null,
      flueDiameterMm: entry.comparison?.flueDiameterMm ?? null,
    }));

  return (
    <div className="bg-elevated/40">
      <div className="container-catalog py-8 md:py-12">
        <Breadcrumbs
          items={[
            { label: "Startseite", href: "/" },
            { label: "Kaminöfen", href: "/kaminoefen" },
            { label: "Vergleich" },
          ]}
          className="mb-6"
        />

        <Card className="mb-6 p-0">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="flex items-start gap-3">
              <div
                className="bg-brand/5 flex size-12 shrink-0 items-center justify-center rounded-lg"
                aria-hidden="true"
              >
                <GitCompareArrows className="text-brand size-6" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="font-display text-text text-3xl leading-tight font-semibold">
                  Kaminöfen vergleichen
                </h1>
                <p className="text-muted mt-2 max-w-2xl text-sm">
                  Bis zu {COMPARE_LIMIT} Modelle nebeneinander. Angaben noch in Prüfung.
                </p>
              </div>
            </div>
            {selected.length > 0 && (
              <Button variant="secondary" size="sm" onClick={() => clear("compare")}>
                Vergleich leeren
              </Button>
            )}
          </CardContent>
        </Card>

        {selected.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <p className="text-text font-medium">Noch keine Modelle im Vergleich.</p>
              <p className="text-muted mt-2 text-sm">
                Wählen Sie im Katalog bis zu {COMPARE_LIMIT} Kaminöfen über das
                Vergleichs-Symbol aus.
              </p>
              <Button asChild className="mt-6">
                <Link href="/kaminoefen">Zum Katalog</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="border-border bg-surface w-full min-w-[46rem] border-collapse rounded-xl border text-sm">
              <caption className="sr-only">Technischer Vergleich der gewählten Kaminöfen</caption>
              <thead>
                <tr>
                  <th scope="col" className="border-border w-40 border-b p-4 text-left">
                    <span className="sr-only">Merkmal</span>
                  </th>
                  {selected.map((stove) => (
                    <th
                      key={stove.slug}
                      scope="col"
                      className="border-border border-b border-l p-4 text-left align-top"
                    >
                      <div className="bg-elevated relative mb-3 aspect-square overflow-hidden rounded-md">
                        {stove.image && (
                          <Image
                            src={media(stove.image, { width: 320, height: 320, crop: "fill" })}
                            alt=""
                            fill
                            sizes="200px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <p className="text-muted text-xs font-semibold tracking-wider uppercase">
                        {stove.brand}
                      </p>
                      <Link
                        href={`/kaminofen/${stove.slug}`}
                        className="text-text hover:text-accent font-display mt-1 block text-sm font-semibold"
                      >
                        {stove.model}
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove("compare", stove.slug)}
                        className="text-muted hover:text-text focus-visible:outline-accent mt-2 inline-flex items-center gap-1 text-xs focus-visible:outline-3 focus-visible:outline-offset-2"
                      >
                        <X className="size-3" aria-hidden="true" />
                        Entfernen
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label} className="even:bg-elevated/40">
                    <th scope="row" className="text-muted border-border border-b p-4 text-left font-medium">
                      {row.label}
                    </th>
                    {selected.map((stove) => (
                      <td
                        key={stove.slug}
                        className="border-border text-text border-b border-l p-4 font-mono tabular-nums"
                      >
                        {row.value(stove)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { Flame, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrapedStoveCard } from "@/components/commerce/scraped-stove-card";
import { CatalogEmptyState } from "@/components/commerce/catalog-empty-state";
import { CatalogFilters, type FilterGroup } from "@/components/commerce/catalog-filters";
import { Pagination, paginate } from "@/components/commerce/pagination";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { getPublishedStoves } from "@/lib/products/catalog";
import type { ScrapedProduct } from "@/lib/products/scraped";

export const dynamic = "force-dynamic";

/**
 * Facets are counted from the stoves actually rendered. Fixed counts would
 * misstate the catalogue as soon as a manufacturer source changes.
 */
function powerBand(stove: ScrapedProduct): string | null {
  const kw = stove.technical.power_kw_nominal ?? stove.technical.power_kw_max;
  if (kw == null) return null;
  if (kw < 6) return "bis 6 kW";
  if (kw < 8) return "6 – 8 kW";
  if (kw < 10) return "8 – 10 kW";
  return "ab 10 kW";
}

/** Facet definitions drive both the sidebar and the server-side filtering. */
const FACETS: Array<{
  id: string;
  param: string;
  title: string;
  limit: number;
  pick: (stove: ScrapedProduct) => string | null;
}> = [
  { id: "brand", param: "marke", title: "Marke", limit: 12, pick: (s) => s.brand || null },
  { id: "power", param: "leistung", title: "Leistung", limit: 4, pick: powerBand },
  {
    id: "energyClass",
    param: "energieklasse",
    title: "Energieklasse",
    limit: 8,
    pick: (s) => s.technical.energy_class,
  },
  { id: "fuel", param: "brennstoff", title: "Brennstoff", limit: 8, pick: (s) => s.technical.fuel },
  {
    id: "flue",
    param: "rauchrohr",
    title: "Rauchrohr Ø",
    limit: 8,
    pick: (s) => (s.technical.flue_diameter_mm ? `${s.technical.flue_diameter_mm} mm` : null),
  },
];

function buildFilterGroups(stoves: ScrapedProduct[]): FilterGroup[] {
  return FACETS.map(({ id, param, title, limit, pick }): FilterGroup | null => {
    const counts = new Map<string, number>();
    for (const stove of stoves) {
      const value = pick(stove);
      if (!value) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    if (counts.size === 0) return null;
    return {
      id,
      param,
      title,
      options: [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "de-DE"))
        .slice(0, limit)
        .map(([label, count]) => ({ value: label.toLowerCase(), label, count })),
    };
  }).filter((group): group is FilterGroup => group !== null);
}

export default async function KaminoefenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const all = await getPublishedStoves();
  // Facets always describe the full catalogue so a narrowed view stays escapable.
  const filterGroups = buildFilterGroups(all);

  const stoves = all.filter((stove) =>
    FACETS.every(({ param, pick }) => {
      const raw = params[param];
      const wanted = Array.isArray(raw) ? raw[0] : raw;
      return !wanted || pick(stove) === wanted;
    }),
  );
  const isFiltered = stoves.length !== all.length;
  // Rendering 1 300 cards took minutes; one page at a time keeps it usable.
  const slice = paginate(stoves, params.seite);
  return (
    <div className="bg-elevated/40">
      <div className="container-catalog py-8 md:py-12">
        <Breadcrumbs
          items={[
            { label: "Startseite", href: "/" },
            { label: "Kaminöfen" },
          ]}
          className="mb-6"
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
          <aside aria-label="Filter" className="lg:sticky lg:top-28 lg:self-start">
            <CatalogFilters groups={filterGroups} />
          </aside>

          <div className="min-w-0">
            <Card className="mb-6 p-0">
              <CardContent className="flex flex-wrap items-start justify-between gap-4 p-6">
                <div className="flex items-start gap-3">
                  <div
                    className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-brand text-white"
                    aria-hidden="true"
                  >
                    <Flame className="size-6 text-accent" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h1 className="font-display text-3xl font-semibold leading-tight text-text">
                      Kaminöfen
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-muted">
                      Herstellerdaten im Prüfmodus: Leistung, Wirkungsgrad,
                      Brennstoff und Abmessungen. Noch nicht zum Verkauf freigegeben.
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline">
                  <Link href="/kaminoefen/vergleich">
                    <GitCompareArrows className="size-4" />
                    Vergleich ansehen
                  </Link>
                </Button>
              </CardContent>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-elevated/40 px-6 py-3">
                <p className="text-sm text-muted">
                  <span className="font-mono font-semibold tabular-nums text-text">
                    {stoves.length}
                  </span>{" "}
                  {stoves.length === 1 ? "Produkt" : "Produkte"}
                  {isFiltered && <> von {all.length}</>}
                  {slice.pageCount > 1 && (
                    <> · Seite {slice.page} von {slice.pageCount}</>
                  )}
                </p>
                <p className="text-muted text-xs">Sortierung: Modelle mit Preis zuerst</p>
              </div>
            </Card>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {slice.items.length > 0 ? (
                slice.items.map((stove, index) => (
                  <ScrapedStoveCard key={stove.slug} product={stove} priority={index === 0} />
                ))
              ) : (
                <CatalogEmptyState />
              )}
            </div>

            <Pagination slice={slice} basePath="/kaminoefen" searchParams={params} />

          </div>
        </div>
      </div>
    </div>
  );
}

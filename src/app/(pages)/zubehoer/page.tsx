import { Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { WoodProductCard } from "@/components/commerce/wood-product-card";
import { CatalogEmptyState } from "@/components/commerce/catalog-empty-state";
import { CatalogFilters, type FilterGroup } from "@/components/commerce/catalog-filters";
import { Pagination, paginate } from "@/components/commerce/pagination";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  getPublishedCardProducts,
  type StorefrontProduct,
  type WoodCatalogProduct,
} from "@/lib/products/catalog";

export const dynamic = "force-dynamic";

/** Counted from the catalogue; a fixed list would advertise empty facets. */
function buildFilterGroups(products: StorefrontProduct[]): FilterGroup[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    if (!product.brand) continue;
    counts.set(product.brand, (counts.get(product.brand) ?? 0) + 1);
  }
  if (counts.size === 0) return [];
  return [
    {
      id: "brand",
      param: "lieferant",
      title: "Lieferant",
      options: [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "de-DE"))
        .map(([label, count]) => ({ value: label.toLowerCase(), label, count })),
    },
  ];
}

export default async function ZubehoerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const all = (await getPublishedCardProducts("accessory")) as StorefrontProduct[];
  const filterGroups = buildFilterGroups(all);
  const supplierRaw = params.lieferant;
  const supplier = Array.isArray(supplierRaw) ? supplierRaw[0] : supplierRaw;
  const accessoryProducts = supplier
    ? all.filter((product) => product.brand === supplier)
    : all;
  const slice = paginate(accessoryProducts, params.seite);
  return (
    <div className="bg-elevated/40">
      <div className="container-catalog py-8 md:py-12">
        <Breadcrumbs
          items={[
            { label: "Startseite", href: "/" },
            { label: "Zubehör" },
          ]}
          className="mb-6"
        />

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
          <aside aria-label="Filter" className="lg:sticky lg:top-28 lg:self-start">
            <CatalogFilters groups={filterGroups} />
          </aside>

          <div className="min-w-0">
            <Card className="mb-6 p-0">
              <CardContent className="flex flex-wrap items-start justify-between gap-4 p-6">
                <div className="flex items-start gap-3">
                  <div
                    className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-brand/5"
                    aria-hidden="true"
                  >
                    <Wrench className="size-6 text-brand" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h1 className="font-display text-3xl font-semibold leading-tight text-text">
                      Ofenzubehör
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-muted">
                      Zubehör von geprüften Lieferanten. Angaben und Preise stammen direkt
                      von der Quelle.
                    </p>
                  </div>
                </div>
              </CardContent>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-elevated/40 px-6 py-3">
                <p className="text-sm text-muted">
                  <span className="font-mono font-semibold tabular-nums text-text">
                    {accessoryProducts.length}
                  </span>{" "}
                  Produkte
                  {slice.pageCount > 1 && (
                    <> · Seite {slice.page} von {slice.pageCount}</>
                  )}
                </p>
                <p className="text-muted text-xs">
                  Lieferantendaten in Prüfung — noch nicht zum Verkauf freigegeben.
                </p>
              </div>
            </Card>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {slice.items.length > 0 ? (
                slice.items.map((product, index) => (
                  <WoodProductCard
                    key={product.id}
                    product={product as WoodCatalogProduct}
                    priority={index === 0}
                  />
                ))
              ) : (
                <CatalogEmptyState />
              )}
            </div>

            <Pagination slice={slice} basePath="/zubehoer" searchParams={params} />
          </div>
        </div>
      </div>
    </div>
  );
}

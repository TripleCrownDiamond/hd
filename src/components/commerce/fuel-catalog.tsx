import { TreeDeciduous } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { WoodProductCard } from "@/components/commerce/wood-product-card";
import { CatalogEmptyState } from "@/components/commerce/catalog-empty-state";
import { CatalogFilters, type FilterGroup } from "@/components/commerce/catalog-filters";
import { Pagination, paginate } from "@/components/commerce/pagination";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { getFuelProducts, type FuelKind, type WoodCatalogProduct } from "@/lib/products/catalog";

const NOT_DECLARED = "Nicht angegeben";

/**
 * Facets are counted from the products actually on the page. Hard-coded counts
 * would misstate the catalogue as soon as a source changes.
 */
function buildFilterGroups(products: WoodCatalogProduct[]): FilterGroup[] {
  const facet = (
    id: string,
    param: string,
    title: string,
    pick: (product: WoodCatalogProduct) => string,
  ): FilterGroup | null => {
    const counts = new Map<string, number>();
    for (const product of products) {
      const value = pick(product);
      if (!value || value === NOT_DECLARED) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    if (counts.size === 0) return null;
    const options = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "de-DE"))
      .slice(0, 8)
      .map(([label, count]) => ({ value: label.toLowerCase(), label, count }));
    return { id, param, title, options };
  };

  return [
    facet("woodType", "holzart", "Holzart", (p) => p.woodType),
    facet("length", "laenge", "Länge", (p) => p.length),
    facet("moisture", "feuchte", "Restfeuchte", (p) => p.moisture),
    facet("unit", "einheit", "Einheit", (p) => p.unit),
  ].filter((group): group is FilterGroup => group !== null);
}

export interface FuelCatalogProps {
  kind: FuelKind;
  title: string;
  description: string;
  /** Route the pagination links point back at. */
  basePath: string;
  /** `holzart`, `laenge`, `feuchte`, `einheit` — the facets the mega menu links to. */
  searchParams?: Record<string, string | string[] | undefined>;
}

function firstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function FuelCatalog({
  kind,
  title,
  description,
  basePath,
  searchParams,
}: FuelCatalogProps) {
  const all = await getFuelProducts(kind);

  const woodType = firstValue(searchParams?.holzart);
  const length = firstValue(searchParams?.laenge);
  const moisture = firstValue(searchParams?.feuchte);
  const unit = firstValue(searchParams?.einheit);

  const products = all.filter(
    (product) =>
      (!woodType || product.woodType === woodType) &&
      (!length || product.length === length) &&
      (!moisture || product.moisture === moisture) &&
      (!unit || product.unit === unit),
  );
  const isFiltered = products.length !== all.length;
  const slice = paginate(products, searchParams?.seite);

  // Facets always describe the unfiltered catalogue so a narrowed view still
  // offers a way back out.
  const filterGroups = buildFilterGroups(all);

  return (
    <div className="bg-elevated/40">
      <div className="container-catalog py-8 md:py-12">
        <Breadcrumbs
          items={[{ label: "Startseite", href: "/" }, { label: title }]}
          className="mb-6"
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
          <aside aria-label="Filter" className="lg:sticky lg:top-28 lg:self-start">
            {filterGroups.length > 0 && <CatalogFilters groups={filterGroups} />}
          </aside>

          <div className="min-w-0">
            <Card className="mb-6 p-0">
              <CardContent className="flex flex-wrap items-start justify-between gap-4 p-6">
                <div className="flex items-start gap-3">
                  <div
                    className="bg-brand/5 flex size-12 shrink-0 items-center justify-center rounded-lg"
                    aria-hidden="true"
                  >
                    <TreeDeciduous className="text-brand size-6" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h1 className="font-display text-text text-3xl leading-tight font-semibold">
                      {title}
                    </h1>
                    <p className="text-muted mt-2 max-w-2xl text-sm">{description}</p>
                  </div>
                </div>
              </CardContent>
              <div className="border-border bg-elevated/40 flex flex-wrap items-center justify-between gap-3 border-t px-6 py-3">
                <p className="text-muted text-sm">
                  <span className="text-text font-mono font-semibold tabular-nums">
                    {products.length}
                  </span>{" "}
                  {products.length === 1 ? "Produkt" : "Produkte"}
                  {isFiltered && <> von {all.length}</>}
                  {slice.pageCount > 1 && (
                    <> · Seite {slice.page} von {slice.pageCount}</>
                  )}
                </p>

              </div>
            </Card>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {slice.items.length > 0 ? (
                slice.items.map((product, index) => (
                  <WoodProductCard
                    key={product.id}
                    product={product}
                    priority={index === 0}
                  />
                ))
              ) : (
                <CatalogEmptyState />
              )}
            </div>

            <Pagination slice={slice} basePath={basePath} searchParams={searchParams} />
          </div>
        </div>
      </div>
    </div>
  );
}

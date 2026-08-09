import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { media } from "@/lib/media";
import { formatPrice } from "@/lib/utils";
import { getWoodProductBySlug } from "@/lib/products/catalog";
import { ProductActions } from "@/components/commerce/product-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getWoodProductBySlug(slug);
  // The root layout already appends the brand to the title template.
  if (!product) return { title: "Produkt nicht gefunden" };
  return {
    title: product.name,
    description: product.description || undefined,
  };
}

export default async function ProduktDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getWoodProductBySlug(slug);
  if (!product) notFound();

  const hasPublicPrice = product.priceCents > 0;
  const NOT_DECLARED = "Nicht angegeben";

  const woodDeclaration: Array<[string, string]> = [
    ["Holzart", product.woodType],
    ["Länge", product.length],
    ["Restfeuchte", product.moisture],
    ["Einheit", product.unit],
    ["Menge", product.quantity],
    // Packaging falls back to the unit label; showing it twice adds nothing.
    ...(product.packaging !== product.unit
      ? ([["Verpackung", product.packaging]] as Array<[string, string]>)
      : []),
    ["Herkunft", product.origin],
  ];

  // Only show what the source actually declared: an empty row or a column of
  // "Nicht angegeben" tells the visitor nothing and reads as a broken page.
  const declared = woodDeclaration.filter(([, value]) => value && value !== NOT_DECLARED);
  const isWoodDeclared = declared.length > 0;

  // The declaration and the shop's own table are complementary: a pellet
  // declaration names the essence and the quantity, while the table adds
  // Aschegehalt, Schüttdichte, Feinanteil and the certification — the figures
  // a buyer compares. Showing only one of the two threw the other away.
  const seen = new Set(
    declared.flatMap(([label, value]) => [label.toLowerCase(), value.toLowerCase()]),
  );
  const extraSpecs = product.sourceSpecs.filter(([label, value]) => {
    if (seen.has(label.toLowerCase()) || seen.has(value.toLowerCase())) return false;
    seen.add(label.toLowerCase());
    return true;
  });

  const facts = isWoodDeclared ? [...declared, ...extraSpecs] : product.sourceSpecs;
  const factsTitle = isWoodDeclared ? "Deklaration" : "Technische Daten";

  const PARENTS: Record<string, { label: string; href: string } | undefined> = {
    wood: { label: "Brennholz", href: "/brennholz" },
    kindling: { label: "Anzündholz", href: "/anzuendholz" },
    briquette: { label: "Holzbriketts", href: "/holzbriketts" },
    pellet: { label: "Holzpellets", href: "/holzpellets" },
    coal: { label: "Kohle & Grillkohle", href: "/kohle" },
    accessory: { label: "Ofenzubehör", href: "/zubehoer" },
  };
  const parent = PARENTS[product.type] ?? { label: "Brennholz", href: "/brennholz" };

  return (
    <div className="bg-elevated/40">
      <div className="container-catalog py-8 md:py-12">
        <Breadcrumbs
          items={[
            { label: "Startseite", href: "/" },
            // This route serves every non-stove product, so the parent depends
            // on the kind rather than always being firewood.
            { label: parent.label, href: parent.href },
            { label: product.name },
          ]}
          className="mb-6"
        />

        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="overflow-hidden p-0">
            <div className="bg-surface relative aspect-square">
              {product.image ? (
                <Image
                  src={media(product.image, { width: 1000, height: 1000, crop: "fill" })}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                  priority
                />
              ) : null}
              <Badge
                variant="brand"
                className="absolute top-4 left-4 border border-white/20 shadow-sm"
              >
                Lieferantendaten
              </Badge>
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 p-3">
                {product.images.slice(1, 5).map((publicId) => (
                  <div
                    key={publicId}
                    className="bg-surface border-border relative aspect-square overflow-hidden rounded-md border"
                  >
                    <Image
                      src={media(publicId, { width: 240, height: 240, crop: "fill" })}
                      alt=""
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div>
            {product.brand && (
              <p className="text-muted text-xs font-semibold tracking-wider uppercase">
                {product.brand}
              </p>
            )}
            <h1 className="font-display text-text mt-1 text-3xl leading-tight font-semibold">
              {product.name}
            </h1>

            <p className="text-text mt-6 font-mono text-3xl font-semibold tabular-nums">
              {hasPublicPrice ? formatPrice(product.priceCents) : "Auf Anfrage"}
            </p>
            <p className="text-muted mt-1 text-sm">
              {hasPublicPrice
                ? "inkl. MwSt. · Preis der Lieferantenquelle. Versand und Lieferzone sind noch nicht kalkuliert."
                : "Der Preis wird nach abgeschlossener Prüfung veröffentlicht."}
            </p>

            <ProductActions
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                brand: product.brand,
                image: product.image,
                type: product.type,
                priceCents: product.priceCents,
                basePriceCents: product.basePriceCents,
                basePriceUnit: product.basePriceUnit,
                reviewStatus: product.reviewStatus,
              }}
            />

            <Separator className="my-6" />

            <h2 className="font-display text-text text-lg font-semibold">{factsTitle}</h2>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              {facts.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-text font-medium">{value}</dd>
                </div>
              ))}
            </dl>

            {product.longDescription && (
              <>
                <Separator className="my-6" />
                <h2 className="font-display text-text text-lg font-semibold">Beschreibung</h2>
                <p className="text-muted mt-2 text-sm leading-relaxed">
                  {product.longDescription}
                </p>
              </>
            )}

            <Card className="mt-6 p-0">
              <CardContent className="p-4">
                <p className="text-muted text-sm">
                  Dieser Eintrag stammt aus einer Lieferantenquelle und befindet sich in der
                  Katalogprüfung ({product.reviewStatus}). Bestellung und Lieferung sind noch
                  nicht freigeschaltet.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

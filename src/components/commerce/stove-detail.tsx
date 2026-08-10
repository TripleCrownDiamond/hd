"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Download,
  Heart,
  GitCompareArrows,
  ShoppingCart,
  Play,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { media } from "@/lib/media";
import type { ScrapedProduct, ScrapedVariant } from "@/lib/products/scraped";
import { useCart } from "@/lib/cart/cart-store";
import { useShortlists, type ShortlistEntry } from "@/lib/shortlists/shortlist-store";

interface GalleryItem {
  key: string;
  cldPid: string | null;
  source: string | null;
  label?: string;
  isVideo?: boolean;
}

export function StoveDetail({ product }: { product: ScrapedProduct }) {
  const [variantIdx, setVariantIdx] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const { add } = useCart();
  const { has, toggle, hydrated, compareIsFull } = useShortlists();
  const variant: ScrapedVariant | undefined = product.variants[variantIdx];
  const isPreview = product.review_status !== "approved";
  const hasPublicPrice =
    !product.pricing.quote_mode &&
    product.pricing.price_cents_public != null;
  const href = `/kaminofen/${product.slug}`;
  const variantPriceCents =
    (product.pricing.price_cents_public ?? 0) + (variant?.surcharge_cents ?? 0);
  const canAddToCart = !isPreview && hasPublicPrice;
  const isFavorite = hydrated && has("wishlist", product.slug);
  const inCompare = hydrated && has("compare", product.slug);
  const shortlistEntry: ShortlistEntry = {
    slug: product.slug,
    name: product.model,
    brand: product.brand,
    image: product.media_cloudinary?.variants[variantIdx]?.main ?? product.media_cloudinary?.hero ?? undefined,
    priceCents: hasPublicPrice ? variantPriceCents : undefined,
    href,
    kind: "stove",
    comparison: {
      powerKwNominal: product.technical.power_kw_nominal,
      powerKwMin: product.technical.power_kw_min,
      powerKwMax: product.technical.power_kw_max,
      efficiencyPct: product.technical.efficiency_pct,
      energyClass: product.technical.energy_class,
      fuel: product.technical.fuel,
      heightMm: product.technical.dimensions_mm.height,
      widthMm: product.technical.dimensions_mm.width,
      depthMm: product.technical.dimensions_mm.depth,
      weightKg: product.technical.weight_kg,
      flueDiameterMm: product.technical.flue_diameter_mm,
    },
  };

  // Build ordered gallery: variant main first, then extras that match the variant colour,
  // then the video, then remaining product-wide shots.
  const items: GalleryItem[] = useMemo(() => {
    return buildGallery(product, variantIdx);
  }, [product, variantIdx]);

  const selectedItem =
    items.find((i) => i.key === selectedKey) ?? items[0] ?? null;

  const heroUrl = selectedItem?.cldPid
    ? media(selectedItem.cldPid, { width: 1200, height: 1200, crop: "fill" })
    : selectedItem?.source ?? null;
  const heroIsVideo = !!selectedItem?.isVideo;
  const useCloudinary = !!selectedItem?.cldPid;

  const swatchFor = (i: number): string | null => {
    // If we've published to Cloudinary, only trust the Cloudinary URL.
    // A null public_id means the upload failed (probably a 404 on the source),
    // so we must NOT fall back to the source URL — that's what caused the broken image.
    if (product.media_cloudinary) {
      const pid = product.media_cloudinary.variants[i]?.swatch;
      return pid ? media(pid, { width: 120, crop: "fill" }) : null;
    }
    return product.variants[i]?.swatch_url_source ?? null;
  };

  // Some manufacturer variants have no matching image (rare colour codes). Filter them
  // out so the swatch strip never shows a "no image" placeholder that looks broken.
  const displayVariants = product.variants
    .map((v, i) => ({ v, i, hasImage: hasVariantImage(product, i) }))
    .filter((x) => x.hasImage);

  const extra = product.technical.extra as Record<string, unknown>;
  const specs: Array<[string, string | null]> = [
    ["Wärmeleistung", formatPower(product.technical)],
    ["Wirkungsgrad", product.technical.efficiency_pct != null ? `${product.technical.efficiency_pct} %` : null],
    ["Energieeffizienzklasse", isPreview ? null : product.technical.energy_class],
    ["Brennstoff", product.technical.fuel],
    ["Gesamthöhe", mm(product.technical.dimensions_mm.height)],
    ["Gesamtbreite", mm(product.technical.dimensions_mm.width)],
    ["Gesamttiefe", mm(product.technical.dimensions_mm.depth)],
    ["Rauchrohr Ø", mm(product.technical.flue_diameter_mm)],
    ["Raumluftunabhängig (RLU)", product.technical.raw_air_independent],
  ];

  // `extra` arrives already flattened and stripped of import bookkeeping (see
  // publicExtra in lib/products/catalog.ts). The guards below are a second line
  // of defence: rendering the raw column printed supplier URLs and
  // "[object Object]" rows on the page.
  const extraSpecs = Object.entries(extra)
    .filter(([k]) => !CANONICAL_SPEC_KEYS.has(k))
    .filter(([k]) => !INTERNAL_EXTRA_KEYS.has(k))
    // Only scalar values are presentable as a spec row.
    .filter(([, v]) => (typeof v === "string" || typeof v === "number") && v !== "")
    .filter(([k]) => !k.startsWith("Farbe"))
    .filter(([k]) => !k.startsWith("Nutzer-Benefits"))
    .filter(([k]) => !k.startsWith("CAIR"))
    .filter(([k]) => !k.startsWith("Stilwelt"));

  const benefits = asStringArray(extra["Nutzer-Benefits"]);
  const style = asStringArray(extra["Stilwelt"]);
  const cair = asStringArray(extra["CAIR Kamin-Assistenzfunktionen"]);

  return (
    <div className="bg-elevated/40">
      <div className="container-site py-8 md:py-12">
        <nav className="mb-6 text-sm text-muted" aria-label="Brotkrümelnavigation">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-text">Startseite</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/kaminoefen" className="hover:text-text">Kaminöfen</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-text">{product.model}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
          <div>
            <Card className="overflow-hidden p-0">
              <div className="relative aspect-square bg-surface">
                {heroUrl && !heroIsVideo && (
                  <Image
                    src={heroUrl}
                    alt={`${product.model} — ${variant?.label_de ?? ""}`.trim()}
                    fill
                    priority
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className="object-cover"
                    unoptimized={!useCloudinary}
                  />
                )}
                {heroIsVideo && heroUrl && (
                  <video
                    src={heroUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full object-contain p-6"
                  />
                )}
                {isPreview ? (
                  <Badge variant="warning" className="absolute left-4 top-4">
                    Vorschau · ungeprüft
                  </Badge>
                ) : product.technical.energy_class ? (
                  <Badge variant="brand" className="absolute left-4 top-4">
                    {product.technical.energy_class}
                  </Badge>
                ) : null}
                {!heroUrl && (
                  <div className="flex h-full items-center justify-center text-muted">
                    <ImageIcon className="size-12 opacity-30" />
                  </div>
                )}
              </div>
            </Card>

            {items.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {items.map((it) => {
                  const thumbUrl = it.cldPid
                    ? media(it.cldPid, { width: 220, height: 220, crop: "fill" })
                    : it.source;
                  const isSelected = it.key === (selectedItem?.key ?? items[0]?.key);
                  return (
                    <button
                      key={it.key}
                      type="button"
                      onClick={() => setSelectedKey(it.key)}
                      aria-label={it.label ?? "Weitere Ansicht"}
                      aria-pressed={isSelected}
                      className={cn(
                        "relative aspect-square overflow-hidden rounded-lg border-2 transition-all focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2",
                        isSelected
                          ? "border-brand ring-2 ring-brand/20"
                          : "border-border hover:border-brand/50",
                      )}
                    >
                      {it.isVideo ? (
                        <div className="flex h-full items-center justify-center bg-brand text-accent">
                          <Play className="size-6" />
                        </div>
                      ) : thumbUrl ? (
                        <Image
                          src={thumbUrl}
                          alt=""
                          fill
                          sizes="120px"
                          className="object-cover"
                          unoptimized={!it.cldPid}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}

            {displayVariants.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  Farbe: <span className="text-text">{variant?.label_de ?? "—"}</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  {displayVariants.map(({ v, i }) => {
                    const sw = swatchFor(i);
                    return (
                      <button
                        key={v.code}
                        type="button"
                        onClick={() => {
                          setVariantIdx(i);
                          setSelectedKey(null);
                        }}
                        aria-label={`Farbe wählen: ${v.label_de}`}
                        aria-pressed={i === variantIdx}
                        title={v.label_de}
                        className={cn(
                          "relative flex size-14 items-center justify-center overflow-hidden rounded-lg border-2 transition-all focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2",
                          i === variantIdx
                            ? "border-brand ring-2 ring-brand/20"
                            : "border-border hover:border-brand/50",
                          !sw && "bg-elevated",
                        )}
                      >
                        {sw ? (
                          <Image
                            src={sw}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="px-1 text-center text-[10px] font-medium leading-tight text-muted">
                            {v.label_de}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              {product.brand}
            </p>
            {product.descriptions.subtitle_de && (
              <p className="mt-2 font-display text-lg italic text-muted">
                {product.descriptions.subtitle_de}
              </p>
            )}
            <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-text md:text-4xl">
              {product.model}
            </h1>

            {product.descriptions.short_de && (
              <p className="mt-4 text-lg leading-relaxed text-muted">
                {product.descriptions.short_de}
              </p>
            )}

            {product.descriptions.long_de_raw && (
              <section className="mt-6 border-l-2 border-brand pl-4" aria-labelledby="product-description-heading">
                <h2 id="product-description-heading" className="font-display text-xl font-semibold text-text">
                  Beschreibung
                </h2>
                <div
                  className="prose prose-sm mt-3 max-w-none text-muted"
                  dangerouslySetInnerHTML={{ __html: product.descriptions.long_de_raw }}
                />
              </section>
            )}

            <Card className="mt-6 border-brand/20 bg-brand/5">
              <CardContent className="pt-6">
                <p className="font-mono text-2xl font-semibold tabular-nums text-brand">
                  {hasPublicPrice
                    ? `ab ${formatEuro(product.pricing.price_cents_public!)}`
                    : "Auf Anfrage"}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {hasPublicPrice
                    ? "Herstellerpreis inkl. MwSt.; Ausführung und Zubehör können den Preis verändern."
                    : "Persönliches Angebot mit Zubehör und Montage in Ihrer Region."}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {hasPublicPrice ? (
                    <Button
                      size="lg"
                      className="min-w-0 flex-1"
                      disabled={!canAddToCart}
                      onClick={() =>
                        add({
                          id: `${product.slug}:${variant?.code ?? "default"}`,
                          slug: product.slug,
                          href,
                          name: product.model,
                          variant: variant?.label_de,
                          quantity: 1,
                          priceCents: variantPriceCents,
                          image:
                            selectedItem?.cldPid ??
                            product.media_cloudinary?.variants[variantIdx]?.main ??
                            product.media_cloudinary?.hero ??
                            undefined,
                          imageKind: "stove",
                        })
                      }
                    >
                      In den Warenkorb
                      <ShoppingCart className="size-4" />
                    </Button>
                  ) : (
                    <Button size="lg" className="min-w-0 flex-1" disabled={isPreview}>
                      Angebot anfordern
                      <ArrowRight className="size-4" />
                    </Button>
                  )}
                  <Button
                    size="lg"
                    variant={isFavorite ? "primary" : "secondary"}
                    onClick={() => toggle("wishlist", shortlistEntry)}
                    aria-pressed={isFavorite}
                    aria-label={
                      isFavorite
                        ? `Von Merkliste entfernen: ${product.model}`
                        : `Zur Merkliste hinzufügen: ${product.model}`
                    }
                  >
                    <Heart className={cn("size-4", isFavorite && "fill-current")} />
                  </Button>
                  <Button
                    size="lg"
                    variant={inCompare ? "primary" : "secondary"}
                    disabled={!inCompare && compareIsFull}
                    onClick={() => toggle("compare", shortlistEntry)}
                    aria-pressed={inCompare}
                    aria-label={
                      inCompare
                        ? `Aus dem Vergleich entfernen: ${product.model}`
                        : `Zum Vergleich hinzufügen: ${product.model}`
                    }
                  >
                    <GitCompareArrows className="size-4" />
                  </Button>
                </div>
                {hasPublicPrice && !canAddToCart ? (
                  <p className="mt-3 text-xs text-muted" role="note">
                    Der Warenkorb wird nach Katalogfreigabe aktiviert.
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Auf einen Blick
              </p>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {specs
                  .filter(([, v]) => v != null)
                  .slice(0, 6)
                  .map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-muted">{label}</dt>
                      <dd className="font-medium text-text">{value}</dd>
                    </div>
                  ))}
              </dl>
            </div>

            {benefits.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  Nutzer-Benefits
                </p>
                <ul className="space-y-2 text-sm text-text">
                  {benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                      <span dangerouslySetInnerHTML={{ __html: b }} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-10" />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-display text-2xl font-semibold text-text">
                Technische Daten
              </h2>
              <Accordion type="multiple" defaultValue={["main"]} className="mt-4">
                <AccordionItem value="main">
                  <AccordionTrigger>Kerndaten</AccordionTrigger>
                  <AccordionContent>
                    <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-sm">
                      {specs
                        .filter(([, v]) => v != null)
                        .map(([label, value]) => (
                          <div key={label} className="contents">
                            <dt className="text-muted">{label}</dt>
                            <dd className="text-right font-medium text-text">{value}</dd>
                          </div>
                        ))}
                    </dl>
                  </AccordionContent>
                </AccordionItem>
                {extraSpecs.length > 0 && (
                  <AccordionItem value="extra">
                    <AccordionTrigger>Weitere Merkmale</AccordionTrigger>
                    <AccordionContent>
                      <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-sm">
                        {extraSpecs.map(([k, v]) => (
                          <div key={k} className="contents">
                            <dt className="text-muted">{k}</dt>
                            {/* Rendered as text: these values come from scraped
                                pages and must never be injected as HTML. */}
                            <dd className="text-right font-medium text-text">
                              {decodeEntities(String(v))}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </AccordionContent>
                  </AccordionItem>
                )}
                {cair.length > 0 && (
                  <AccordionItem value="cair">
                    <AccordionTrigger>CAIR Kamin-Assistenzfunktionen</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-1.5 text-sm text-text">
                        {cair.map((c, i) => <li key={i}>· {c}</li>)}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {style.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Stilwelt
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {style.map((s) => (
                      <Badge key={s} variant="default">{s}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {product.documents.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Dateien
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    {product.documents.map((document) => (
                      <Button
                        key={document.id}
                        asChild
                        variant="secondary"
                        size="sm"
                        className="h-auto justify-start py-2 text-left"
                      >
                        <a href={document.download_url} download>
                          <Download className="size-4 shrink-0" />
                          <span>{document.title}</span>
                        </a>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-text">
                  Fachbetrieb-Prüfung erforderlich
                </p>
                <p className="mt-2 text-xs text-muted">
                  Vor Inbetriebnahme muss ein zugelassener Schornsteinfeger die Anlage
                  abnehmen. Wir vermitteln Ihnen einen Fachbetrieb in Ihrer Region.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatEuro(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function buildGallery(product: ScrapedProduct, variantIdx: number): GalleryItem[] {
  const items: GalleryItem[] = [];
  const cldVariant = product.media_cloudinary?.variants[variantIdx];
  const currentVariant = product.variants[variantIdx];

  // 1. Current variant hero
  if (cldVariant?.main || currentVariant?.main_image_url_source) {
    items.push({
      key: `variant-${variantIdx}`,
      cldPid: cldVariant?.main ?? null,
      source: currentVariant?.main_image_url_source ?? null,
      label: currentVariant?.label_de,
    });
  }

  // 2. Extras that share the variant colour token (schwarze_schamotte, feuer, BE, etc.)
  const codeAliases = variantAliases(currentVariant?.code ?? "");
  const gallery = product.media_cloudinary?.gallery ?? [];
  const seen = new Set<string>();
  // Only seed with a real URL: "" was matching every image whose source_url is
  // unknown — including the main product shot, which was then dropped.
  if (currentVariant?.main_image_url_source) seen.add(currentVariant.main_image_url_source);
  // Colour matching only means something when the product actually has colour
  // variants; otherwise step 4 below keeps the catalogue's own order.
  if (currentVariant) {
    for (const g of gallery) {
      if (!g.source_url) continue;
      const b = g.source_url.split("/").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!codeAliases.some((a) => b.includes(a))) continue;
      if (seen.has(g.source_url)) continue;
      seen.add(g.source_url);
      items.push({
        key: `gallery-${g.public_id}`,
        cldPid: g.public_id,
        source: g.source_url,
      });
    }
  }

  // 3. Variant video (still valuable to show the fire animation)
  if (currentVariant?.video_url_source) {
    items.push({
      key: `video-${variantIdx}`,
      cldPid: null,
      source: currentVariant.video_url_source,
      label: "Animation",
      isVideo: true,
    });
  }

  // 4. Remaining product-wide shots. Steps 1-2 only match variant-driven
  // catalogues (Spartherm); without this every other manufacturer showed either
  // nothing or an image unrelated to the card, because the card uses media[0]
  // while the gallery here was filtered by a variant colour that does not exist.
  for (const g of gallery) {
    const key = `gallery-${g.public_id}`;
    if (items.some((item) => item.key === key)) continue;
    items.push({ key, cldPid: g.public_id, source: g.source_url || null });
  }

  return items;
}

function hasVariantImage(product: ScrapedProduct, i: number): boolean {
  const cldMain = product.media_cloudinary?.variants[i]?.main;
  if (product.media_cloudinary) return Boolean(cldMain);
  return Boolean(product.variants[i]?.main_image_url_source);
}

function variantAliases(code: string): string[] {
  const map: Record<string, string[]> = {
    "black-edition": ["be", "blackedition"],
    perle: ["perle", "pearl"],
    weiss: ["weiss", "white"],
    kupfer: ["kupfer", "copper"],
    titan: ["titan"],
    nero: ["nero", "black"],
    elfenbein: ["ivory", "elfenbein"],
  };
  return map[code] ?? [code];
}

/** Scrapes keep the source's HTML entities; decode the handful that matter. */
function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/** Import bookkeeping stored alongside the specs — never shown to a visitor. */
const INTERNAL_EXTRA_KEYS = new Set([
  "sku",
  "ean",
  "product_number",
  "product_type_de",
  "heating_capacity_m2",
  "log_size_mm",
  "safety_distance",
  "nox_mg_nm3",
  "feature_labels",
  "certifications_seen",
  "technical_specs",
  "source_image_urls",
  "source_documents",
  "supplier_contacts_excluded",
  "price_cents_min",
  "price_cents_max",
  "vat_included",
  "variation_axes",
]);

const CANONICAL_SPEC_KEYS = new Set([
  "Wärmeleistung",
  "Wirkungsgrad",
  "Energieeffizienzklasse",
  "Brennstoff",
  "Gesamthöhe",
  "Höhe",
  "Gesamtbreite",
  "Breite",
  "Gesamttiefe",
  "Tiefe",
  "Rauchrohranschluss",
  "Abgasstutzendurchmesser",
  "Abgasstutzenposition",
  "Gewicht",
  "CO-Emission",
  "OGC-Emission",
  "Staub-Emission",
  "Feinstaub",
  "Raumluftunabhängig (RLU)",
]);

function formatPower(t: ScrapedProduct["technical"]): string | null {
  if (t.power_kw_min != null && t.power_kw_max != null) {
    return `${t.power_kw_min} – ${t.power_kw_max} kW`;
  }
  if (t.power_kw_nominal != null) return `${t.power_kw_nominal} kW`;
  return null;
}

function mm(v: number | null): string | null {
  return v == null ? null : `${v} mm`;
}

function asStringArray(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map(String);
  return [String(v)];
}

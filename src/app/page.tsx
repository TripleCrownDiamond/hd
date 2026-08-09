import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ShieldCheck,
  Ruler,
  Lock,
  Truck,
  Flame,
  Package,
  Wrench,
  Search,
  MapPin,
  ShoppingBag,
  PackageCheck,
} from "lucide-react";
import { cld, IMAGES } from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DeliveryChecker } from "@/components/commerce/delivery-checker";
import { WoodProductCard } from "@/components/commerce/wood-product-card";
import { NewsletterForm } from "@/components/commerce/newsletter-form";
import {
  getPublishedCardProducts,
  getPublishedCategories,
  getPublishedStoves,
  type CatalogCategory,
  type WoodCatalogProduct,
} from "@/lib/products/catalog";
import type { ScrapedProduct } from "@/lib/products/scraped";
import { ScrapedStoveCard } from "@/components/commerce/scraped-stove-card";
import { CatalogEmptyState } from "@/components/commerce/catalog-empty-state";
import { ReviewStars } from "@/components/commerce/review-stars";
import { getShopReviews, summarise, type Review } from "@/lib/reviews/reviews";
import { getLatestArticles, type ArticleSummary } from "@/lib/content/articles";
import { getMigrationAwarePublicSupabase } from "@/lib/db/server";

export const dynamic = "force-dynamic";

function Holzschnitt() {
  return (
    <div className="holzschnitt" aria-hidden="true">
      <div className="holzschnitt-segment" style={{ width: "25%" }} />
      <div className="holzschnitt-segment" style={{ width: "12%" }} />
      <div className="holzschnitt-segment" style={{ width: "18%" }} />
      <div className="holzschnitt-segment" style={{ width: "8%" }} />
      <div className="holzschnitt-segment" style={{ width: "22%" }} />
      <div className="holzschnitt-segment" style={{ width: "15%" }} />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="bg-elevated/40 relative overflow-hidden pt-12 pb-14 md:pt-20 md:pb-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--color-brand) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="container-site relative">
        <div className="grid items-center gap-10 md:grid-cols-[7fr_5fr] lg:gap-16">
          <div className="order-2 md:order-1">
            <Badge variant="default" className="bg-brand/5 text-brand mb-5 gap-1.5">
              <span
                className="bg-brand inline-block size-1.5 rounded-full"
                aria-hidden="true"
              />
              Kammergetrocknet · Herkunft Deutschland
            </Badge>
            <h1 className="font-display text-text text-4xl leading-[1.05] font-semibold tracking-tight md:text-5xl lg:text-6xl">
              Wärme, die bei Ihnen ankommt.
            </h1>
            <p className="text-muted mt-5 max-w-xl text-lg leading-relaxed">
              Hochwertiges Brennholz und ausgewählte Kaminöfen — transparent beschrieben,
              ehrlich bepreist und zuverlässig geliefert.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="outline">
                <Link href="/brennholz">
                  Brennholz bestellen
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/kaminoefen">Kaminöfen entdecken</Link>
              </Button>
            </div>

            <div className="mt-10">
              <DeliveryChecker />
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="relative">
              <div className="bg-elevated relative aspect-[3/4] overflow-hidden rounded-2xl shadow-xl">
                <Image
                  src={cld(IMAGES.heroWoodStove, {
                    width: 900,
                    crop: "fill",
                    gravity: "auto",
                  })}
                  alt="Moderner schwarzer Kaminofen mit warmem Feuer, daneben ein Korb mit gespaltenem Brennholz in einem hellen Wohnraum mit Holzboden"
                  fill
                  priority
                  sizes="(min-width: 768px) 42vw, 100vw"
                  className="object-cover"
                />
                <div
                  className="from-text/40 absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t to-transparent"
                  aria-hidden="true"
                />
              </div>
              <Card className="absolute -bottom-6 -left-6 hidden max-w-[220px] p-4 md:block">
                <div className="flex items-center gap-3">
                  <div className="bg-success/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <PackageCheck className="text-success size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-muted text-xs">Aktuell verfügbar</p>
                    <p className="text-text font-mono text-sm font-semibold tabular-nums">
                      1.284 Raummeter
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BenefitsStrip() {
  const benefits = [
    {
      icon: ShieldCheck,
      label: "Geprüfte Qualität",
      desc: "Kammergetrocknet und kontrolliert",
    },
    { icon: Ruler, label: "Transparente Mengen", desc: "Rm, Srm und kg klar erklärt" },
    { icon: Lock, label: "Sichere Zahlung", desc: "Verschlüsselt und PCI-konform" },
    {
      icon: Truck,
      label: "Zuverlässige Lieferung",
      desc: "Termingerecht an die Bordsteinkante",
    },
  ];

  return (
    <section className="border-border bg-surface border-y">
      <div className="container-site">
        <ul className="divide-border grid grid-cols-2 md:grid-cols-4 md:divide-x">
          {benefits.map((benefit) => (
            <li key={benefit.label} className="flex items-center gap-3 px-2 py-5 md:px-6">
              <div className="bg-brand/5 flex size-10 shrink-0 items-center justify-center rounded-lg">
                <benefit.icon className="text-brand size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-text text-sm font-semibold">{benefit.label}</p>
                <p className="text-muted text-xs">{benefit.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const categoryImageBySlug: Record<string, string> = {
  brennholz: IMAGES.kategorieBrennholz,
  kaminoefen: IMAGES.kategorieKaminoefen,
  holzpellets: IMAGES.kategorieHolzpellets,
  anzuendholz: IMAGES.kategorieAnzuendholz,
  holzbriketts: IMAGES.kategorieHolzbriketts,
  // No dedicated photograph yet: briquettes are the closest visual match.
  kohle: IMAGES.kategorieHolzbriketts,
  zubehoer: IMAGES.kategorieOfenzubehoer,
  ofenzubehoer: IMAGES.kategorieOfenzubehoer,
};

function CategoryGrid({ categories }: { categories: CatalogCategory[] }) {
  return (
    <section className="py-16 md:py-24">
      <div className="container-site">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-text text-3xl font-semibold md:text-4xl">
              Unser Sortiment
            </h2>
            <p className="text-muted mt-2 max-w-xl">
              Sechs Kategorien, klare Angaben — kein Marketing-Nebel.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/brennholz">
              Alle Kategorien
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((cat, i) => {
            const isFeatured = i === 0;
            const publicId = categoryImageBySlug[cat.slug];
            return (
              <Link
                key={cat.id}
                href={`/${cat.slug}`}
                className={`group border-border bg-brand duration-base ease-spring focus-visible:outline-accent relative flex flex-col overflow-hidden rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-2 ${
                  isFeatured
                    ? "min-h-64 lg:col-span-2 lg:row-span-2 lg:min-h-full"
                    : "min-h-48"
                }`}
              >
                {publicId && (
                  <Image
                    src={cld(publicId, {
                      width: isFeatured ? 900 : 600,
                      crop: "fill",
                      gravity: "auto",
                    })}
                    alt={cat.name}
                    fill
                    sizes={
                      isFeatured
                        ? "(min-width: 1024px) 40vw, (min-width: 768px) 66vw, 100vw"
                        : "(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
                    }
                    className="duration-emphasis ease-spring object-cover transition-transform group-hover:scale-[1.03]"
                  />
                )}
                <div
                  className="from-text via-text/50 absolute inset-0 bg-gradient-to-t to-transparent"
                  aria-hidden="true"
                />
                <div className="relative mt-auto p-5">
                  <h3 className="font-display text-lg font-semibold text-white md:text-xl">
                    {cat.name}
                  </h3>
                  <p className="mt-1 text-xs text-white/80">
                    {cat.productCount} {cat.productCount === 1 ? "Produkt" : "Produkte"}
                  </p>
                  {isFeatured && (
                    <span className="group-hover:text-accent mt-4 inline-flex items-center gap-1 text-sm text-white/90 transition-colors">
                      Zum Sortiment
                      <ArrowRight className="size-3.5" />
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeaturedProducts({ woodProducts }: { woodProducts: WoodCatalogProduct[] }) {
  // No order history exists yet, so nothing here may be framed as best-selling.
  // Editorially featured items come first, then the rest of the catalogue.
  const preview = [
    ...woodProducts.filter((p) => p.featured),
    ...woodProducts.filter((p) => !p.featured),
  ].slice(0, 4);

  return (
    <section className="bg-elevated/40 py-16 md:py-24">
      <div className="container-site">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-text text-3xl font-semibold md:text-4xl">
              Brennholz im Sortiment
            </h2>
            <p className="text-muted mt-2">
              Lieferantendaten in Prüfung — Holzart, Länge, Restfeuchte und Menge wie
              deklariert.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/brennholz">
              Alle {woodProducts.length} ansehen
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {preview.length > 0 ? (
            preview.map((product, index) => (
              <WoodProductCard key={product.id} product={product} priority={index === 0} />
            ))
          ) : (
            <CatalogEmptyState />
          )}
        </div>
      </div>
    </section>
  );
}

function StoveSection({ stoves }: { stoves: ScrapedProduct[] }) {
  const featured = stoves.slice(0, 9);

  return (
    <section className="py-16 md:py-24">
      <div className="container-site">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="default" className="bg-accent/10 text-accent mb-3">
              Kaminöfen — Herstellerdaten
            </Badge>
            <h2 className="font-display text-text text-3xl leading-tight font-semibold md:text-4xl">
              Der passende Ofen. Ohne Nebelkerzen.
            </h2>
            <p className="text-muted mt-3 max-w-2xl">
              Leistung, Wirkungsgrad, Farben und Abmessungen aus Herstellerdaten. Texte
              und Bilder sind zur Nutzung freigegeben. Technische Angaben bleiben bis zur
              abgeschlossenen Konformitätsprüfung als Herstellerdaten gekennzeichnet.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/kaminoefen">
                Alle {stoves.length} Modelle
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/ofenberatung">Beratung starten</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.length > 0 ? (
            featured.map((stove, index) => (
              <ScrapedStoveCard key={stove.slug} product={stove} priority={index === 0} />
            ))
          ) : (
            <CatalogEmptyState />
          )}
        </div>
        {stoves.length > featured.length && (
          <div className="mt-10 flex justify-center">
            <Button asChild variant="secondary">
              <Link href="/kaminoefen">
                Mehr anzeigen
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: "Produkt auswählen",
      desc: "Wählen Sie aus unserem Sortiment die passende Holzart oder den idealen Ofen.",
    },
    {
      icon: MapPin,
      title: "Liefergebiet prüfen",
      desc: "Geben Sie Ihre PLZ ein und erfahren Sie sofort Preis und frühesten Termin.",
    },
    {
      icon: ShoppingBag,
      title: "Sicher bestellen",
      desc: "Verschlüsselte Übertragung. Die verfügbaren Zahlungsarten sehen Sie an der Kasse.",
    },
    {
      icon: Truck,
      title: "Lieferung erhalten",
      desc: "Zuverlässig bis zur Bordsteinkante — Termin nach Absprache.",
    },
  ];

  return (
    <section className="border-border bg-surface border-t py-16 md:py-24">
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-text text-3xl font-semibold md:text-4xl">
            So einfach geht&apos;s
          </h2>
          <p className="text-muted mt-3">Vier Schritte, keine Überraschungen.</p>
        </div>

        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.title} className="relative">
              <Card className="h-full p-6 text-left">
                <div className="flex items-center gap-3">
                  <div
                    className="bg-brand flex size-10 items-center justify-center rounded-lg text-white"
                    aria-hidden="true"
                  >
                    <step.icon className="size-5" />
                  </div>
                  <span className="text-muted font-mono text-xs tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-display text-text mt-5 text-lg font-semibold">
                  {step.title}
                </h3>
                <p className="text-muted mt-2 text-sm">{step.desc}</p>
              </Card>
              {i < steps.length - 1 && (
                <ArrowRight
                  className="text-border absolute top-1/2 -right-3 hidden size-5 -translate-y-1/2 lg:block"
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function QualitySection() {
  const facts = [
    { label: "Holzart & Herkunft", value: "Buche, Eiche, Birke — aus deutschen Wäldern" },
    { label: "Restfeuchte", value: "Kammergetrocknet unter 20 % — ofenfertig" },
    { label: "Länge & Maße", value: "25 cm, 33 cm oder nach Wunsch" },
    { label: "Mengeneinheiten", value: "Raummeter (Rm), Schüttraummeter (Srm), kg" },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container-site">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div className="relative">
            <div className="bg-elevated relative aspect-[3/4] overflow-hidden rounded-2xl shadow-md">
              <Image
                src={cld(IMAGES.sektionQualitaet, {
                  width: 800,
                  crop: "fill",
                  gravity: "auto",
                })}
                alt="Nahaufnahme eines frisch gespaltenen Buchenscheits mit sichtbaren Jahresringen, dunkler Rinde und einem Holzlineal daneben"
                fill
                sizes="(min-width: 768px) 42vw, 100vw"
                className="object-cover"
              />
            </div>
            <Card className="absolute top-6 -right-4 hidden max-w-[200px] p-4 md:block">
              <p className="text-text font-mono text-3xl font-semibold tabular-nums">
                ≤ 20 %
              </p>
              <p className="text-muted mt-1 text-xs">Restfeuchte, geprüft</p>
            </Card>
          </div>
          <div>
            <Badge variant="default" className="bg-wood/10 text-wood mb-4">
              Qualität
            </Badge>
            <h2 className="font-display text-text text-3xl leading-tight font-semibold md:text-4xl">
              Sie wissen genau, was Sie bekommen.
            </h2>
            <p className="text-muted mt-4 leading-relaxed">
              Jede Holzart hat eigene Eigenschaften. Wir geben Ihnen alle Daten an die
              Hand, damit Ihre Entscheidung auf Fakten beruht — nicht auf einer schönen
              Verpackung.
            </p>
            <dl className="mt-6 space-y-4">
              {facts.map((item) => (
                <div key={item.label} className="border-accent/40 border-l-2 pl-4">
                  <dt className="text-text text-sm font-medium">{item.label}</dt>
                  <dd className="text-muted mt-0.5 text-sm">{item.value}</dd>
                </div>
              ))}
            </dl>
            <Button asChild variant="outline" className="mt-8">
              <Link href="/ratgeber">
                Mehr im Ratgeber
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function DeliverySection() {
  return (
    <section className="border-border bg-brand border-t py-16 text-white md:py-24">
      <div className="container-site">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <Badge variant="default" className="mb-4 bg-white/10 text-white">
              Lieferung
            </Badge>
            <h2 className="font-display text-3xl leading-tight font-semibold text-white md:text-4xl">
              Klare Bedingungen. Ehrliche Termine.
            </h2>
            <p className="mt-4 text-white/70">
              Liefergebiete, Preise und Zufahrtsanforderungen werden vor der Freigabe aus
              geprüften Daten berechnet.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <PackageCheck
                  className="text-accent mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                Keine Schätzung ohne freigegebene Lieferregel
              </li>
              <li className="flex items-start gap-2">
                <PackageCheck
                  className="text-accent mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                Preis und Bedingungen werden serverseitig berechnet
              </li>
              <li className="flex items-start gap-2">
                <PackageCheck
                  className="text-accent mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                Der Rechner bleibt bis zur Datenfreigabe deaktiviert
              </li>
            </ul>
          </div>
          <div className="[&_h3]:text-text">
            <DeliveryChecker />
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const summary = summarise(reviews);
  return (
    <section className="py-16 md:py-24">
      <div className="container-site">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-text text-3xl font-semibold md:text-4xl">
              Was unsere Kunden sagen
            </h2>
            {summary ? (
              <p className="text-muted mt-2 flex items-center gap-2 text-sm">
                <ReviewStars rating={summary.average} />
                {summary.average.toFixed(1).replace(".", ",")} von 5 · {summary.count}{" "}
                {summary.count === 1 ? "Bewertung" : "Bewertungen"}
              </p>
            ) : (
              <p className="text-muted mt-2 text-sm">
                Verifizierte Bewertungen werden nach dem Verkaufsstart angezeigt.
              </p>
            )}
          </div>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {reviews.length === 0 ? (
            <CatalogEmptyState
              title="Noch keine Bewertungen"
              description="Es werden keine Demo-Bewertungen als echte Kundenerfahrungen angezeigt."
            />
          ) : (
            reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between gap-3">
                    <ReviewStars rating={review.rating} />
                    {review.verified && (
                      <Badge variant="success" className="text-xs">
                        Verifizierter Kauf
                      </Badge>
                    )}
                  </div>
                  {review.title && (
                    <p className="text-text mt-3 font-medium">{review.title}</p>
                  )}
                  <p className="text-muted mt-2 text-sm leading-relaxed">{review.body}</p>
                  <p className="text-muted mt-4 text-xs">
                    {review.authorName}
                    {review.location ? ` · ${review.location}` : ""}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function GuidesSection({ articles }: { articles: ArticleSummary[] }) {
  return (
    <section className="border-border bg-elevated/40 border-t py-16 md:py-24">
      <div className="container-site">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-text text-3xl font-semibold md:text-4xl">
              Ratgeber & Tipps
            </h2>
            <p className="text-muted mt-2">Alles rund ums Heizen mit Holz.</p>
          </div>
          {articles.length > 0 && (
            <Button asChild variant="ghost">
              <Link href="/ratgeber">
                Alle Artikel
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {articles.length === 0 ? (
            <CatalogEmptyState
              title="Ratgeber in Vorbereitung"
              description="Artikel erscheinen erst nach redaktioneller Prüfung in Supabase."
            />
          ) : (
            articles.map((article) => (
              <Link key={article.slug} href={`/ratgeber/${article.slug}`} className="group">
                <Card className="h-full transition-shadow group-hover:shadow-md">
                  <CardContent className="pt-6">
                    <h3 className="text-text font-display text-lg font-semibold">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-muted mt-2 text-sm leading-relaxed">{article.excerpt}</p>
                    )}
                    <span className="text-brand mt-4 inline-flex items-center gap-1 text-sm">
                      Weiterlesen
                      <ArrowRight className="size-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function NewsletterSection() {
  return (
    <section className="bg-brand py-16 md:py-20">
      <div className="container-site max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold text-white">
          Tipps rund um Holz, Wärme und Kaminöfen
        </h2>
        <p className="mt-3 text-white/70">
          Newsletter mit saisonalen Empfehlungen. Keine Werbung, kein Weiterverkauf.
        </p>
        <div className="mt-8">
          <NewsletterForm />
        </div>
      </div>
    </section>
  );
}

/**
 * One row per product type, so a visitor sees what each category actually
 * contains instead of only firewood and stoves.
 */
function FuelSection({
  title,
  description,
  href,
  products,
}: {
  title: string;
  description: string;
  href: string;
  products: WoodCatalogProduct[];
}) {
  if (products.length === 0) return null;
  return (
    <section className="border-border border-t py-14 md:py-20">
      <div className="container-site">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-text text-2xl font-semibold md:text-3xl">
              {title}
            </h2>
            <p className="text-muted mt-2 max-w-xl text-sm">{description}</p>
          </div>
          <Button asChild variant="ghost">
            <Link href={href}>
              Alle {products.length} ansehen
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map((product) => (
            <WoodProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [
    categories,
    woodRows,
    stoves,
    briquettes,
    pellets,
    kindling,
    coal,
    accessories,
    reviews,
    articles,
    settingsResult,
  ] =
    await Promise.all([
      getPublishedCategories(),
      getPublishedCardProducts("wood"),
      getPublishedStoves(),
      getPublishedCardProducts("briquette"),
      getPublishedCardProducts("pellet"),
      getPublishedCardProducts("kindling"),
      getPublishedCardProducts("coal"),
      getPublishedCardProducts("accessory"),
      getShopReviews(3),
      getLatestArticles(3),
      getMigrationAwarePublicSupabase().from("site_settings").select("newsletter_enabled").eq("id", 1).maybeSingle(),
    ]);
  const woodProducts = woodRows as WoodCatalogProduct[];

  return (
    <>
      <Holzschnitt />
      <HeroSection />
      <BenefitsStrip />
      <CategoryGrid categories={categories} />
      <FeaturedProducts woodProducts={woodProducts} />
      <StoveSection stoves={stoves} />
      <FuelSection
        title="Holzbriketts"
        description="Hoher Heizwert, lange Brenndauer — Menge und Verpackung wie deklariert."
        href="/holzbriketts"
        products={briquettes as WoodCatalogProduct[]}
      />
      <FuelSection
        title="Holzpellets"
        description="Sackware und Palettenmengen von geprüften Lieferanten."
        href="/holzpellets"
        products={pellets as WoodCatalogProduct[]}
      />
      <FuelSection
        title="Anzündholz"
        description="Anzünd- und Anfeuerholz in Sack, Netz oder Karton."
        href="/anzuendholz"
        products={kindling as WoodCatalogProduct[]}
      />
      <FuelSection
        title="Kohle & Grillkohle"
        description="Braunkohle, Steinkohle, Anthrazit und Grillkohle mit deklarierter Körnung."
        href="/kohle"
        products={coal as WoodCatalogProduct[]}
      />
      <FuelSection
        title="Ofenzubehör"
        description="Ofenrohre, Bodenplatten, Kaminbesteck und Funkenschutz."
        href="/zubehoer"
        products={accessories as WoodCatalogProduct[]}
      />
      <HowItWorks />
      <QualitySection />
      <DeliverySection />
      <ReviewsSection reviews={reviews} />
      <GuidesSection articles={articles} />
      {settingsResult.data?.newsletter_enabled ? <NewsletterSection /> : null}
    </>
  );
}

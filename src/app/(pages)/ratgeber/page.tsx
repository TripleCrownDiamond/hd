import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { CatalogEmptyState } from "@/components/commerce/catalog-empty-state";
import { getLatestArticles } from "@/lib/content/articles";

/**
 * Rendered once and reused for five minutes, matching the catalogue's own
 * in-process cache TTL. `force-dynamic` here re-rendered the whole page on
 * every single visit — and because the memory cache is per worker, a cold
 * start re-read the catalogue from Supabase before it could answer at all.
 * Admin edits do not wait for the window: the product actions revalidate
 * these paths explicitly.
 */
export const revalidate = 300;

export const metadata = {
  title: "Ratgeber & Tipps",
  description: "Artikel rund ums Heizen mit Holz, Kaminöfen und Brennstoffe.",
};

export default async function RatgeberPage() {
  const articles = await getLatestArticles(60);

  return (
    <div className="bg-elevated/40">
      <div className="container-catalog py-8 md:py-12">
        <Breadcrumbs
          items={[{ label: "Startseite", href: "/" }, { label: "Ratgeber" }]}
          className="mb-6"
        />
        <h1 className="font-display text-text text-3xl leading-tight font-semibold">
          Ratgeber & Tipps
        </h1>
        <p className="text-muted mt-2 max-w-2xl">
          Alles rund ums Heizen mit Holz — Auswahl, Lagerung, Wirkungsgrad und mehr.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.length === 0 ? (
            <CatalogEmptyState
              title="Noch keine Artikel"
              description="Sobald Artikel veröffentlicht sind, erscheinen sie hier."
            />
          ) : (
            articles.map((article) => (
              <Link key={article.slug} href={`/ratgeber/${article.slug}`} className="group">
                <Card className="h-full transition-shadow group-hover:shadow-md">
                  <CardContent className="pt-6">
                    <h2 className="text-text font-display text-lg font-semibold">
                      {article.title}
                    </h2>
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
    </div>
  );
}

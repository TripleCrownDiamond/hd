import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PublishedContent } from "@/components/content/published-content";
import { getArticle } from "@/lib/content/articles";

/**
 * Rendered once and reused for five minutes, matching the catalogue's own
 * in-process cache TTL. `force-dynamic` here re-rendered the whole page on
 * every single visit — and because the memory cache is per worker, a cold
 * start re-read the catalogue from Supabase before it could answer at all.
 * Admin edits do not wait for the window: the product actions revalidate
 * these paths explicitly.
 */
export const revalidate = 300;

/**
 * Opting the route into the static shell without naming a single path.
 *
 * With no `generateStaticParams` at all, Next treats a `[slug]` route as fully
 * dynamic and `revalidate` never applies — every visit re-rendered the page.
 * Returning an empty list instead means nothing is built up front (the
 * catalogue is ~2 700 products, so prerendering it would dominate the build),
 * while the first visitor to each URL populates the cache for the next five
 * minutes.
 */
export function generateStaticParams() {
  return [];
}


export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Artikel nicht gefunden" };
  return {
    title: article.seo_title ?? article.title,
    description: article.seo_description ?? article.excerpt ?? undefined,
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  return (
    <div className="bg-elevated/40">
      <article className="container-catalog max-w-3xl py-8 md:py-12">
        <Breadcrumbs
          items={[
            { label: "Startseite", href: "/" },
            { label: "Ratgeber", href: "/ratgeber" },
            { label: article.title },
          ]}
          className="mb-6"
        />
        <PublishedContent entry={article} />
      </article>
    </div>
  );
}

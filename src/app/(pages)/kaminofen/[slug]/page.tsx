import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedStoveBySlug } from "@/lib/products/catalog";
import { StoveDetail } from "@/components/commerce/stove-detail";

interface Props {
  params: Promise<{ slug: string }>;
}

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


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedStoveBySlug(slug);
  if (!product) return { title: "Kaminofen nicht gefunden" };
  return {
    title: `${product.model} — ${product.brand}`,
    description: product.descriptions.short_de ?? undefined,
  };
}

export default async function KaminofenSlugPage({ params }: Props) {
  const { slug } = await params;
  const product = await getPublishedStoveBySlug(slug);
  if (!product) notFound();
  return <StoveDetail product={product} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedStoveBySlug } from "@/lib/products/catalog";
import { StoveDetail } from "@/components/commerce/stove-detail";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

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

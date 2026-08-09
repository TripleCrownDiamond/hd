import { notFound } from "next/navigation";
import { getPublishedContent, PublishedContent } from "@/components/content/published-content";

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await getPublishedContent(slug);
  if (!entry || entry.kind === "legal") notFound();
  return <main className="container-site py-12"><PublishedContent entry={entry} /></main>;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedContent, PublishedContent } from "@/components/content/published-content";
import { LegalPage } from "@/components/content/legal-page";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { expandShortcodes } from "@/lib/content/shortcodes";
import { legalDefaultFor } from "@/lib/legal/defaults";

/** CMS entry if there is one, otherwise the seed text for that slug. */
async function resolve(slug: string) {
  const entry = await getPublishedContent(slug);
  if (entry && entry.kind !== "legal") return { entry, fallback: null };
  if (entry) return null; // legal texts have their own route under /(legal)
  const fallback = legalDefaultFor(slug);
  return fallback && fallback.kind === "page" ? { entry: null, fallback } : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolve(slug);
  if (!resolved) return {};
  const { entry, fallback } = resolved;
  return {
    title: await expandShortcodes(entry?.title ?? fallback!.title),
    description: await expandShortcodes(
      entry?.seo_description ?? entry?.excerpt ?? fallback!.seoDescription,
    ),
  };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = await resolve(slug);
  if (!resolved) notFound();

  const title = await expandShortcodes(resolved.entry?.title ?? resolved.fallback!.title);

  return (
    <div className="bg-elevated/40">
      <div className="container-site py-8 md:py-12">
        <Breadcrumbs
          items={[{ label: "Startseite", href: "/" }, { label: title }]}
          className="mb-6"
        />
        <article className="container-legal border-border bg-surface rounded-xl border p-6 shadow-sm md:p-10">
          {resolved.entry ? (
            <PublishedContent entry={resolved.entry} />
          ) : (
            <LegalPage slug={slug} />
          )}
        </article>
      </div>
    </div>
  );
}

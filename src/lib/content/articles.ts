import "server-only";

/**
 * Reading published Ratgeber articles from the shared content_entries table.
 *
 * Articles are `kind = 'article'`, `status = 'published'`. The public client is
 * used so only published rows are ever returned, and an article is not shown
 * before its `effective_from` date if one is set.
 */

import { getMigrationAwarePublicSupabase } from "@/lib/db/server";
import type { ContentEntryRow } from "@/lib/db/types";

export interface ArticleSummary {
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
}

function isLive(row: ContentEntryRow): boolean {
  return !row.effective_from || new Date(row.effective_from) <= new Date();
}

export async function getLatestArticles(limit = 6): Promise<ArticleSummary[]> {
  const supabase = getMigrationAwarePublicSupabase();
  const { data } = await supabase
    .from("content_entries")
    .select("slug,title,excerpt,published_at,effective_from,status,kind")
    .eq("kind", "article")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit * 2);

  return ((data as ContentEntryRow[] | null) ?? [])
    .filter(isLive)
    .slice(0, limit)
    .map((row) => ({
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      publishedAt: row.published_at,
    }));
}

export async function getArticle(slug: string): Promise<ContentEntryRow | null> {
  const supabase = getMigrationAwarePublicSupabase();
  const { data } = await supabase
    .from("content_entries")
    .select("*")
    .eq("kind", "article")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  const row = data as ContentEntryRow | null;
  return row && isLive(row) ? row : null;
}

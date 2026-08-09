import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getMigrationAwarePublicSupabase } from "@/lib/db/server";
import { expandShortcodes } from "@/lib/content/shortcodes";
import type { ContentEntryRow } from "@/lib/db/types";

export async function getPublishedContent(slug: string) {
  const { data } = await getMigrationAwarePublicSupabase()
    .from("content_entries")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data as ContentEntryRow | null;
}

export async function PublishedContent({ entry }: { entry: ContentEntryRow }) {
  // Shortcodes ([company_name], [address] …) are filled from site_settings so a
  // legal page or article stays correct when the company details change.
  const body = await expandShortcodes(entry.body);
  const excerpt = entry.excerpt ? await expandShortcodes(entry.excerpt) : null;

  return (
    <div>
      <h1 className="text-text font-display text-3xl font-semibold">{entry.title}</h1>
      {excerpt ? <p className="text-muted mt-2">{excerpt}</p> : null}
      <div className="mt-8">
        {entry.format === "markdown" ? (
          <div className="space-y-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          </div>
        ) : (
          <iframe
            title={entry.title}
            sandbox=""
            srcDoc={body}
            className="min-h-[60vh] w-full border-0"
          />
        )}
      </div>
    </div>
  );
}

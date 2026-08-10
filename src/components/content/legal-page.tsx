import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownComponents } from "@/components/content/markdown-components";
import Link from "next/link";
import { getPublishedContent, PublishedContent } from "@/components/content/published-content";
import { expandShortcodes } from "@/lib/content/shortcodes";
import { legalDefaultFor } from "@/lib/legal/defaults";
import { getCompany } from "@/lib/company-server";
import { missingMandatoryFields } from "@/lib/company";

/**
 * Renders a legal or information page from the CMS, falling back to the seed
 * text in `lib/legal/defaults`.
 *
 * Both paths go through the same Markdown renderer and the same shortcode
 * expansion, so a page looks and reads identically before and after an editor
 * takes it over — the only difference is who owns the words.
 */
export async function LegalPage({ slug }: { slug: string }) {
  const entry = await getPublishedContent(slug);
  if (entry) return <PublishedContent entry={entry} />;

  const fallback = legalDefaultFor(slug);
  if (!fallback) return null;

  const [title, excerpt, body, company] = await Promise.all([
    expandShortcodes(fallback.title),
    expandShortcodes(fallback.excerpt),
    expandShortcodes(fallback.body),
    getCompany(),
  ]);

  const missing = slug === "impressum" ? missingMandatoryFields(company) : [];

  return (
    <div>
      {missing.length > 0 && (
        <div className="border-warning/40 bg-warning/5 text-text mb-6 rounded-md border p-4 text-sm">
          <strong className="font-semibold">Noch nicht vollständig.</strong> Für den Betrieb des
          Shops fehlen die folgenden Pflichtangaben nach § 5 DDG: {missing.join(", ")}. Sie werden
          unter <span className="font-mono text-xs">Admin → Einstellungen</span> eingetragen.
        </div>
      )}
      <div className="border-border bg-elevated/60 text-muted mb-6 rounded-md border p-4 text-sm">
        <strong className="text-text font-semibold">Vorlage.</strong> Dieser Text ist auf Sortiment
        und Abläufe dieses Shops zugeschnitten, ersetzt aber keine Rechtsberatung — und er wird noch
        nicht aus dem CMS ausgeliefert. Unter{" "}
        <Link href="/admin/inhalte" className="text-accent underline">
          Admin → Seiten &amp; Artikel
        </Link>{" "}
        lässt er sich als Entwurf anlegen, bearbeiten und veröffentlichen.
      </div>

      {/* `break-words` + a smaller mobile step: "Allgemeine
          Geschäftsbedingungen" at 36px is one unbreakable 367px word and was
          spilling 74px out of a 293px box. */}
      <h1 className="text-text font-display text-2xl font-semibold break-words sm:text-3xl">
        {title}
      </h1>
      {excerpt ? <p className="text-muted mt-2 text-sm">{excerpt}</p> : null}
      <div className="legal-prose mt-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {body}
        </ReactMarkdown>
      </div>
    </div>
  );
}

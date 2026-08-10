// Publish the shipped legal texts into the CMS.
//
// The go-live checklist ("Textes juridiques publiés dans le CMS") stays orange
// until every LEGAL_DEFAULTS slug exists in content_entries with
// status = 'published'. These texts are already the ones served today (the
// code fallback), so publishing the identical body does not change what
// customers see — it only makes the pages editable in the CMS.
//
// Run: set -a; source .env.local; set +a; node scripts/db/seed-legal-cms.mjs
import { createClient } from "@supabase/supabase-js";
import { LEGAL_DEFAULTS } from "../../src/lib/legal/defaults.ts";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

const { data: existing } = await supabase
  .from("content_entries")
  .select("slug,status")
  .in("slug", LEGAL_DEFAULTS.map((entry) => entry.slug));

const bySlug = new Map((existing ?? []).map((row) => [String(row.slug).toLowerCase(), row]));
const missing = LEGAL_DEFAULTS.filter((entry) => !bySlug.has(entry.slug.toLowerCase()));
const draftsToPublish = LEGAL_DEFAULTS.filter((entry) => bySlug.get(entry.slug.toLowerCase())?.status === "draft");

if (missing.length === 0 && draftsToPublish.length === 0) {
  console.log("Rien à faire : tous les textes légaux existent et sont publiés.");
} else {
  if (missing.length > 0) {
    const { error } = await supabase.from("content_entries").insert(
      missing.map((entry) => ({
        slug: entry.slug,
        kind: entry.kind,
        title: entry.title,
        excerpt: entry.excerpt,
        seo_description: entry.seoDescription,
        format: "markdown",
        body: entry.body,
        status: "published",
        published_at: new Date().toISOString(),
      })),
    );
    if (error) {
      console.error("Échec de création :", error.message);
      process.exit(1);
    }
    console.log(`Créés et publiés : ${missing.map((entry) => entry.slug).join(", ")}`);
  }
  if (draftsToPublish.length > 0) {
    const slugs = draftsToPublish.map((entry) => entry.slug);
    const { error } = await supabase
      .from("content_entries")
      .update({ status: "published", published_at: new Date().toISOString() })
      .in("slug", slugs);
    if (error) {
      console.error("Échec de publication :", error.message);
      process.exit(1);
    }
    console.log(`Brouillons publiés : ${slugs.join(", ")}`);
  }
}

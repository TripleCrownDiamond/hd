import "server-only";

import { cache } from "react";
import { getMigrationAwarePublicSupabase } from "@/lib/db/server";
import type { SiteSettingsRow } from "@/lib/db/types";

/**
 * The single `site_settings` read for a render.
 *
 * The row was being fetched separately by the root layout, the footer, the
 * company profile and the shortcode expander — four round trips to a hosted
 * database that answers in roughly 800 ms, so about three seconds of a page's
 * time spent asking the same question four times.
 *
 * `cache()` collapses them to one per request. Errors resolve to null: no
 * caller needs the settings badly enough to take the page down with them.
 */
export const getSiteSettings = cache(async function getSiteSettings(): Promise<SiteSettingsRow | null> {
  try {
    const { data } = await getMigrationAwarePublicSupabase()
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    return (data as SiteSettingsRow | null) ?? null;
  } catch {
    return null;
  }
});

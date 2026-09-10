/**
 * Absolute origin of the storefront, without a trailing slash.
 *
 * Feed links and cross-referenced URLs must be absolute, but every mirror
 * (localhost, preview, production) has its own origin. `NEXT_PUBLIC_APP_URL`
 * is the deploy setting; the fallback is the shop's own domain so a missing
 * env var produces working links instead of broken `/produkt/...` hrefs.
 */

const FALLBACK_ORIGIN = "https://holzdirekt.store";

export function siteBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim().replace(/\/+$/, "");
  return FALLBACK_ORIGIN;
}

/** Absolute URL for a site-relative path (leading `/` included). */
export function siteUrl(path: string): string {
  const base = siteBaseUrl();
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
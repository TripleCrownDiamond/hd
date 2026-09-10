import { buildMerchantFeed } from "@/lib/products/merchant-feed";

/**
 * Public product feed for merchant / price-comparison platforms.
 *
 * Generated from the current catalogue on every request — an admin edit or a
 * product visibility toggle is reflected the moment a platform polls. Feed
 * consumers cannot authenticate, so this route stays public by design; the
 * corresponding admin page (Export XML) shows the URL to hand to the platform.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const feed = await buildMerchantFeed(origin.replace(/\/+$/, ""));
  return new Response(feed.xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Prices and availability belong to the catalogue they describe; never
      // serve a five-minute-old snapshot from a shared cache.
      "Cache-Control": "no-store",
    },
  });
}
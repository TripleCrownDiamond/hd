"use client";

/**
 * next/image loader for Cloudinary.
 *
 * Without it every catalogue image is fetched from Cloudinary and then resized
 * a second time by the Next image optimizer — twice the work and twice the
 * cache. Here the requested width is folded into the Cloudinary transformation,
 * so each srcset entry is one CDN request and Next proxies nothing.
 *
 * Non-Cloudinary sources fall through unchanged.
 */
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // ImageKit URLs already carry their transformation (see src/lib/media.ts).
  if (src.startsWith("https://ik.imagekit.io/")) {
    return src.includes("?tr=") ? `${src},w-${width}` : `${src}?tr=w-${width},f-auto,q-auto`;
  }

  const marker = "/image/upload/";
  const index = src.indexOf(marker);
  if (!src.startsWith("https://res.cloudinary.com/") || index === -1) return src;

  const head = src.slice(0, index + marker.length);
  const rest = src.slice(index + marker.length);
  const hasTransform = /^[a-z]_[^/]*\//.test(rest);
  const transform = hasTransform ? rest.slice(0, rest.indexOf("/")) : "";
  const path = hasTransform ? rest.slice(rest.indexOf("/") + 1) : rest;
  const sourceWidth = transform.match(/(?:^|,)w_(\d+)(?:,|$)/)?.[1];
  const sourceHeight = transform.match(/(?:^|,)h_(\d+)(?:,|$)/)?.[1];
  // Square product media is intentionally cropped at the CDN. Keeping the
  // transformation avoids downloading off-canvas pixels that object-cover
  // would discard in the browser. Other imagery keeps its original ratio.
  const squareFill =
    /(?:^|,)c_fill(?:,|$)/.test(transform) &&
    sourceWidth != null &&
    sourceWidth === sourceHeight;

  const transforms = [
    "f_auto",
    `q_${quality ?? "auto"}`,
    squareFill ? "c_fill" : "c_limit",
    squareFill ? "g_auto" : null,
    `w_${width}`,
    squareFill ? `h_${width}` : null,
  ]
    .filter(Boolean)
    .join(",");
  return `${head}${transforms}/${path}`;
}

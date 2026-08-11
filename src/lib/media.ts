/**
 * Build a delivery URL for a stored product-media reference.
 *
 * Providers:
 *
 * - `local:` — a file inside `public/images/` (scripts/publish/
 *   migrate-media-public.mjs downloads every site image there and rewrites the
 *   reference). This is the target: the whole site is served without any CDN.
 * - `imagekit:` / bare Cloudinary id — legacy references not yet migrated;
 *   they keep resolving to their CDN until the migration script rewrites them.
 *
 * Callers pass the reference and never need to know which is which. Local
 * images are served by this app and resized on the fly by the Next image
 * optimizer (sharp on the same server), since the app uses the default loader.
 */

import { cld, localMediaUrl, isLocalRef, type CldOptions } from "./cloudinary";

const IMAGEKIT_PREFIX = "imagekit:";

function imageKitEndpoint(): string {
  return process.env.NEXT_PUBLIC_IMAGEKIT_URL ?? "https://ik.imagekit.io/fghqtx0enp";
}

export function isImageKitRef(reference: string): boolean {
  return reference.startsWith(IMAGEKIT_PREFIX);
}

export { isLocalRef, localMediaUrl } from "./cloudinary";

/**
 * @param reference stored media reference (`local:path`, `imagekit:path`, or a
 *   Cloudinary id)
 * @param options   width/height/crop, mapped to each provider's own syntax
 */
export function media(reference: string, options: CldOptions = {}): string {
  if (isLocalRef(reference)) {
    // The Next optimizer handles resizing locally; the path is the only input.
    return localMediaUrl(reference.slice("local:".length));
  }
  if (!isImageKitRef(reference)) return cld(reference, options);

  const path = reference.slice(IMAGEKIT_PREFIX.length);
  const transforms = [
    // `c-at_max` is ImageKit's equivalent of Cloudinary's `c_limit`: never
    // upscale, keep the aspect ratio.
    options.width ? `w-${options.width}` : null,
    options.height ? `h-${options.height}` : null,
    options.crop === "fill" ? "c-maintain_ratio,fo-auto" : "c-at_max",
    "f-auto",
    "q-auto",
  ]
    .filter(Boolean)
    .join(",");

  return `${imageKitEndpoint()}/${path}?tr=${transforms}`;
}

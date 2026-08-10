/**
 * Build a delivery URL for a stored product-media reference.
 *
 * Three providers coexist:
 *
 * - `local:` — self-hosted in the public Supabase Storage bucket
 *   `produkt-bilder` (scripts/publish/migrate-media-local.mjs moves images
 *   there and rewrites the reference). This is the target: everything is being
 *   migrated off the CDNs.
 * - `imagekit:` — ImageKit, used for uploads after Cloudinary's quota filled.
 * - a bare value — a Cloudinary public_id, everything published before that.
 *
 * Callers pass the reference and never need to know which is which. Local
 * images are served without CDN transforms and resized on the fly by the Next
 * image optimizer (sharp on the same server), since the app uses the default
 * loader.
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

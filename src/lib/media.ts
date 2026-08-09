/**
 * Build a delivery URL for a stored product-media reference.
 *
 * Two providers coexist: Cloudinary holds every asset published before the
 * quota was reached, ImageKit holds everything since. A reference prefixed
 * `imagekit:` is an ImageKit path; a bare value is a Cloudinary public_id.
 * Callers pass the reference and never need to know which is which.
 */

import { cld, type CldOptions } from "./cloudinary";

const IMAGEKIT_PREFIX = "imagekit:";
const IMAGEKIT_ENDPOINT =
  process.env.NEXT_PUBLIC_IMAGEKIT_URL ?? "https://ik.imagekit.io/fghqtx0enp";

export function isImageKitRef(reference: string): boolean {
  return reference.startsWith(IMAGEKIT_PREFIX);
}

/**
 * @param reference stored media reference (`imagekit:path` or a Cloudinary id)
 * @param options   width/height/crop, mapped to each provider's own syntax
 */
export function media(reference: string, options: CldOptions = {}): string {
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

  return `${IMAGEKIT_ENDPOINT}/${path}?tr=${transforms}`;
}

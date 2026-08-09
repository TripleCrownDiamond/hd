/**
 * Cloudinary URL builder — no SDK, no bundle cost at runtime.
 * Always emits `f_auto,q_auto` for automatic format (AVIF/WebP) and quality.
 */

const CLOUD_NAME = "pq4soawt";
const BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

type Gravity = "auto" | "auto:subject" | "faces" | "center" | "north" | "south";
type Crop = "fill" | "fit" | "scale" | "thumb" | "auto";

export interface CldOptions {
  width?: number;
  height?: number;
  crop?: Crop;
  gravity?: Gravity;
  /** Extra transformations appended as `,` after the base ones. */
  extra?: string;
}

/**
 * Build an optimized Cloudinary delivery URL for a given public_id.
 *
 * @example
 *   cld("holzkraft/hero/wood-stove-living-room")
 *   cld("holzkraft/products/buche-25", { width: 800, height: 600, crop: "fill", gravity: "auto" })
 */
export function cld(publicId: string, options: CldOptions = {}): string {
  const parts: string[] = ["f_auto", "q_auto"];

  if (options.crop) parts.push(`c_${options.crop}`);
  if (options.gravity) parts.push(`g_${options.gravity}`);
  if (options.width) parts.push(`w_${options.width}`);
  if (options.height) parts.push(`h_${options.height}`);
  if (options.extra) parts.push(options.extra);

  return `${BASE}/${parts.join(",")}/${publicId}`;
}

/**
 * Registered image ids used across the app. Keep in sync with what has
 * actually been uploaded via scripts/upload-image.mjs.
 */
export const IMAGES = {
  heroWoodStove: "holzkraft/hero/wood-stove-living-room",
  kategorieBrennholz: "holzkraft/kategorien/brennholz",
  kategorieKaminoefen: "holzkraft/kategorien/kaminoefen",
  kategorieHolzpellets: "holzkraft/kategorien/holzpellets",
  kategorieAnzuendholz: "holzkraft/kategorien/anzuendholz",
  kategorieHolzbriketts: "holzkraft/kategorien/holzbriketts",
  kategorieOfenzubehoer: "holzkraft/kategorien/ofenzubehoer",
  sektionQualitaet: "holzkraft/sektionen/qualitaet-buche-schnitt",
} as const;

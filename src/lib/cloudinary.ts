/**
 * Cloudinary URL builder — kept only as a fallback for legacy references that
 * have not been migrated yet.
 *
 * A `local:` reference resolves to a file inside `public/images/` (see
 * scripts/publish/migrate-media-public.mjs): the migration downloads and
 * re-encodes every site image locally, and the Next optimizer resizes it.
 */

const CLOUD_NAME = "pq4soawt";
const BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

const LOCAL_PREFIX = "local:";

/** Public URL of a `local:` reference — a file served by this app itself. */
export function localMediaUrl(path: string): string {
  return `/images/${path}`;
}

/** True when a stored media reference points at the self-hosted bucket. */
export function isLocalRef(reference: string): boolean {
  return reference.startsWith(LOCAL_PREFIX);
}

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
  if (publicId.startsWith(LOCAL_PREFIX)) {
    return localMediaUrl(publicId.slice(LOCAL_PREFIX.length));
  }
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
  heroWoodStove: "local:holzkraft/hero/wood-stove-living-room.webp",
  kategorieBrennholz: "local:holzkraft/kategorien/brennholz.webp",
  kategorieKaminoefen: "local:holzkraft/kategorien/kaminoefen.webp",
  kategorieHolzpellets: "local:holzkraft/kategorien/holzpellets.webp",
  kategorieAnzuendholz: "local:holzkraft/kategorien/anzuendholz.webp",
  kategorieHolzbriketts: "local:holzkraft/kategorien/holzbriketts.webp",
  kategorieOfenzubehoer: "local:holzkraft/kategorien/ofenzubehoer.webp",
  sektionQualitaet: "local:holzkraft/sektionen/qualitaet-buche-schnitt.webp",
} as const;

/**
 * Cloudinary URL builder — no SDK, no bundle cost at runtime.
 * Always emits `f_auto,q_auto` for automatic format (AVIF/WebP) and quality.
 *
 * A `local:` reference is passed through to the self-hosted Supabase Storage
 * bucket (see src/lib/media.ts): the migration rewrites these values, and the
 * Next optimizer resizes locally.
 */

const CLOUD_NAME = "pq4soawt";
const BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

const LOCAL_PREFIX = "local:";
const BUCKET = "produkt-bilder";

/** e.g. https://unosconddkwxiknibzuo.supabase.co — the storage URL shares it. */
function supabaseBase(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
}

/** Full public URL of a `local:` reference inside the produkt-bilder bucket. */
export function localMediaUrl(path: string): string {
  return `${supabaseBase()}/storage/v1/object/public/${BUCKET}/${path}`;
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

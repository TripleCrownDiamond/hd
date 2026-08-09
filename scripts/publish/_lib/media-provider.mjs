/**
 * Where a product image is hosted.
 *
 * Cloudinary holds everything published before 2 August 2026 and its quota is
 * now full, so new uploads go to ImageKit. Both must keep working: a stored
 * reference carries its provider as a prefix (`imagekit:<path>`), and a bare
 * value is a Cloudinary public_id — that is what the existing rows contain.
 */

import { fetch, FormData } from "undici";

export const IMAGEKIT_PREFIX = "imagekit:";

/** True when a stored media reference points at ImageKit rather than Cloudinary. */
export function isImageKit(reference) {
  return typeof reference === "string" && reference.startsWith(IMAGEKIT_PREFIX);
}

/**
 * Upload a remote image to ImageKit.
 *
 * @param {object} config  { privateKey, urlEndpoint }
 * @param {string} url     source image
 * @param {string} path    target path, e.g. "holzkraft/products/rika/trio/01-trio"
 * @returns {Promise<string>} the stored reference, `imagekit:<filePath>`
 */
export async function uploadToImageKit(config, url, path) {
  const folder = path.split("/").slice(0, -1).join("/");
  const fileName = path.split("/").pop();

  const form = new FormData();
  form.append("file", url);
  form.append("fileName", fileName);
  form.append("folder", `/${folder}`);
  // Keep our own name: ImageKit otherwise appends a random suffix and the
  // reference would change on every re-run.
  form.append("useUniqueFileName", "false");
  form.append("overwriteFile", "false");

  const auth = Buffer.from(`${config.privateKey}:`).toString("base64");
  const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: { authorization: `Basic ${auth}` },
    body: form,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message ?? `ImageKit HTTP ${response.status}`);
  }
  return `${IMAGEKIT_PREFIX}${payload.filePath.replace(/^\//, "")}`;
}

/** Read provider configuration from a parsed .env map. */
export function imageKitConfig(env) {
  const privateKey = env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = env.NEXT_PUBLIC_IMAGEKIT_URL;
  return privateKey && urlEndpoint ? { privateKey, urlEndpoint } : null;
}

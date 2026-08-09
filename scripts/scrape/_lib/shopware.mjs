/**
 * Shared helpers for Shopware 6 product pages.
 * Tries JSON-LD (Product/ProductGroup) first, then HTML markers, then regex.
 */

import { clean } from "./wood.mjs";

/** Does this node, or anything under it, describe the product itself? */
function hasProductNode(node) {
  if (!node || typeof node !== "object") return false;
  if (Array.isArray(node)) return node.some(hasProductNode);
  const type = node["@type"];
  const types = Array.isArray(type) ? type : [type];
  if (types.includes("Product") || types.includes("ProductGroup")) return true;
  return hasProductNode(node["@graph"]) || hasProductNode(node.mainEntity);
}

/**
 * The JSON-LD block that describes the product.
 *
 * A page usually carries several: WooCommerce SEO plugins emit a BreadcrumbList
 * graph first, and returning that one cost the price and the name on every
 * product of a shop. The Product-bearing block wins; the first parseable block
 * is only the fallback.
 */
export function extractJsonLd(html) {
  const blocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  let fallback = null;
  for (const match of blocks) {
    const raw = match[1].trim();
    const start = raw.indexOf("{");
    if (start === -1) continue;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      try {
        parsed = JSON.parse(raw.slice(start));
      } catch {
        continue;
      }
    }
    if (hasProductNode(parsed)) return parsed;
    fallback ??= parsed;
  }
  return fallback;
}

function collectOffers(jsonld) {
  const out = [];
  if (!jsonld) return out;
  const roots = Array.isArray(jsonld) ? jsonld : [jsonld];
  for (const root of roots) {
    const walk = (node) => {
      if (!node || typeof node !== "object") return;
      if (node["@type"] === "Offer" || node.price) {
        out.push(node);
      }
      if (node.offers) {
        const offers = Array.isArray(node.offers) ? node.offers : [node.offers];
        for (const o of offers) walk(o);
      }
      if (node.priceSpecification) {
        const specs = Array.isArray(node.priceSpecification)
          ? node.priceSpecification
          : [node.priceSpecification];
        for (const spec of specs) walk(spec);
      }
      // `@graph` is how Yoast and most WordPress SEO plugins nest the Product.
      for (const key of ["itemListElement", "hasVariant", "additionalProperty", "@graph"]) {
        const arr = node[key];
        if (Array.isArray(arr)) for (const child of arr) walk(child);
      }
    };
    walk(root);
  }
  return out;
}

function toNumber(s) {
  if (s == null) return null;
  const n = Number.parseFloat(String(s).replace(",", ".").replace(/[^\d.,-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Best-effort public price in cents. */
export function shopwarePriceCents(html, jsonld = null) {
  const offers = collectOffers(jsonld);
  const prices = offers
    .map((o) => toNumber(o.price ?? o.priceSpecification?.price))
    .filter((n) => n != null && n > 0);
  if (prices.length) return Math.round(Math.min(...prices) * 100);

  const itemprop = html.match(/itemprop="price"[^>]*content="([^"]+)"/);
  if (itemprop) {
    const n = toNumber(itemprop[1]);
    if (n != null && n > 1) return Math.round(n * 100);
  }

  const dataPrice = html.match(/data-price="(\d+[.,]?\d*)"/);
  if (dataPrice) {
    const n = toNumber(dataPrice[1]);
    if (n != null && n > 1) return Math.round(n * 100);
  }

  const el = html.match(/class="[^"]*product-detail-price[^"]*"[^>]*>([\s\S]*?)</);
  if (el) {
    const n = euroToCentsLoose(clean(el[1]));
    if (n != null && n > 1) return n;
  }

  return firstEuroCents(html);
}

function firstEuroCents(html) {
  // skip cart totals like 0,00 € — require a plausible product price
  const m = html.match(/(\d{1,3}(?:\.\d{3})*,\d{2})\s*€/);
  if (!m) return null;
  const cents = parseEuro(m[1]);
  return cents != null && cents > 1 ? cents : null;
}

function parseEuro(s) {
  const n = Number.parseFloat(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

function euroToCentsLoose(text) {
  const m = String(text).match(/(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})/);
  if (!m) return null;
  const n = Number.parseFloat(m[1].replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

/** The Product node itself, wherever the page nested it. */
export function productNode(jsonld) {
  if (!jsonld || typeof jsonld !== "object") return null;
  if (Array.isArray(jsonld)) {
    for (const child of jsonld) {
      const found = productNode(child);
      if (found) return found;
    }
    return null;
  }
  const type = jsonld["@type"];
  const types = Array.isArray(type) ? type : [type];
  if (types.includes("Product") || types.includes("ProductGroup")) return jsonld;
  return productNode(jsonld["@graph"]) ?? productNode(jsonld.mainEntity);
}

/** Product name: JSON-LD name -> h1. */
export function shopwareName(html, jsonld = null) {
  const product = productNode(jsonld) ?? jsonld;
  if (product && typeof product.name === "string" && product.name.trim()) {
    return clean(product.name);
  }
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return clean(h1[1]);
  const title = html.match(/<title>([\s\S]*?)<\/title>/i);
  return title ? clean(title[1]).split("|")[0].trim() : null;
}

/**
 * The shop's property table, rendered as `<th>/<td>` or `<dt>/<dd>` pairs.
 *
 * Firewood merchants publish the declaration a buyer actually compares here —
 * Holzart, Restfeuchte, Wassergehalt, Holzlänge, Gewicht — and the wood
 * scrapers previously read none of it, so briquettes and pellets arrived with
 * an empty declaration.
 */
export function extractSpecTable(html) {
  const specs = {};
  const add = (rawKey, rawValue) => {
    const key = clean(rawKey).replace(/:$/, "").trim();
    const value = clean(rawValue);
    if (key && value && key.length < 60 && !specs[key]) specs[key] = value;
  };

  const pattern = /<(th|dt)[^>]*>([\s\S]{0,120}?)<\/\1>\s*<(td|dd)[^>]*>([\s\S]{0,200}?)<\/\3>/gi;
  for (const match of html.matchAll(pattern)) add(match[2], match[4]);

  // WooCommerce themes write the declaration as two data cells with the label
  // emphasised instead of as a header cell. Requiring the whole first cell to be
  // the emphasis keeps ordinary two-column tables out.
  const emphasised =
    /<td[^>]*>\s*<(strong|b)[^>]*>([\s\S]{0,120}?)<\/\1>\s*<\/td>\s*<td[^>]*>([\s\S]{0,200}?)<\/td>/gi;
  for (const match of html.matchAll(emphasised)) add(match[2], match[3]);

  return specs;
}

/**
 * The table that follows a given heading, read as label/value rows.
 *
 * `extractSpecTable` deliberately ignores a plain `<td>label</td><td>value</td>`
 * row, because in an arbitrary table the first cell is not a label. Under a
 * heading that announces the declaration it is, so the heading is what makes
 * the rows safe to read.
 *
 * @param {string} html
 * @param {RegExp} heading matched against the heading text
 */
export function extractTableAfterHeading(html, heading) {
  const specs = {};
  const headings = [...html.matchAll(/<h[1-6][^>]*>([\s\S]{0,120}?)<\/h[1-6]>/gi)];
  for (const match of headings) {
    if (!heading.test(clean(match[1]))) continue;
    const rest = html.slice(match.index + match[0].length);
    const table = rest.match(/<table[\s\S]*?<\/table>/i);
    // Only the table immediately after the heading: a later one belongs to a
    // different section.
    if (!table || table.index > 400) continue;
    for (const row of table[0].matchAll(
      /<t[dh][^>]*>([\s\S]{0,160}?)<\/t[dh]>\s*<t[dh][^>]*>([\s\S]{0,400}?)<\/t[dh]>/gi,
    )) {
      const key = clean(row[1]).replace(/:$/, "").trim();
      const value = clean(row[2]);
      if (key && value && key.length < 60 && !specs[key]) specs[key] = value;
    }
  }
  return specs;
}

export function shopwareDescription(html, jsonld = null) {
  const product = productNode(jsonld) ?? jsonld;
  if (product && typeof product.description === "string" && product.description.trim()) {
    return clean(product.description);
  }
  const meta = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i);
  return meta ? clean(meta[1]) : null;
}

import { isNonProductImage } from "./images.mjs";

/** `//host/x.jpg` and `/x.jpg` -> absolute; strips nothing else. */
function abs(url, base) {
  if (!url) return null;
  const value = url.trim().replace(/&amp;/g, "&");
  if (/^https?:\/\//.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return base.replace(/\/+$/, "") + value;
  return null;
}

/** Path without query string, used to dedupe the same asset at several widths. */
function assetKey(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname
      // Shopware serves the same file from /media/… and /thumbnail/….
      .replace(/^\/thumbnail\//, "/media/")
      // Resize caches put the dimensions in a path segment
      // (…/uploadcache/<hash>/CLIPx1920x1280/photo.jpg): same photo, one asset.
      .replace(/\/[A-Za-z]*\d+x\d+\//, "/")
      // The same photo is often offered as .jpg and .webp side by side.
      .replace(/\.(jpe?g|png|webp|avif)$/i, "");
    return parsed.origin + path;
  } catch {
    return url;
  }
}

function isProductImage(url) {
  if (!url) return false;
  if (!/\.(jpe?g|png|webp|avif)(\?|#|$)/i.test(url)) return false;
  return !isNonProductImage(url);
}

/** Every image URL a JSON-LD node exposes, at any depth. */
function jsonLdImages(jsonld) {
  const out = [];
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const child of node) walk(child);
      return;
    }
    const image = node.image ?? node.contentUrl ?? node.url;
    if (typeof image === "string" && /\.(jpe?g|png|webp|avif)/i.test(image)) out.push(image);
    if (Array.isArray(image) || (image && typeof image === "object")) walk(image);
    for (const key of ["itemListElement", "hasVariant", "offers", "mainEntity", "@graph"]) {
      if (node[key]) walk(node[key]);
    }
  };
  walk(jsonld);
  return out;
}

/**
 * Collect product images from a Shopware 6 / Shopify product page.
 *
 * Ordered by confidence: JSON-LD, og:image, PhotoSwipe/gallery markup, then any
 * remaining content image. Accepts query strings (`?ts=`, `?v=`, `&width=`),
 * protocol-relative URLs and lazy-loading `data-src` / `srcset` attributes,
 * which the previous `src="…jpg"`-only pattern silently dropped.
 */
export function shopwareImages(html, base, jsonld = null) {
  const byAsset = new Map();
  const add = (raw) => {
    const url = abs(raw, base);
    if (!isProductImage(url)) return;
    const key = assetKey(url);
    // Keep the first (highest-confidence) URL seen for an asset.
    if (!byAsset.has(key)) byAsset.set(key, url);
  };

  for (const image of jsonLdImages(jsonld)) add(image);

  const og = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (og) add(og[1]);

  for (const m of html.matchAll(/data-pswp-src=["']([^"']+)["']/g)) add(m[1]);
  for (const m of html.matchAll(/data-(?:src|zoom-image|large_image)=["']([^"']+)["']/gi)) {
    add(m[1]);
  }

  const widestOf = (srcset) =>
    srcset
      .split(",")
      .map((part) => part.trim().split(/\s+/)[0])
      .filter(Boolean)
      .at(-1);

  for (const tag of html.matchAll(/<img\b[^>]*>/gi)) {
    const attrs = tag[0];
    // Attributes may be single- or double-quoted depending on the platform.
    const src = attrs.match(/\bsrc=["']([^"']+)["']/i);
    if (src) add(src[1]);
    const srcset = attrs.match(/\bsrcset=["']([^"']+)["']/i);
    // Widest candidate last in Shopware/Shopify srcsets.
    if (srcset) add(widestOf(srcset[1]));
  }

  for (const m of html.matchAll(/<source\b[^>]*\bsrcset=["']([^"']+)["']/gi)) {
    add(widestOf(m[1]));
  }

  return [...byAsset.values()];
}

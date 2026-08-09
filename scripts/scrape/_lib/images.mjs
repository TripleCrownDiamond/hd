/**
 * Shared product-image hygiene, applied to every source.
 *
 * Shop templates put payment badges, carrier logos, trust seals, social icons
 * and lifestyle banners in the same markup as the product photo. Without this
 * filter a Visa badge can end up as a product's main image, and an ambience
 * shot can outrank the actual product cut-out.
 */

/** Filename fragments that are never the product itself. */
const NON_PRODUCT_PATTERNS = [
  // Payment
  /master-?card|visa\b|maestro|amex|american-?express|paypal|klarna|sofort|giropay|ideal|apple-?pay|google-?pay|vorkasse|nachnahme|rechnung|invoice|bank-?transfer|ueberweisung|überweisung|lastschrift|kreditkarte|creditcard|payment|zahlung|barzahlung|delivery-?cash|checkout/i,
  /(^|[^a-z0-9])sepa([^a-z0-9]|$)/i,
  /amazon-?pay|shop-?pay|paydirekt|billpay|ratepay|payone|unzer|mollie|adyen/i,
  // Carriers and shipping
  /\bdhl\b|\bdpd\b|\bgls\b|\bups\b|fedex|\btnt\b|hermes|spedition|versandart|shipping|paketdienst/i,
  // "…-versand" / "versand-…" in an image name is a shipping badge, never a product.
  /(^|[^a-z0-9])versand([^a-z0-9]|$)/i,
  // Trust, ratings, certifications used as decoration
  /siegel|trusted-?shops?|trustpilot|shopvote|ekomi|google-?(my-?)?business|bewertung|review-?stars?|guarantee|garantie-?logo|zertifikat-?logo/i,
  // Branding and chrome. The separator class must be "any non-alphanumeric":
  // URLs encode spaces as "+" or "%20" ("Deutsch+Logo.jpg", "woodseeds logo.png").
  /(^|[^a-z0-9])logos?([^a-z0-9]|$)|logotype|favicon|sprite|placeholder|dummy|no-?image|platzhalter|watermark|wasserzeichen/i,
  // Not "background"/"hintergrund" on their own: RIKA names its pack shots
  // "trio_freisteller_hintergrund_weiß" — a cut-out on a white background,
  // which is the best possible hero image.
  /(^|[^a-z0-9])icons?([^a-z0-9]|$)|banner|header-?bg|hero-?bg|bg-image|hintergrundbild/i,
  // Social and marketing
  /facebook|instagram|youtube|pinterest|twitter|tiktok|whatsapp|newsletter|gutschein|voucher|coupon|rabatt|sale-?badge|arrow|pfeil|spinner|loader|avatar|flag-?[a-z]{2}/i,
  // Editorial furniture rather than the product
  /website-?mit|kampagne|campaign|lookbook|moodboard|blog-?/i,
  // Catalogue/brochure artwork: Austroflamm served one magazine mockup as the
  // image of 35 different stoves.
  /magazine|magazin|mockup|mock-?up|katalog|catalogue|prospekt|brosch(ue|ü)re|flyer|preisliste/i,
];

export function isNonProductImage(url) {
  if (!url) return true;
  const name = decodeURIComponent(String(url).split("?")[0]);
  return NON_PRODUCT_PATTERNS.some((pattern) => pattern.test(name));
}

/** Tokens of 3+ chars, accents folded — used to match a filename to a model. */
function tokenize(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
}

// Words shared by nearly every listing carry no matching signal.
const STOPWORDS = new Set([
  "brennholz",
  "kaminholz",
  "scheitholz",
  "feuerholz",
  "holz",
  "premium",
  "der",
  "die",
  "das",
  "und",
  "mit",
  "cm",
  "kammergetrocknet",
  "naturgetrocknet",
  "trocken",
  "frisch",
  "palette",
  "karton",
  "sack",
  "kaminofen",
  "kaminoefen",
  "ofen",
  "pelletofen",
]);

/** Filenames that show a close-up, a drawing or a label rather than the stove. */
const DETAIL_ASSET =
  /detail|(^|[^a-z])det\d|zeichnung|drawing|masse|mass-?bild|schnitt|technik|diagram|skizze|energielabel|label|montage|explosion|abdeckung|regler|bedienhebel|griff|ersatzteil/i;

/**
 * Score an image URL for how likely it is to be *this* product's main photo.
 * Higher is better.
 */
function scoreImage(url, modelTokens) {
  const name = decodeURIComponent(String(url).split("?")[0].split("/").pop() ?? "");
  const nameTokens = new Set(tokenize(name));
  const collapsedName = tokenize(name).join("");
  let score = 0;

  // Filename mentions the model: the strongest signal of a product shot.
  for (const token of modelTokens) {
    if (nameTokens.has(token)) score += 10;
    else if (collapsedName.includes(token)) score += 7;
  }

  // Cut-outs and pack shots are usually flagged in the filename.
  if (/freisteller|freigestellt|packshot|produkt|product|cut-?out|transparent/i.test(name)) {
    score += 6;
  }
  // Ambience/lifestyle shots are legitimate gallery images but poor heroes.
  if (/ambiente|ambience|wohnzimmer|lifestyle|sfeer|room|raum|milieu|szene|scene|anwendung/i.test(name)) {
    score -= 8;
  }
  // A detail crop must lose to a plain product shot even when its filename
  // happens to repeat the model name ("hark_044_5_2gte_det02" vs the render).
  if (DETAIL_ASSET.test(name)) score -= 20;
  return score;
}

/**
 * Drop non-product images and order the rest so the best candidate is first.
 * Ties keep the source order, which is the page's own gallery order.
 *
 * @param {string[]} urls
 * @param {string} model    product name, used to match filenames
 * @param {string} [brand]  excluded from the tokens: the brand appears in every
 *                          filename of a source and so tells the images apart
 * @returns {string[]}
 */
/**
 * True when a filename identifies no particular product: an untitled camera
 * file (`IMG_7794.jpg`), or generic packaging/label artwork reused across a
 * whole range. Such an image may still be shown, but it cannot represent one
 * specific product on its own.
 */
export function isGenericImage(url) {
  if (!url) return true;
  const name = decodeURIComponent(String(url).split("?")[0].split("/").pop() ?? "");
  return /^(img|dsc|dscn|p)[-_]?\d+\.[a-z]+$/i.test(name) || /label|schuettgut|schüttgut/i.test(name);
}

export function rankProductImages(urls, model, brand = "") {
  const brandTokens = new Set(tokenize(brand));
  const modelTokens = tokenize(model).filter(
    (token) => !STOPWORDS.has(token) && !brandTokens.has(token),
  );
  const seenAssets = new Set();
  return urls
    .filter((url) => !isNonProductImage(url))
    .filter((url) => {
      // Shops serve the same file from several paths (…/product/2/x.jpg and
      // …/product/3/x.jpg); keeping both duplicated it in the gallery.
      const name = decodeURIComponent(String(url).split("?")[0].split("/").pop() ?? "").toLowerCase();
      if (seenAssets.has(name)) return false;
      seenAssets.add(name);
      return true;
    })
    .map((url, index) => ({ url, index, score: scoreImage(url, modelTokens) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.url);
}

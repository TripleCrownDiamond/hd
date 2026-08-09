/**
 * Verification gates that must pass before scaling.
 * Applied to the mini-batch of 3 first records.
 */

const REQUIRED_FIELDS = [
  "source",
  "source_url",
  "scraped_at",
  "content_hash",
  "type",
  "brand",
  "model",
  "slug",
  "descriptions.long_de_raw",
  "media.hero_image_url_source",
];

function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[äáàâ]/g, "a")
    .replace(/[öóòô]/g, "o")
    .replace(/[üúùû]/g, "u")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Structural check — every required field is non-null.
 */
export function checkStructure(record) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    const v = getPath(record, field);
    if (v === undefined || v === null || v === "") {
      errors.push(`missing required field: ${field}`);
    }
  }
  return errors;
}

/**
 * Colour code aliases used by manufacturer file naming conventions.
 * Keep in sync with scripts/scrape/spartherm.mjs COLOR_FILE_ALIASES.
 */
const CODE_ALIASES = {
  "black-edition": ["be", "black-edition", "blackedition"],
  perle: ["perle", "pearl"],
  weiss: ["weiss", "white"],
  kupfer: ["kupfer", "copper"],
  titan: ["titan", "titanium"],
  nero: ["nero", "black"],
  elfenbein: ["ivory", "elfenbein"],
};

/**
 * Cross-contamination check — every variant image URL basename must contain
 * ALL model slug tokens AND at least one of the variant code aliases.
 */
export function checkCrossContamination(record) {
  const errors = [];
  const modelSlug = slugify(record.model || "");
  const modelTokens = modelSlug.split("-").filter((t) => t.length > 0);

  for (const v of record.variants ?? []) {
    const code = slugify(v.code || "");
    const aliases = (CODE_ALIASES[code] ?? [code]).map((a) => a.replace(/[^a-z0-9]/g, ""));
    const urls = [
      { kind: "main_image", url: v.main_image_url_source },
      { kind: "video", url: v.video_url_source },
    ].filter((x) => x.url);

    for (const { kind, url } of urls) {
      const raw = url.split("/").pop().toLowerCase();
      const compact = raw.replace(/[^a-z0-9]/g, "");
      const matchesModel = modelTokens.every((t) => compact.includes(t));
      const matchesVariant = aliases.some((a) => compact.includes(a));
      if (!matchesModel || !matchesVariant) {
        errors.push(
          `variant '${v.code}' ${kind} URL basename '${raw}' does not match model '${modelSlug}' and code '${code}'`,
        );
      }
    }
  }
  return errors;
}

/**
 * Completeness check — count non-null leaves under technical + media + descriptions.
 * Return a score in [0, 1]. Warn if below threshold.
 */
export function completenessScore(record) {
  const buckets = ["technical", "media", "descriptions"];
  let total = 0;
  let filled = 0;
  const walk = (v) => {
    if (v === null || v === undefined) {
      total++;
    } else if (typeof v === "object" && !Array.isArray(v)) {
      Object.values(v).forEach(walk);
    } else if (Array.isArray(v)) {
      total++;
      if (v.length > 0) filled++;
    } else {
      total++;
      if (v !== "" && v !== false) filled++;
    }
  };
  buckets.forEach((b) => walk(record[b] ?? null));
  return total === 0 ? 0 : filled / total;
}

/**
 * Run all checks on a mini-batch. Return { ok, report }.
 */
export function runMiniBatchGate(records, options = {}) {
  const { minCompleteness = 0.35 } = options;
  const report = { total: records.length, structural: [], contamination: [], low: [] };

  for (const rec of records) {
    const s = checkStructure(rec);
    if (s.length) report.structural.push({ url: rec.source_url, errors: s });
    const c = checkCrossContamination(rec);
    if (c.length) report.contamination.push({ url: rec.source_url, errors: c });
    const score = completenessScore(rec);
    if (score < minCompleteness) {
      report.low.push({
        url: rec.source_url,
        score: Number(score.toFixed(2)),
      });
    }
  }

  const ok =
    report.structural.length === 0 && report.contamination.length === 0;
  return { ok, report };
}

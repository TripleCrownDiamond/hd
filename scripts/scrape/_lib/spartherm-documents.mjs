const SPARTHERM_ORIGIN = "https://www.spartherm.com";

export function classifySparthermDocument(title) {
  const normalized = title.toLocaleLowerCase("de-DE");
  if (normalized.includes("energielabel")) return "energy_label";
  if (
    normalized.includes("konformität") ||
    normalized.includes("leistungserklärung") ||
    normalized.includes("ökodesign")
  ) {
    return "certificate";
  }
  if (
    normalized.includes("anleitung") ||
    normalized.includes("bedienung") ||
    normalized.includes("montage")
  ) {
    return "manual";
  }
  if (normalized.includes("prospekt") || normalized.includes("brosch")) {
    return "brochure";
  }
  return "datasheet";
}

export function extractSparthermDocuments($) {
  const documents = [];
  const seen = new Set();

  $("a.download__item").each((_index, element) => {
    const href = $(element).attr("href")?.trim();
    const format = $(element).find(".download__size").text().trim().toUpperCase();
    if (!href || format !== "PDF") return;

    const sourceUrl = new URL(href, SPARTHERM_ORIGIN).toString();
    if (seen.has(sourceUrl)) return;
    seen.add(sourceUrl);

    const title =
      $(element).find(".download__title").text().replace(/\s+/g, " ").trim() ||
      "Produktdokument";

    documents.push({
      title,
      kind: classifySparthermDocument(title),
      source_url: sourceUrl,
    });
  });

  return documents;
}

const PRODUCT_DOCUMENT_GROUPS = [
  "eg-konformität",
  "energielabel",
  "leistungserklärung",
  "produktdatenblatt",
  "technische zeichnung",
  "ökodesign",
];

function preferenceScore(document) {
  const title = document.title.toLocaleLowerCase("de-DE");
  let score = title.length;
  if (title.includes("rlu")) score += 500;
  if (title.includes("s-kat")) score += 300;
  if (title.includes("s-thermatik")) score += 200;
  if (title.includes("(")) score += 100;
  return score;
}

/**
 * Keep one useful base-model PDF per document family. Product pages can expose
 * 20+ power/air-control permutations; presenting every permutation before the
 * customer has selected a configuration is misleading and creates a noisy UI.
 */
export function selectSparthermProductDocuments(documents) {
  return PRODUCT_DOCUMENT_GROUPS.flatMap((group) => {
    const candidates = documents
      .filter((document) =>
        document.title.toLocaleLowerCase("de-DE").includes(group),
      )
      .sort((a, b) => preferenceScore(a) - preferenceScore(b));
    return candidates.slice(0, 1);
  });
}

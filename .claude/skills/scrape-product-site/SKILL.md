---
name: scrape-product-site
description: End-to-end product scraping for HOLZKRAFT catalog. Analyze one manufacturer or shop site, pick the right tools per site, extract every product completely (main image, gallery, video, brochures, specs, variants, badges, price or quote fallback), verify each product before scaling, and produce a strict JSONL output ready for admin review. Use when the user asks to scrape a real product site or to onboard a new source into the catalog.
---

# Scrape product site

This skill governs how any real product site is scraped into HOLZKRAFT's catalog dataset. It exists so we never mix images across products, never invent data, never publish before human review, and never touch a source without checking its licensing.

The whole process is:

```
inspect  →  choose tools  →  implement  →  mini-batch verify (3 items)  →  scale
```

If any step fails, stop. Do not scale on a shaky base.

---

## 1. Before writing any code — inspect the site

For a target site (say `example.com/de/produkte/`):

1. **robots.txt** — fetch `https://example.com/robots.txt`. Note which paths are `Disallow`. Respect them even if the user has authorization; they are the site owner's crawler contract. Requesting one page manually is fine; batch-crawling a `Disallow` path is not.
2. **Sitemaps** — extract every `Sitemap:` line. Prefer sitemap URLs over spidering — they are the site's own inventory.
3. **One category page** and **one product fiche** — download to `scratchpad/`, grep for:
   - `<title>` and `<meta property="og:*">`
   - `<script type="application/ld+json">` — a `Product` JSON-LD often gives 80% of the fields
   - all image paths: `src="…"`, `data-src="…"`, `data-bg="…"`, `background-image:url(...)`, `srcset="…"`
   - videos: `<video>`, `<source src="…">`, `.mp4`/`.webm` URLs
   - PDFs: `href="…pdf"` (bewaring links to `/service/downloads/` centralized pages)
   - price hints: `€`, `EUR`, `preis`, `price`, `data-price`, JSON-LD `offers`
   - variant selectors: color swatches, dimension pickers, `data-variant` attributes
4. **JS-heavy?** — grep the raw HTML for meaningful text from the product page. If it's missing (client-rendered), you need Playwright, not cheerio. If present, `cheerio` is enough.
5. **Rate-limit signals** — try 2 requests 1s apart. If second one returns 429 or a captcha, back off hard.

Record your findings inline in `scripts/scrape/<source>.notes.md` — future you or a teammate will thank you.

---

## 2. Choose the right tool for the site

| Signal seen during inspection | Tool |
| --- | --- |
| Full HTML present in view-source, JSON-LD `Product` visible | `undici` + `cheerio` (fastest, cheapest) |
| Data appears only after JS runs, sit is a Next.js/Nuxt SPA, or filters use AJAX | `playwright` (already installed for e2e — reuse) |
| API endpoint visible in Network tab (JSON XHR) | `undici` directly against the JSON endpoint (bypass HTML entirely) |
| PDF brochures required | `pdfjs-dist` for text, plain fetch for the file bytes |
| PDF-only catalog (no HTML product pages) | download PDFs, `pdfjs-dist` extraction |

Never Playwright a site that serves everything server-side — it's 10× slower and burns CPU.

---

## 3. Legal / licensing gate

Before downloading a single asset (image, video, PDF) to disk:

1. Open `data/licenses.json`. Confirm an entry exists for the source with `authorized: true` **and** a stated `scope` covering the asset type you're about to fetch.
2. If the entry says `authorized: false` or is missing, the scraper is **spec-only mode**: it may extract text and record URLs but must not download binaries.
3. In authorized mode, downloaded assets go to `data/scraped/<source>/_assets/` locally. They are only pushed to Cloudinary when a human review sets the record's `review_status` to `approved`.
4. Never invent a certification, badge, or claim. If Ecodesign / BImSchV / energy class isn't present in the source's own text or in HKI CERT, do NOT populate that field — set it to `null` with `source: "not_found"`.

`data/licenses.json` shape:

```json
{
  "spartherm": {
    "authorized": true,
    "authorized_by": "user@example.com",
    "granted_at": "2026-07-28",
    "scope": ["specs", "images", "videos", "pdf"],
    "evidence": "chat statement 2026-07-28 by user in Claude Code session",
    "notes": ""
  }
}
```

---

## 4. What every product record must contain

The output JSONL (`data/scraped/<source>/<yyyy-mm-dd>.jsonl`) has one line per product. Missing fields are `null`, not omitted, so downstream code can tell "unknown" from "not applicable".

```jsonc
{
  "source": "spartherm",
  "source_url": "https://www.spartherm.com/de/produkt/ambiente-a3/",
  "source_locale": "de-DE",
  "scraped_at": "2026-07-28T22:00:00Z",
  "content_hash": "sha256:…",       // hash of raw HTML/JSON, used to skip unchanged
  "type": "stove",                     // wood | stove | briquette | pellet | accessory
  "brand": "Spartherm",
  "model": "ambiente a3",
  "slug": "spartherm-ambiente-a3",     // stable, lowercase-kebab, source-prefixed
  "identifiers": { "ean": null, "sku": null, "hki_id": null, "manufacturer_id": null },
  "category_source_label": "Kaminöfen",
  "descriptions": {
    "short_de": null,                  // one sentence, factual, without adjectives
    "long_de_raw": "…",                // source's own text, exact
    "long_de_authorized": true         // may we publish it? mirror license entry
  },
  "technical": {
    "power_kw_min": 4.5, "power_kw_max": 7.7, "power_kw_nominal": null,
    "efficiency_pct": null,
    "energy_class": "A",
    "fuel": "Holz",
    "flue_diameter_mm": null,
    "connection": null,               // "hinten"|"oben"|"beide"
    "dimensions_mm": { "height": 1469, "width": null, "depth": null },
    "weight_kg": null,
    "co_mg_nm3": null, "ogc_mg_nm3": null, "particulates_mg_nm3": null,
    "raw_air_independent": "optional", // Raumluftunabhängig
    "extra": { "…all remaining spec name/value pairs…": "…" }
  },
  "variants": [
    {
      "axis": "color",
      "code": "nero",
      "label_de": "Nero",
      "swatch_url_source": "https://…surfaces/nero.jpg",
      "main_image_url_source": "https://…kaminofen_ambiente-a3-nero.png",
      "video_url_source": "https://…kaminofen_ambiente-a3-nero-ani_1.mp4",
      "surcharge_cents": null
    }
  ],
  "media": {
    "hero_image_url_source": "https://…ambiente-a3-titan.png",
    "gallery_url_sources": ["https://…", "…"],
    "video_url_sources": ["https://…"],
    "energy_label_url_source": "https://…energy-efficiency-class-a.png",
    "licensed_to_download": true,      // mirror license entry
    "downloaded_local_paths": []       // filled only after actual download
  },
  "brochures_pdf": {
    "sources": ["https://…/datenblatt-ambiente-a3.pdf"],
    "licensed_to_download": true,
    "downloaded_local_paths": []
  },
  "certifications_seen": [             // only facts stated by the source itself
    { "name": "Ecodesign 2022", "value": true, "source": "product_page" },
    { "name": "BImSchV Stufe 2", "value": true, "source": "product_page" }
  ],
  "pricing": {
    "price_cents_public": null,        // if the source displays a public price
    "price_visible_on_source": false,
    "quote_mode": true,                // when no public price
    "quote_components_admin_only": [   // NEVER shown on the shop; admin-only reference
      { "name": "Kaminofen (Basispreis)", "estimate_cents_min": null, "estimate_cents_max": null, "source": "market_survey_pending" },
      { "name": "Zubehör Rauchrohr Set", "estimate_cents_min": 15000, "estimate_cents_max": 30000, "source": "market_survey_pending" },
      { "name": "Bodenplatte Glas", "estimate_cents_min": 12000, "estimate_cents_max": 25000, "source": "market_survey_pending" },
      { "name": "Montage durch Schornsteinfeger", "estimate_cents_min": 40000, "estimate_cents_max": 90000, "source": "market_survey_pending" }
    ]
  },
  "authorized": true,
  "review_status": "pending"           // pending | approved | rejected | superseded
}
```

Rules:
- `slug` is `<source-key>-<model-slug>` lowercased and kebabed. Uniqueness is enforced across the whole catalog.
- `content_hash` covers the raw source HTML/JSON, so we skip re-scraping unchanged pages on a re-run.
- `technical.extra` catches every remaining spec so we lose nothing even if it doesn't match a canonical field.
- `variants[].main_image_url_source` and `variants[].video_url_source` **must** actually correspond to that variant. Filename disambiguation is the failsafe: build a strict regex per variant code (e.g. `ambiente-a3-nero`) before assigning.
- `pricing.quote_components_admin_only` is only populated after a `market_survey` pass; the shop UI never shows these numbers, only the admin does.

---

## 5. Verification gate — the mini-batch of 3

**Never scale before verifying 3 real products end-to-end.** For every scaled scrape, the first 3 records go through:

1. **Structural check** — `zod` schema validates the JSON. Fail = fix.
2. **Cross-contamination check** — for each `variants[].main_image_url_source`, the URL basename must contain either the model slug or the variant code. If any variant image basename doesn't match, print the URL and stop.
3. **Completeness check** — count non-null fields vs. the "expected minimum" list per source. Warn if a product falls below.
4. **Visual check** — open the 3 source pages in the browser and eyeball the extracted `hero_image_url_source`, `long_de_raw`, and one full variant. Any mismatch = stop, do not scale.

Only when the 3-batch is green may the runner proceed on the remaining URLs.

---

## 6. Runner behaviour

- One process per source. Never crawl two sources in parallel (rate limiting is per-domain).
- Resume-able: read `data/scraped/<source>/_progress.json` at start, skip URLs already there with matching `content_hash`.
- Fetcher policy: 1 req / 3 s (default), configurable per source. Backoff on 429/503: 30 s, 60 s, 120 s, then abort.
- User-Agent: `HOLZKRAFT-Catalog-Bot/1.0 (contact@holzkraft.de)`.
- Cache: raw responses in `data/scraped/<source>/_cache/<sha256(url)>` for 24 h.
- Logging: JSONL to stderr, human summary to stdout every 10 products.
- Exit code 0 = full run. Exit code 1 = at least one product failed schema; the file `data/scraped/<source>/_errors.jsonl` lists what happened.

---

## 7. Quote-mode market survey (admin-only cost estimates)

For B2B sources like Spartherm that never show a price:

- Scraper leaves `pricing.quote_components_admin_only` populated with **canonical rows** (Basispreis, Rauchrohr-Set, Bodenplatte, Montage) with `estimate_cents_min/max: null` and `source: "market_survey_pending"`.
- A **separate** command (`pnpm run market:survey <slug>`) prompts the operator (or an authorized second pass) to fill the ranges from real German aggregators (Ofen.de, Kaminofen-Shop). Ranges only, never spot prices. Sources are recorded per row.
- The shop UI shows only the quote CTA and typical range **band** (e.g. "3.000 € – 5.000 € — Anfrage erforderlich"). The admin sees the row-by-row breakdown.

Never invent a range. If nothing is found, keep `null` and mark the product as `quote_only_no_estimate: true`.

---

## 8. When done for a source

- Move the day's file from `data/scraped/<source>/<yyyy-mm-dd>.jsonl` to `data/scraped/<source>/latest.jsonl` when it is the newest complete run.
- Update `data/scraped/_STATUS.md` with counts (scraped, complete, incomplete, errored).
- Do **not** import into Supabase automatically. That's the operator's job through the admin UI.

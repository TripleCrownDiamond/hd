import { describe, expect, it } from "vitest";
import { load } from "cheerio";
import {
  extractSparthermDocuments,
  selectSparthermProductDocuments,
} from "./spartherm-documents.mjs";

describe("Spartherm PDF extraction", () => {
  it("detects Mediabridge downloads whose URL has no .pdf suffix", () => {
    const $ = load(`
      <a class="download__item"
         href="https://mediabridge.spartherm.com/fmds/abc/dld:inlineattachment">
        <span class="download__title">Produktdatenblatt 6,3 kW</span>
        <span class="download__size">PDF</span>
      </a>
    `);

    expect(extractSparthermDocuments($)).toEqual([
      {
        title: "Produktdatenblatt 6,3 kW",
        kind: "datasheet",
        source_url:
          "https://mediabridge.spartherm.com/fmds/abc/dld:inlineattachment",
      },
    ]);
  });

  it("keeps the base document instead of an RLU permutation", () => {
    const selected = selectSparthermProductDocuments([
      {
        title: "Energielabel 6,3 kW RLU",
        kind: "energy_label",
        source_url: "https://example.test/rlu",
      },
      {
        title: "Energielabel 6,3 kW",
        kind: "energy_label",
        source_url: "https://example.test/base",
      },
    ]);

    expect(selected).toHaveLength(1);
    expect(selected[0].source_url).toBe("https://example.test/base");
  });
});

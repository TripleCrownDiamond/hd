#!/usr/bin/env node
/**
 * Build the German postcode table the storefront validates addresses against.
 *
 * Source: GeoNames postal-code export for DE (https://download.geonames.org),
 * licensed CC BY 4.0. The attribution is carried in the generated file and
 * shown on /liefergebiet — do not remove it.
 *
 * GeoNames lists one row per place, so a postcode that spans several
 * localities appears several times. The storefront needs one canonical name
 * per postcode plus the alternatives, so a visitor who types 25980 sees
 * "Sylt" and one who types 10115 sees "Berlin".
 *
 * Output: data/geo/plz-de.json
 *   { "generated_at": …, "source": …, "license": …, "places": { "10115": ["Berlin", "BE"] } }
 *
 * Usage: node scripts/data/build-plz.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import { inflateRawSync } from "node:zlib";

const SOURCE = "https://download.geonames.org/export/zip/DE.zip";
const OUT = "data/geo/plz-de.json";

/**
 * Read one file out of a ZIP archive.
 *
 * Node ships zlib but no ZIP reader, and pulling a dependency in for a single
 * build script is not worth it. The central directory is the only reliable
 * index: GeoNames writes the archive in streaming mode, so the local headers
 * carry a compressed size of zero and cannot be walked. Only the two methods
 * it uses are handled: stored (0) and deflate (8).
 */
function readZipEntry(buffer, wantedName) {
  // End of central directory record, scanned backwards over its variable
  // length comment.
  let eocd = -1;
  for (let offset = buffer.length - 22; offset >= 0; offset--) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd === -1) throw new Error("Not a ZIP archive: no end-of-central-directory record");

  const entryCount = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);

  for (let index = 0; index < entryCount; index++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");

    if (name === wantedName) {
      // The local header repeats the name and extra field with its own lengths.
      const localNameLength = buffer.readUInt16LE(localOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const data = buffer.subarray(dataStart, dataStart + compressedSize);
      if (method === 0) return data;
      if (method === 8) return inflateRawSync(data);
      throw new Error(`Unsupported ZIP compression method ${method} for ${name}`);
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error(`${wantedName} not found in archive`);
}

/** Berlin over Berlin-Mitte: the shorter, unqualified name is the one people type. */
function betterName(current, candidate) {
  if (!current) return candidate;
  const currentQualified = current.includes("-") || current.includes("(");
  const candidateQualified = candidate.includes("-") || candidate.includes("(");
  if (currentQualified !== candidateQualified) return candidateQualified ? current : candidate;
  return candidate.length < current.length ? candidate : current;
}

async function main() {
  console.log(`Downloading ${SOURCE} …`);
  const response = await fetch(SOURCE, {
    headers: { "user-agent": "HOLZKRAFT-Catalog-Bot/1.0 (contact@holzkraft.de)" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} from GeoNames`);
  const archive = Buffer.from(await response.arrayBuffer());
  const text = readZipEntry(archive, "DE.txt").toString("utf8");

  const places = {};
  let rows = 0;
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    // country, postal_code, place_name, admin_name1, admin_code1, …
    const [, postcode, placeName, , stateCode] = line.split("\t");
    if (!/^\d{5}$/.test(postcode ?? "")) continue;
    rows++;
    const existing = places[postcode];
    const name = betterName(existing?.[0], placeName.trim());
    places[postcode] = [name, (stateCode ?? "").trim() || (existing?.[1] ?? "")];
  }

  const payload = {
    generated_at: new Date().toISOString(),
    source: SOURCE,
    license: "CC BY 4.0 — © GeoNames (https://www.geonames.org)",
    count: Object.keys(places).length,
    places,
  };

  await mkdir("data/geo", { recursive: true });
  await writeFile(OUT, `${JSON.stringify(payload)}\n`);
  console.log(`${rows} rows -> ${payload.count} postcodes written to ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

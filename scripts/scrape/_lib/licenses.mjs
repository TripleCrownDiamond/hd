/**
 * Read data/licenses.json and expose a helper to check what a source is allowed to do.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

let cache;

function load() {
  if (cache) return cache;
  const raw = readFileSync(resolve(process.cwd(), "data/licenses.json"), "utf8");
  cache = JSON.parse(raw);
  return cache;
}

/**
 * @param {string} source e.g. "spartherm"
 * @param {string} kind   e.g. "images", "videos", "pdf", "specs"
 * @returns {{authorized:boolean,granted_at:string|null,scope:string[],evidence:string|null}}
 */
export function getLicense(source, kind) {
  const licenses = load();
  const entry = licenses[source];
  if (!entry) {
    return { authorized: false, granted_at: null, scope: [], evidence: null };
  }
  const authorized = entry.authorized === true && entry.scope?.includes(kind);
  return {
    authorized,
    granted_at: entry.granted_at ?? null,
    scope: entry.scope ?? [],
    evidence: entry.evidence ?? null,
  };
}

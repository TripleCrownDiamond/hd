#!/usr/bin/env node
/**
 * Link product_compliance_checks to their proof documents.
 *   Ecodesign 2022   <- documents titled "Ökodesign …"
 *   1. BImSchV Stufe 2 <- "Leistungserklärung …" or "Konformitätserklärung …"
 *
 * Only links to products that already have a verified/pending check row.
 * Uses SUPABASE_SECRET_KEY (service_role) — bypasses RLS. Idempotent.
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i.exec(line);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

const env = loadEnv(resolve(process.cwd(), ".env.local"));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

const ECO = "Ecodesign 2022";
const BIM = "1. BImSchV Stufe 2";

const hasAny = (title, tokens) => tokens.some((t) => title.toLowerCase().includes(t.toLowerCase()));

async function main() {
  const { data: checks, error: cErr } = await supabase
    .from("product_compliance_checks")
    .select("id, product_id, standard");
  if (cErr) throw new Error(`checks: ${cErr.message}`);

  const { data: docs, error: dErr } = await supabase
    .from("product_documents")
    .select("id, product_id, title, kind")
    .eq("kind", "certificate");
  if (dErr) throw new Error(`documents: ${dErr.message}`);

  const byProduct = {};
  for (const d of docs) {
    if (!byProduct[d.product_id]) byProduct[d.product_id] = [];
    byProduct[d.product_id].push(d);
  }

  const updates = [];
  let matched = 0;

  for (const c of checks) {
    const productDocs = byProduct[c.product_id] || [];
    let documentId = null;

    if (c.standard === ECO) {
      documentId = productDocs.find((d) => hasAny(d.title, ["ökodesign"]))?.id ?? null;
    } else if (c.standard === BIM) {
      documentId =
        productDocs.find((d) => hasAny(d.title, ["leistungserklärung"]))?.id ??
        productDocs.find((d) => hasAny(d.title, ["konformitätserklärung"]))?.id ??
        null;
    }

    if (documentId) {
      updates.push({ id: c.id, document_id: documentId });
      matched += 1;
    }
  }

  if (updates.length === 0) {
    console.log("No links to create.");
    return;
  }

  let ok = 0;
  for (const u of updates) {
    const { error } = await supabase
      .from("product_compliance_checks")
      .update({ document_id: u.document_id })
      .eq("id", u.id);
    if (error) throw new Error(`update ${u.id}: ${error.message}`);
    ok += 1;
  }

  console.log(`Linked ${ok} compliance checks to their certificate documents.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

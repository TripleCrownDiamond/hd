#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { load as loadCheerio } from "cheerio";
import { fetchUrl } from "../scrape/_lib/fetcher.mjs";
import { getLicense } from "../scrape/_lib/licenses.mjs";
import {
  extractSparthermDocuments,
  selectSparthermProductDocuments,
} from "../scrape/_lib/spartherm-documents.mjs";

const CACHE_DIR = "data/scraped/spartherm/_cache";
const BUCKET = "documents";

const { values } = parseArgs({
  options: {
    limit: { type: "string" },
    dryRun: { type: "boolean", default: false },
  },
  allowPositionals: true,
});

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i.exec(line);
    if (!match) continue;
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

function safeSegment(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function main() {
  const license = getLicense("spartherm", "pdf");
  if (!license.authorized || !license.evidence) {
    throw new Error(
      "Spartherm PDF import refused: authorization and evidence are required in data/licenses.json.",
    );
  }

  const env = loadEnv(resolve(process.cwd(), ".env.local"));
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local.",
    );
  }

  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  let query = supabase
    .from("products")
    .select("id,slug,model,source_url")
    .eq("source", "spartherm")
    .order("model", { ascending: true });
  if (values.limit) query = query.limit(Number.parseInt(values.limit, 10));

  const { data: products, error: productsError } = await query;
  if (productsError) throw new Error(`products read: ${productsError.message}`);

  const discovered = [];
  for (const product of products) {
    if (!product.source_url) continue;
    const { body } = await fetchUrl(product.source_url, { cacheDir: CACHE_DIR });
    const documents = selectSparthermProductDocuments(
      extractSparthermDocuments(loadCheerio(body)),
    );
    for (const document of documents) {
      discovered.push({ product, document });
    }
    console.log(`  ${product.model}: ${documents.length} PDF`);
  }

  console.log(
    `Found ${discovered.length} product-document assignments ` +
      `(${new Set(discovered.map(({ document }) => document.source_url)).size} unique files) ` +
      `for ${products.length} products.`,
  );
  if (values.dryRun) return;

  const { data: buckets, error: bucketsError } =
    await supabase.storage.listBuckets();
  if (bucketsError) throw new Error(`storage buckets: ${bucketsError.message}`);
  if (!buckets.some((bucket) => bucket.name === BUCKET)) {
    const { error: createBucketError } = await supabase.storage.createBucket(
      BUCKET,
      {
        public: false,
        allowedMimeTypes: ["application/pdf"],
        fileSizeLimit: "20MB",
      },
    );
    if (createBucketError) {
      throw new Error(
        `create private bucket "${BUCKET}": ${createBucketError.message}`,
      );
    }
    console.log(`Created private Supabase Storage bucket "${BUCKET}".`);
  }

  let uploaded = 0;
  let linked = 0;
  let failed = 0;
  const uploadedBySourceUrl = new Map();
  const getOrUpload = (document) => {
    if (uploadedBySourceUrl.has(document.source_url)) {
      return uploadedBySourceUrl.get(document.source_url);
    }

    const uploadPromise = (async () => {
      const { body, headers } = await fetchUrl(document.source_url, {
        as: "buffer",
        cacheDir: null,
      });
      const contentType = headers["content-type"]?.split(";")[0]?.trim();
      if (!body.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
        throw new Error(
          `Not a PDF: ${document.source_url} (${contentType ?? "unknown"})`,
        );
      }

      const hash = sha256(body);
      const storagePath =
        "spartherm/" +
        `${safeSegment(document.title) || "produktdokument"}-${hash.slice(0, 12)}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, body, {
          contentType: "application/pdf",
          upsert: true,
        });
      if (uploadError) {
        throw new Error(
          `upload ${storagePath} (${body.length} bytes, ${document.source_url}): ` +
            `${uploadError.message}`,
        );
      }
      uploaded++;
      return storagePath;
    })();

    uploadedBySourceUrl.set(document.source_url, uploadPromise);
    return uploadPromise;
  };

  const importAssignment = async ({ product, document }) => {
    const { data: existing, error: existingError } = await supabase
      .from("product_documents")
      .select("id,storage_path")
      .eq("product_id", product.id)
      .eq("title", document.title)
      .maybeSingle();
    if (existingError) {
      throw new Error(
        `document lookup ${product.slug}/${document.title}: ${existingError.message}`,
      );
    }
    if (existing) {
      console.log(`  · ${product.model} — ${document.title} [already stored]`);
      return;
    }

    const storagePath = await getOrUpload(document);
    const { error: insertError } = await supabase
      .from("product_documents")
      .insert({
        product_id: product.id,
        kind: document.kind,
        title: document.title,
        storage_path: storagePath,
        language: "de-DE",
      });
    if (insertError) {
      throw new Error(`document insert ${storagePath}: ${insertError.message}`);
    }
    linked++;
    console.log(`  ✓ ${product.model} — ${document.title}`);
  };

  const batchSize = 12;
  for (let index = 0; index < discovered.length; index += batchSize) {
    await Promise.all(
      discovered.slice(index, index + batchSize).map(async (assignment) => {
        try {
          await importAssignment(assignment);
        } catch (error) {
          failed++;
          console.error(
            `  ✗ ${assignment.product.model} — ${assignment.document.title}: ${error.message}`,
          );
        }
      }),
    );
  }

  console.log(
    `Uploaded ${uploaded} PDF files; inserted ${linked} document rows; ` +
      `${failed} failed assignments.`,
  );
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

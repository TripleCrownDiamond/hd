#!/usr/bin/env node
/**
 * Apply a SQL migration file directly to Supabase via direct PostgreSQL connection.
 *
 * Usage: node apply-migration.mjs <path-to-sql>
 *
 * Expects SUPABASE_DATABASE_PASSWORD in .env.local.
 * Connects as postgres@db.<project-ref>.supabase.co:6543
 */

import pg from "pg";
import { readFileSync, existsSync } from "node:fs";
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

async function main() {
  const migrationPath = process.argv[2];
  if (!migrationPath) {
    console.error("Usage: node apply-migration.mjs <path-to-sql>");
    process.exit(1);
  }
  const fullPath = resolve(process.cwd(), migrationPath);
  if (!existsSync(fullPath)) {
    console.error(`Migration file not found: ${fullPath}`);
    process.exit(1);
  }

  const sql = readFileSync(fullPath, "utf8");
  const env = loadEnv(resolve(process.cwd(), ".env.local"));
  const projectUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const dbPassword = env.SUPABASE_DATABASE_PASSWORD;

  if (!projectUrl || !dbPassword) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_DATABASE_PASSWORD in .env.local.\n" +
        "SQL printed below for manual execution in Supabase Dashboard SQL editor:\n",
    );
    console.log(sql);
    return;
  }

  const projectRef = projectUrl.replace("https://", "").replace(".supabase.co", "");

  // Try common Supabase pooler regions
  const regions = ["eu-west-1", "eu-central-1", "us-east-1", "us-west-1"];
  let pool = null;
  let connected = false;

  for (const region of regions) {
    try {
      const testPool = new pg.Pool({
        host: `aws-0-${region}.pooler.supabase.com`,
        port: 6543,
        database: "postgres",
        user: `postgres.${projectRef}`,
        password: dbPassword,
        ssl: { rejectUnauthorized: false },
        max: 1,
        connectionTimeoutMillis: 5000,
      });
      const client = await testPool.connect();
      await client.query("SELECT 1");
      client.release();
      pool = testPool;
      connected = true;
      console.log(`Connected via ${region} pooler.`);
      break;
    } catch {
      // try next region
    }
  }

  if (!connected) {
    console.error(
      "Could not connect to database via any pooler region. SQL printed below for manual execution:\n",
    );
    console.log(sql);
    return;
  }

  console.log(`Applying migration: ${migrationPath}`);

  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("Migration applied successfully.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

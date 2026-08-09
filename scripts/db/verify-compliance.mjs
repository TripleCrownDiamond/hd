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
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

const env = loadEnv(resolve(process.cwd(), ".env.local"));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const pw = env.SUPABASE_DATABASE_PASSWORD;
const ref = url.replace("https://", "").replace(".supabase.co", "");

const pool = new pg.Pool({
  host: "aws-0-eu-west-1.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  user: `postgres.${ref}`,
  password: pw,
  ssl: { rejectUnauthorized: false },
  max: 1,
});
const c = await pool.connect();

const r1 = await c.query(`
  select c.standard, c.status, count(*) as total,
         count(c.document_id) as with_doc
  from public.product_compliance_checks c
  group by c.standard, c.status order by c.standard, c.status
`);
console.log(JSON.stringify(r1.rows, null, 2));

const r2 = await c.query(`
  select count(*) as products_eco_verified
  from public.products where ecodesign_2022 = true and bimschv_stufe = 'Stufe 2'
`);
console.log("products eco+bimschv verified:", r2.rows[0].products_eco_verified);

const r3 = await c.query("select count(*) as devices from public.hki_devices");
console.log("hki_devices:", r3.rows[0].devices);

c.release();
await pool.end();

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

await c.query("begin");
const del = await c.query(`
  with deleted as (
    delete from public.economic_operators
    returning id
  )
  update public.products
  set economic_operator_id = null
  where economic_operator_id in (select id from deleted)
`);
console.log("products unlinked:", del.rowCount);
const chk = await c.query("select count(*) as ops from public.economic_operators");
console.log("economic_operators remaining:", chk.rows[0].ops);
const chk2 = await c.query("select count(*) as nulls from public.products where economic_operator_id is null");
console.log("products with null operator:", chk2.rows[0].nulls);
await c.query("commit");

c.release();
await pool.end();

import { createClient } from "@supabase/supabase-js";
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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

const { data: hki, error } = await supabase.from("hki_devices").select("*");
if (error) { console.error(error.message); process.exit(1); }
console.log("hki_devices count:", hki.length);
hki.slice(0, 3).forEach((d) => console.log(" ", d.slug, d.model_label, "rlu:", d.rlu_approved, "eco:", d.ecodesign_passed));

const { data: prod } = await supabase.from("products").select("slug, ecodesign_2022, bimschv_stufe").eq("bimschv_stufe", "Stufe 2");
console.log("Products with BImSchV Stufe 2:", prod?.length || 0);

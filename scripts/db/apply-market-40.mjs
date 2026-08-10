// Apply the -40 % market reduction to every priced product (user instruction
// 2026-08-10, already honoured by scripts/scrape/bri-brennholz.mjs).
//   --apply   actually write; without it, prints the plan.
//   --limit N restrict to N products (for a first batch).
// Run: set -a; source .env.local; set +a; node scripts/db/apply-market-40.mjs [--apply] [--limit N]
import { createClient } from "@supabase/supabase-js";

const apply = process.argv.includes("--apply");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 0;

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const money = (c) => c == null ? "—" : `${(c / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`;

// PostgREST caps a single request at 1000 rows; paginate to cover the whole
// priced catalogue (~2300 products).
const PAGE = 1000;
const plan = [];
let examined = 0;
for (let offset = 0; ; offset += PAGE) {
  if (limit && examined >= limit) break;
  const pageLimit = limit ? Math.min(PAGE, limit - examined) : PAGE;
  const { data: rows, error } = await supabase
    .from("products")
    .select("id,model,price_cents_public,extra,source")
    .not("price_cents_public", "is", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageLimit - 1);
  if (error) throw new Error(`read: ${error.message}`);
  if (!rows?.length) break;
  examined += rows.length;
  for (const r of rows) {
    const e = r.extra ?? {};
    const raw = e.price_text_raw ?? e.source_price_text ?? e.price_text ?? null;
    const sourceCents = e.source_price_cents ?? null;
    const parsed = typeof raw === "string" ? raw.match(/(\d{1,3}(?:\.\d{3})*,\d{2})/) : null;
    const src = sourceCents != null ? sourceCents
      : parsed ? Math.round(Number(parsed[1].replace(/\./g, "").replace(",", ".")) * 100) : null;
    if (src == null) continue; // no verifiable source price → leave alone
    if (typeof raw === "string" && raw.includes("nach -40%")) continue; // already reduced by the scraper, adjusted by hand since
    const target = Math.round(src * 0.6);
    if (Math.abs(target - r.price_cents_public) <= 1) continue; // already at -40 %
    if (r.price_cents_public <= target) continue; // already at or below target — deliberate
    plan.push({ id: r.id, model: r.model, source: r.source, from: r.price_cents_public, to: target });
  }
  if (rows.length < pageLimit) break;
}


console.log(`${apply ? "APPLY" : "PLAN"}: ${plan.length} produits à corriger (sur ${examined} avec prix examinés)`);
const bySource = {};
for (const p of plan) bySource[p.source] = (bySource[p.source] ?? 0) + 1;
console.log("Par source:", bySource);
const totalDelta = plan.reduce((s, p) => s + (p.from - p.to), 0);
console.log(`Impact total: -${money(totalDelta)} (marge perdue si tout appliqué)`);
for (const p of plan.slice(0, 15)) {
  console.log(`  ${String(p.source).padEnd(16)} ${p.model.slice(0, 44)} ${money(p.from)} → ${money(p.to)}`);
}
if (plan.length > 15) console.log(`  … et ${plan.length - 15} autres`);

if (!apply) {
  console.log("\nDry-run. Relancez avec --apply pour appliquer.");
  process.exit(0);
}

let ok = 0, failed = 0;
for (const p of plan) {
  const { error: upErr } = await supabase
    .from("products")
    .update({ price_cents_public: p.to })
    .eq("id", p.id);
  if (upErr) { failed++; console.log(`  ✗ ${p.model.slice(0, 50)}: ${upErr.message}`); }
  else ok++;
  // Keep the audit trail light: log every 50.
  if ((ok + failed) % 50 === 0) console.log(`  … ${ok + failed}/${plan.length}`);
}
console.log(`\nFait: ${ok} mis à jour, ${failed} en échec.`);

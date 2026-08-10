import type { Metadata } from "next";
import { ShoppingBag, PackageOpen, Users, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminHeader } from "@/components/admin/admin-ui";
import { GoLiveChecklist } from "@/components/admin/go-live-checklist";
import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin – Aperçu", robots: { index: false, follow: false } };

/** A count read that degrades to 0 instead of crashing the dashboard. */
async function safeCount(query: PromiseLike<{ count: number | null }>): Promise<number> {
  try {
    const { count } = await query;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** A list read that degrades to an empty list instead of crashing the dashboard. */
async function safeRows<T>(query: PromiseLike<{ data: T[] | null }>): Promise<T[]> {
  try {
    const { data } = await query;
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function AdminOverviewPage() {
  const db = await getMigrationAwareServerSupabase();
  // The dashboard is read-only diagnostics: a transient Supabase failure must
  // not take the whole admin down with it. Each read degrades to 0 / an empty
  // list, the same stance the storefront takes for settings and media.
  const [products, orders, customers, invoices, recent] = await Promise.all([
    safeCount(db.from("products").select("id", { count: "exact", head: true })),
    safeCount(db.from("orders").select("id", { count: "exact", head: true })),
    safeCount(db.from("profiles").select("id", { count: "exact", head: true })),
    safeCount(db.from("invoices").select("id", { count: "exact", head: true })),
    safeRows(
      db.from("orders")
        .select("id,order_number,customer_name,status,total_cents")
        .order("created_at", { ascending: false })
        .limit(5),
    ),
  ]);
  const stats = [
    ["Produits", products, PackageOpen], ["Commandes", orders, ShoppingBag],
    ["Clients", customers, Users], ["Factures", invoices, FileText],
  ] as const;
  return <div className="space-y-8"><AdminHeader eyebrow="Exploitation" title="Aperçu" description="État actuel du catalogue, des commandes, des clients et des documents." />
    <GoLiveChecklist />
    <section aria-label="Indicateurs" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([label,value,Icon]) => <Card key={label}><CardContent className="pt-6"><div className="bg-brand/5 flex size-10 items-center justify-center rounded-lg"><Icon className="text-brand size-5" /></div><p className="text-muted mt-4 text-xs font-semibold tracking-wider uppercase">{label}</p><p className="text-text mt-1 font-mono text-3xl font-semibold">{value}</p></CardContent></Card>)}</section>
    <Card><CardHeader><CardTitle>Dernières commandes</CardTitle><CardDescription>Les cinq dernières commandes créées.</CardDescription></CardHeader><CardContent>{recent.length === 0 ? <p className="text-muted py-8 text-center text-sm">Aucune commande pour le moment.</p> : <ul className="divide-border divide-y">{recent.map((order) => <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0"><strong>{order.order_number}</strong><span className="text-muted ml-2 text-sm">{order.customer_name}</span></div><div className="flex items-center gap-3"><Badge>{order.status}</Badge><span className="font-mono text-sm">{formatPrice(order.total_cents)}</span></div></li>)}</ul>}</CardContent></Card>
  </div>;
}

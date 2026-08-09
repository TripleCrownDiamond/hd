import type { Metadata } from "next";
import { ShoppingBag, PackageOpen, Users, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminHeader } from "@/components/admin/admin-ui";
import { GoLiveChecklist } from "@/components/admin/go-live-checklist";
import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin – Übersicht", robots: { index: false, follow: false } };

export default async function AdminOverviewPage() {
  const db = await getMigrationAwareServerSupabase();
  const [products, orders, customers, invoices, recent] = await Promise.all([
    db.from("products").select("id", { count: "exact", head: true }),
    db.from("orders").select("id", { count: "exact", head: true }),
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("invoices").select("id", { count: "exact", head: true }),
    db.from("orders").select("id,order_number,customer_name,status,total_cents").order("created_at", { ascending: false }).limit(5),
  ]);
  const stats = [
    ["Produkte", products.count ?? 0, PackageOpen], ["Bestellungen", orders.count ?? 0, ShoppingBag],
    ["Kunden", customers.count ?? 0, Users], ["Rechnungen", invoices.count ?? 0, FileText],
  ] as const;
  return <div className="space-y-8"><AdminHeader eyebrow="Betrieb" title="Übersicht" description="Aktueller Stand von Katalog, Bestellungen, Kunden und Dokumenten." />
    <GoLiveChecklist />
    <section aria-label="Kennzahlen" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([label,value,Icon]) => <Card key={label}><CardContent className="pt-6"><div className="bg-brand/5 flex size-10 items-center justify-center rounded-lg"><Icon className="text-brand size-5" /></div><p className="text-muted mt-4 text-xs font-semibold tracking-wider uppercase">{label}</p><p className="text-text mt-1 font-mono text-3xl font-semibold">{value}</p></CardContent></Card>)}</section>
    <Card><CardHeader><CardTitle>Letzte Bestellungen</CardTitle><CardDescription>Die fünf zuletzt angelegten Vorgänge.</CardDescription></CardHeader><CardContent>{!recent.data?.length ? <p className="text-muted py-8 text-center text-sm">Noch keine Bestellungen vorhanden.</p> : <ul className="divide-border divide-y">{recent.data.map((order) => <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><strong>{order.order_number}</strong><span className="text-muted ml-2 text-sm">{order.customer_name}</span></div><div className="flex items-center gap-3"><Badge>{order.status}</Badge><span className="font-mono text-sm">{formatPrice(order.total_cents)}</span></div></li>)}</ul>}</CardContent></Card>
  </div>;
}

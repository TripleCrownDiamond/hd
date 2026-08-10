"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/admin/admin-ui";
import { issueInvoice } from "@/app/admin/actions";

type Row = { name: string; quantity: string; price: string; alsoToSite: boolean };

const emptyRow = (): Row => ({ name: "", quantity: "1", price: "", alsoToSite: false });

/**
 * Issue the invoice for one order, with the option to append extra line items
 * (products sold by hand that were not in the order) and to publish any of
 * them in the catalogue at the same time.
 */
export function InvoiceIssueForm({
  orderId,
  orderNumber,
  customer,
  totalCents,
}: {
  orderId: string;
  orderNumber: string;
  customer: string;
  totalCents: number;
}) {
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const update = (index: number, patch: Partial<Row>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const addRow = () => setRows((current) => [...current, emptyRow()]);
  const removeRow = (index: number) =>
    setRows((current) => (current.length > 1 ? current.filter((_, i) => i !== index) : current));

  const submit = (formData: FormData) => {
    const filled = rows.filter((row) => row.name.trim());
    for (const [index, row] of filled.entries()) {
      formData.set(`line_name_${index}`, row.name.trim());
      formData.set(`line_quantity_${index}`, row.quantity.trim() || "1");
      formData.set(`line_price_${index}`, row.price.trim());
      formData.set(`line_site_${index}`, row.alsoToSite ? "on" : "");
    }
    formData.set("line_count", String(filled.length));
    startTransition(async () => {
      try {
        setError(null);
        await issueInvoice(formData);
        formRef.current?.reset();
        setRows([emptyRow()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "La facture n'a pas pu être émise.");
      }
    });
  };

  const extraTotal = rows.reduce((sum, row) => {
    const qty = Number(row.quantity.replace(",", ".")) || 0;
    const price = Number(row.price.replace(",", ".")) || 0;
    return sum + Math.round(qty * price * 100);
  }, 0);
  const grandTotal = totalCents + extraTotal;
  const money = (cents: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);

  return (
    <form action={submit} ref={formRef} className="mt-4 space-y-4">
      <input type="hidden" name="order_id" value={orderId} />
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <p className="font-medium">{orderNumber} · {customer}</p>
        <p className="text-muted">
          Total commande <strong className="text-text">{money(totalCents)}</strong>
          {extraTotal > 0 ? <> + lignes <strong className="text-text">{money(extraTotal)}</strong> = <strong className="text-text">{money(grandTotal)}</strong></> : null}
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-muted text-xs">Lignes supplémentaires (facultatif) — produits vendus à part, ajoutés à la facture. Cochez « aussi au site » pour publier le produit dans le catalogue au prix saisi.</p>
        {rows.map((row, index) => (
          <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-[1fr_5rem_7rem_auto_auto]">
            <label className="text-text grid gap-1 text-sm font-medium">
              Produit
              <input value={row.name} onChange={(e) => update(index, { name: e.target.value })} placeholder="Nom du produit" className={fieldClass} />
            </label>
            <Field label="Quantité">
              <input value={row.quantity} onChange={(e) => update(index, { quantity: e.target.value })} inputMode="decimal" className={fieldClass} />
            </Field>
            <Field label="Prix unitaire (€)">
              <input value={row.price} onChange={(e) => update(index, { price: e.target.value })} placeholder="0,00" inputMode="decimal" className={fieldClass} />
            </Field>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input type="checkbox" checked={row.alsoToSite} onChange={(e) => update(index, { alsoToSite: e.target.checked })} className="size-4 accent-[var(--color-brand)]" />
              Aussi au site
            </label>
            <div className="flex items-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(index)} disabled={rows.length <= 1}>Retirer</Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={addRow}>Ajouter une ligne</Button>
      </div>

      {error ? <p className="text-red-600 text-sm" role="alert">{error}</p> : null}
      <Button disabled={pending}>{pending ? "Émission…" : "Émettre le PDF"}</Button>
    </form>
  );
}

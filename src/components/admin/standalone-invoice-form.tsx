"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, fieldClass } from "@/components/admin/admin-ui";
import { issueStandaloneInvoiceAction } from "@/app/admin/actions";

type Row = { name: string; quantity: string; price: string; taxRate: string; alsoToSite: boolean };

// German firewood (Brennholz) is 7 % VAT, everything else 19 % — an issued
// invoice is immutable, so the rate must be chosen before freezing it.
const TAX_RATES = [
  ["19", "19 %"],
  ["7", "7 % (Brennholz)"],
] as const;

const emptyRow = (): Row => ({ name: "", quantity: "1", price: "", taxRate: "19", alsoToSite: false });

/** A catalogue product the admin can pick from, to prefill name and price. */
export interface StandaloneProductOption {
  id: string;
  name: string;
  priceCents: number;
}

const money = (cents: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);

/**
 * Issue an invoice without an order — a sale concluded by hand, phone or at
 * the yard. Lines can be picked from the catalogue (name and price prefill) or
 * typed freehand, including a fully custom product that does not exist in the
 * database. Marking a line "auch im Shop" publishes it in the catalogue too.
 * An optional deposit (Anzahlung) splits the total into what is due now and
 * the rest.
 */
export function StandaloneInvoiceForm({
  products,
  depositDefaultPercent = 30,
}: {
  products: StandaloneProductOption[];
  /** The deposit percentage configured in /admin/zahlungen, prefilled. */
  depositDefaultPercent?: number;
}) {
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositPercent, setDepositPercent] = useState(String(depositDefaultPercent));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const update = (index: number, patch: Partial<Row>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const addRow = () => setRows((current) => [...current, emptyRow()]);
  const removeRow = (index: number) =>
    setRows((current) => (current.length > 1 ? current.filter((_, i) => i !== index) : current));

  /** When a catalogue product is picked, prefill name and price (if still empty). */
  const pickProduct = (index: number, productId: string) => {
    const product = products.find((entry) => entry.id === productId);
    if (!product) return;
    setRows((current) =>
      current.map((row, i) =>
        i === index
          ? { ...row, name: row.name || product.name, price: row.price || (product.priceCents / 100).toFixed(2).replace(".", ",") }
          : row,
      ),
    );
  };

  const submit = (formData: FormData) => {
    const filled = rows.filter((row) => row.name.trim());
    for (const [index, row] of filled.entries()) {
      formData.set(`sa_name_${index}`, row.name.trim());
      formData.set(`sa_quantity_${index}`, row.quantity.trim() || "1");
      formData.set(`sa_price_${index}`, row.price.trim());
      formData.set(`sa_tax_${index}`, row.taxRate || "19");
      formData.set(`sa_site_${index}`, row.alsoToSite ? "on" : "");
    }
    formData.set("sa_line_count", String(filled.length));
    formData.set("sa_deposit_enabled", depositEnabled ? "on" : "");
    formData.set("sa_deposit_percent", depositPercent.trim() || "30");
    startTransition(async () => {
      try {
        setError(null);
        await issueStandaloneInvoiceAction(formData);
        formRef.current?.reset();
        setRows([emptyRow()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "La facture n'a pas pu être émise.");
      }
    });
  };

  const grandTotal = rows.reduce((sum, row) => {
    const qty = Number(row.quantity.replace(",", ".")) || 0;
    const price = Number(row.price.replace(",", ".")) || 0;
    return sum + Math.round(qty * price * 100);
  }, 0);

  return (
    <form action={submit} ref={formRef} className="mt-4 space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Field label="Client *"><input name="sa_customer_name" required maxLength={120} placeholder="Nom du client" className={fieldClass} /></Field>
        <Field label="E-mail"><input name="sa_customer_email" type="email" placeholder="client@exemple.de" className={fieldClass} /></Field>
        <Field label="Rue"><input name="sa_customer_street" placeholder="Rue" className={fieldClass} /></Field>
        <Field label="N°"><input name="sa_customer_house_number" className={fieldClass} /></Field>
        <Field label="Code postal"><input name="sa_customer_postcode" className={fieldClass} /></Field>
        <Field label="Ville"><input name="sa_customer_city" className={fieldClass} /></Field>
      </div>

      <div className="space-y-3">
        <p className="text-muted text-xs">
          Lignes de la facture — choisissez un produit du catalogue (nom et prix se remplissent) ou saisissez
          librement un produit. Cochez « aussi au site » pour publier le produit dans le catalogue au prix saisi.
        </p>
        {rows.map((row, index) => (
          <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-[1fr_5rem_7rem_6rem_auto_auto]">
            <label className="text-text grid gap-1 text-sm font-medium">
              Produit
              <input
                value={row.name}
                onChange={(e) => update(index, { name: e.target.value })}
                list={`sa-products-${index}`}
                placeholder="Nom du produit (ou choisir ci-dessous)"
                className={fieldClass}
              />
              <datalist id={`sa-products-${index}`}>
                {products.map((product) => (
                  <option key={product.id} value={product.name} />
                ))}
              </datalist>
            </label>
            <Field label="Quantité">
              <input value={row.quantity} onChange={(e) => update(index, { quantity: e.target.value })} inputMode="decimal" className={fieldClass} />
            </Field>
            <Field label="Prix unitaire (€)">
              <input value={row.price} onChange={(e) => update(index, { price: e.target.value })} placeholder="0,00" inputMode="decimal" className={fieldClass} />
            </Field>
            <Field label="TVA">
              <select value={row.taxRate} onChange={(e) => update(index, { taxRate: e.target.value })} className={fieldClass}>
                {TAX_RATES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="secondary" size="sm" onClick={addRow}>Ajouter une ligne</Button>
          <select
            aria-label="Choisir un produit du catalogue"
            className="border-border bg-surface text-text h-10 rounded-md border px-3 text-sm"
            defaultValue=""
            onChange={(e) => { if (e.target.value) { pickProduct(rows.length - 1, e.target.value); e.target.value = ""; } }}
          >
            <option value="" disabled>Choisir un produit du catalogue…</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.name} — {money(product.priceCents)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg border p-3">
        <label className="text-text flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="sa_deposit_enabled"
            checked={depositEnabled}
            onChange={(event) => setDepositEnabled(event.target.checked)}
            className="size-4 accent-[var(--color-brand)]"
          />
          Acompte (Anzahlung) — le client paie un pourcentage de la facture maintenant
        </label>
        {depositEnabled && (
          <div className="mt-3 grid gap-2 sm:max-w-xs">
            <Field label="Pourcentage de l'acompte (%)">
              <input
                name="sa_deposit_percent"
                value={depositPercent}
                onChange={(event) => setDepositPercent(event.target.value)}
                inputMode="numeric"
                className={fieldClass}
              />
            </Field>
          </div>
        )}
      </div>

      <div className="text-sm">
        <div>
          <span className="text-muted">Total facture : </span>
          <strong className="text-text font-mono">{money(grandTotal)}</strong>
        </div>
        {depositEnabled && (() => {
          const percent = Number(depositPercent.replace(",", ".")) || 0;
          const depositCents = Math.round((grandTotal * percent) / 100);
          return (
            <>
              <div>
                <span className="text-muted">Acompte ({percent} %) : </span>
                <strong className="text-text font-mono">{money(depositCents)}</strong>
              </div>
              <div>
                <span className="text-muted">Restant : </span>
                <strong className="text-text font-mono">{money(grandTotal - depositCents)}</strong>
              </div>
            </>
          );
        })()}
      </div>

      {error ? <p className="text-red-600 text-sm" role="alert">{error}</p> : null}
      <Button disabled={pending || grandTotal <= 0}>{pending ? "Émission…" : "Émettre le PDF (sans commande)"}</Button>
    </form>
  );
}

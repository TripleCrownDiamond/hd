"use client";

import { useState } from "react";
import { Field, fieldClass } from "@/components/admin/admin-ui";
import {
  BASE_PRICE_UNIT_LABEL,
  computeBasePriceCents,
  formatBasePrice,
  formatPrice,
  type BasePriceUnit,
  type QuantityUnit,
} from "@/lib/utils";

const QUANTITY_UNITS: Array<[QuantityUnit, string]> = [
  ["kg", "Kilogramm (kg)"],
  ["t", "Tonne (t)"],
  ["srm", "Schüttraummeter (SRM)"],
  ["rm", "Raummeter (RM)"],
  ["fm", "Festmeter (FM)"],
  ["l", "Liter (l)"],
  ["stk", "Stück"],
];

const BASE_PRICE_UNITS: BasePriceUnit[] = ["t", "100kg", "kg", "srm", "rm", "fm", "l", "stk"];

/**
 * Verkaufsmenge and Grundpreis, with the resulting €/t shown as it is typed.
 *
 * The preview is the point of the component: a pallet price entered against a
 * "15 kg" quantity reads as 33.312,00 € / t straight away, which is how a
 * mislabelled import gets caught before it reaches the storefront.
 */
export function GrundpreisFields({
  priceCents,
  quantityAmount,
  quantityUnit,
  basePriceUnit,
}: {
  priceCents: number | null;
  quantityAmount: number | null;
  quantityUnit: QuantityUnit | null;
  basePriceUnit: BasePriceUnit | null;
}) {
  const [price, setPrice] = useState(priceCents == null ? "" : String(priceCents));
  const [amount, setAmount] = useState(quantityAmount == null ? "" : String(quantityAmount));
  const [unit, setUnit] = useState<string>(quantityUnit ?? "");
  const [baseUnit, setBaseUnit] = useState<string>(basePriceUnit ?? "t");

  const parsedAmount = Number(amount.replace(",", "."));
  const basePrice = computeBasePriceCents(
    Number(price),
    Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : null,
    (unit || null) as QuantityUnit | null,
    (baseUnit || null) as BasePriceUnit | null,
  );

  return (
    <>
      <Field label="Preis in Cent" hint="Leer lassen für Angebot auf Anfrage">
        <input
          name="price_cents_public"
          type="number"
          min="0"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className={fieldClass}
        />
      </Field>

      <Field label="Verkaufsmenge" hint="Menge, die dieser Preis abdeckt — z. B. 990 für eine Palette Sackware">
        <input
          name="quantity_amount"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className={fieldClass}
        />
      </Field>

      <Field label="Mengeneinheit">
        <select
          name="quantity_unit"
          value={unit}
          onChange={(event) => setUnit(event.target.value)}
          className={fieldClass}
        >
          <option value="">Keine Angabe</option>
          {QUANTITY_UNITS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Grundpreis je"
        hint="§ 4 PAngV: Pflichtangabe bei Verkauf nach Gewicht. Bei Brennstoffen üblich: je Tonne."
      >
        <select
          name="base_price_unit"
          value={baseUnit}
          onChange={(event) => setBaseUnit(event.target.value)}
          className={fieldClass}
        >
          {BASE_PRICE_UNITS.map((value) => (
            <option key={value} value={value}>
              {BASE_PRICE_UNIT_LABEL[value]}
            </option>
          ))}
        </select>
      </Field>

      <p className="text-muted md:col-span-2 text-sm" aria-live="polite">
        {basePrice != null ? (
          <>
            Grundpreis:{" "}
            <strong className="text-text font-mono tabular-nums">
              {formatBasePrice(basePrice, BASE_PRICE_UNIT_LABEL[baseUnit as BasePriceUnit])}
            </strong>{" "}
            <span className="text-xs">
              ({formatPrice(Number(price))} für {amount} {unit})
            </span>
          </>
        ) : (
          "Grundpreis wird berechnet, sobald Preis, Menge und eine passende Einheit gesetzt sind. Volumeneinheiten lassen sich nicht ineinander umrechnen."
        )}
      </p>
    </>
  );
}

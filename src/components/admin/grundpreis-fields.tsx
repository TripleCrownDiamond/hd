"use client";

import { useState } from "react";
import { Field, fieldClass } from "@/components/admin/admin-ui";
import {
  BASE_PRICE_UNIT_LABEL,
  centsToEuroInput,
  computeBasePriceCents,
  formatBasePrice,
  formatPrice,
  type BasePriceUnit,
  type QuantityUnit,
} from "@/lib/utils";

const QUANTITY_UNITS: Array<[QuantityUnit, string]> = [
  ["kg", "Kilogramme (kg)"],
  ["t", "Tonne (t)"],
  ["srm", "Mètre cube vrac (SRM)"],
  ["rm", "Stère (RM)"],
  ["fm", "Mètre cube plein (FM)"],
  ["l", "Litre (l)"],
  ["stk", "Pièce"],
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
  const [price, setPrice] = useState(centsToEuroInput(priceCents));
  const [amount, setAmount] = useState(quantityAmount == null ? "" : String(quantityAmount));
  const [unit, setUnit] = useState<string>(quantityUnit ?? "");
  const [baseUnit, setBaseUnit] = useState<string>(basePriceUnit ?? "t");

  const parsedAmount = Number(amount.replace(",", "."));
  // The field holds euros; everything downstream reasons in cents. Parsed
  // leniently here because this only feeds the live preview — `parseEuroInput`
  // on the server is what actually validates the submission.
  const parsedEuros = Number(price.replace(/\s/g, "").replace(",", "."));
  const priceInCents = Number.isFinite(parsedEuros) ? Math.round(parsedEuros * 100) : 0;
  const basePrice = computeBasePriceCents(
    priceInCents,
    Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : null,
    (unit || null) as QuantityUnit | null,
    (baseUnit || null) as BasePriceUnit | null,
  );

  return (
    <>
      <Field label="Prix de vente (€)" hint="TTC, par ex. 799,95 — laisser vide pour un devis sur demande">
        <input
          name="price_public_euros"
          inputMode="decimal"
          placeholder="799,95"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className={fieldClass}
        />
      </Field>

      <Field label="Quantité de vente" hint="Quantité couverte par ce prix — ex. 990 pour une palette en sacs">
        <input
          name="quantity_amount"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className={fieldClass}
        />
      </Field>

      <Field label="Unité de quantité">
        <select
          name="quantity_unit"
          value={unit}
          onChange={(event) => setUnit(event.target.value)}
          className={fieldClass}
        >
          <option value="">Non précisée</option>
          {QUANTITY_UNITS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Prix de base par"
        hint="§ 4 PAngV : mention obligatoire pour la vente au poids. Habituel pour les combustibles : par tonne."
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
            Prix de base :{" "}
            <strong className="text-text font-mono tabular-nums">
              {formatBasePrice(basePrice, BASE_PRICE_UNIT_LABEL[baseUnit as BasePriceUnit])}
            </strong>{" "}
            <span className="text-xs">
              ({formatPrice(priceInCents)} pour {amount} {unit})
            </span>
          </>
        ) : (
          "Le prix de base sera calculé dès que le prix, la quantité et une unité adaptée seront renseignés. Les unités de volume ne peuvent pas être converties entre elles."
        )}
      </p>
    </>
  );
}

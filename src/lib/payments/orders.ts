import "server-only";

import { z } from "zod";
import { getMigrationAwareServiceSupabase } from "@/lib/db/server";
import { lookupPostcode } from "@/lib/shipping/postcodes";
import { zoneForPostcode } from "@/lib/shipping/zones";
import { countryLabel, isEuropeanCountry } from "@/lib/shipping/countries";
import { quoteShipping, type ShippingClass } from "@/lib/shipping/rates";
import { readPaymentSettings } from "./server";
import {
  isPlaceholderBankData,
  paymentReference,
  toPaymentOptions,
  PAYMENT_LABEL,
  type PaymentMethod,
} from "./config";
import { notifyOrderPlaced } from "@/lib/notifications/orders";
import { maybeIssueInvoice } from "@/lib/invoices/auto";
import { evaluatePromotion, PromotionError } from "@/lib/promotions/server";
import { createHash } from "node:crypto";

/**
 * Turn a validated cart into a persisted order.
 *
 * The price is never trusted from the browser: line prices, shipping and the
 * total are all recomputed server-side from the product rows and the delivery
 * postcode, so a tampered request cannot change what is charged. Guest checkout
 * writes with the service client because the public RLS role cannot insert an
 * order it does not yet own.
 */

const lineSchema = z.object({
  productId: z.string().uuid().nullable().optional(),
  slug: z.string().min(1),
  name: z.string().min(1),
  variant: z.string().optional(),
  quantity: z.number().int().positive().max(999),
  kind: z.string().min(1),
});

const addressSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  street: z.string().trim().min(3).max(120),
  houseNumber: z.string().trim().min(1).max(20),
  postcode: z.string().trim().min(3).max(10).regex(/^[A-Za-z0-9 -]+$/),
  city: z.string().trim().min(2).max(120),
  country: z.string().trim().length(2).regex(/^[A-Z]{2}$/),
  email: z.string().trim().email(),
  phone: z.string().trim().min(5).max(40),
});

export const placeOrderSchema = z.object({
  items: z.array(lineSchema).min(1),
  address: addressSchema,
  paymentMethod: z.enum(["bank_transfer", "crypto", "card", "deposit"]),
  promotionCode: z.string().trim().max(64).nullable().optional(),
  cartSessionToken: z.string().min(24).max(200).nullable().optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export interface PlacedOrder {
  orderNumber: string;
  totalCents: number;
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  paymentMethod: PaymentMethod;
  paymentReference: string | null;
  /** Deposit amounts, null when the order is not paid by Anzahlung. */
  depositCents: number | null;
  remainingCents: number | null;
  depositPercent: number | null;
}

/** `HK-2026-000123`: sortable, human-readable, unique per row. */
function orderNumber(sequence: number): string {
  const year = new Date().getFullYear();
  return `${year}-${String(sequence).padStart(6, "0")}`;
}

interface PricedLine {
  productId: string | null;
  slug: string;
  name: string;
  variant: string | null;
  quantity: number;
  unitPriceCents: number;
  kind: string;
  categoryId: string | null;
}

/**
 * Re-price every line against the database, dropping anything unpurchasable.
 *
 * A product only contributes its server-side price, and only when it is
 * approved and public; the number the browser sent is ignored entirely.
 */
async function repriceLines(
  input: PlaceOrderInput["items"],
): Promise<{ lines: PricedLine[]; subtotalCents: number }> {
  const supabase = getMigrationAwareServiceSupabase();
  const slugs = [...new Set(input.map((item) => item.slug))];
  const { data, error } = await supabase
    .from("products")
    .select("id,slug,kind,model,category_id,price_cents_public,review_status,is_published")
    .in("slug", slugs);
  if (error) throw new OrderError("Produkte konnten nicht geladen werden.", 500);

  const bySlug = new Map((data ?? []).map((row) => [row.slug as string, row]));
  const lines: PricedLine[] = [];
  let subtotalCents = 0;

  for (const item of input) {
    const product = bySlug.get(item.slug);
    if (
      !product ||
      product.review_status !== "approved" ||
      product.is_published !== true ||
      !product.price_cents_public ||
      product.price_cents_public <= 0
    ) {
      throw new OrderError(`"${item.name}" ist nicht mehr bestellbar.`, 409);
    }
    const unitPriceCents = product.price_cents_public as number;
    subtotalCents += unitPriceCents * item.quantity;
    lines.push({
      productId: product.id as string,
      slug: item.slug,
      name: product.model as string,
      variant: item.variant ?? null,
      quantity: item.quantity,
      unitPriceCents,
      kind: product.kind as string,
      categoryId: product.category_id as string | null,
    });
  }

  return { lines, subtotalCents };
}

export class OrderError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "OrderError";
  }
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlacedOrder> {
  // The method has to be one the shop actually offers right now, checked against
  // live config rather than trusted from the request.
  const settings = await readPaymentSettings();
  const options = toPaymentOptions(settings);
  if (!options.some((option) => option.method === input.paymentMethod)) {
    throw new OrderError("Diese Zahlungsart ist nicht verfügbar.", 409);
  }

  // The shop delivers across Europe; only the configured country set is
  // accepted, and a German address still needs a 5-digit postcode.
  if (!isEuropeanCountry(input.address.country)) {
    throw new OrderError("Dieses Land wird nicht beliefert.", 409);
  }
  if (input.address.country === "DE" && !/^\d{5}$/.test(input.address.postcode)) {
    throw new OrderError("Ungültige deutsche Postleitzahl.", 409);
  }

  // The postcode directory is advisory, not a gate: a postcode it does not
  // know (foreign or very new) still ships at the standard tariff and keeps
  // the city the customer typed.
  const place = input.address.country === "DE" ? lookupPostcode(input.address.postcode) : null;

  const { lines, subtotalCents } = await repriceLines(input.items);
  const zone = input.address.country === "DE" ? zoneForPostcode(input.address.postcode) : "mainland";
  let promotion;
  try {
    promotion = await evaluatePromotion(input.promotionCode, lines.map((line) => ({
      productId: line.productId!, categoryId: line.categoryId, quantity: line.quantity, unitPriceCents: line.unitPriceCents,
    })));
  } catch (error) {
    if (error instanceof PromotionError) throw new OrderError(error.message, error.status);
    throw error;
  }
  const payableSubtotalCents = subtotalCents - promotion.discountCents;
  const shipping = quoteShipping({
    // Delivery thresholds are based on the merchandise value before promotional
    // discounts, so a valid code cannot unexpectedly remove free delivery.
    subtotalCents,
    kinds: lines.map((line) => line.kind as ShippingClass),
    zone,
  });
  const totalCents = payableSubtotalCents + shipping.totalCents;
  // Prices already include 19 % VAT, so the tax is the fraction inside the gross.
  const taxCents = Math.round(totalCents * (0.19 / 1.19));

  // Deposit: the customer pays a percentage up front by transfer and the rest
  // later. The option only exists when the bank account is real, and both the
  // threshold and the percentage are enforced here again — never trusted from
  // the browser.
  let deposit: { percent: number; amountCents: number; remainingCents: number } | null = null;
  if (input.paymentMethod === "deposit") {
    if (!settings?.deposit_enabled) {
      throw new OrderError("Die Anzahlung ist nicht verfügbar.", 409);
    }
    if (totalCents < (settings.deposit_min_cents ?? 0)) {
      throw new OrderError("Für diese Bestellsumme ist keine Anzahlung möglich.", 409);
    }
    const percent = settings.deposit_percent ?? 30;
    const amountCents = Math.round((totalCents * percent) / 100);
    if (amountCents <= 0) throw new OrderError("Anzahlungsbetrag ungültig.", 409);
    deposit = { percent, amountCents, remainingCents: totalCents - amountCents };
  }

  const supabase = getMigrationAwareServiceSupabase();

  // A gapless sequence would need a counter table; the row count is enough for
  // a readable, unique number and never collides because order_number is unique.
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true });
  const number = orderNumber((count ?? 0) + 1);

  const address = {
    first_name: input.address.firstName,
    last_name: input.address.lastName,
    street: input.address.street,
    house_number: input.address.houseNumber,
    postcode: input.address.postcode,
    city: place?.city ?? input.address.city,
    state: place?.state ?? null,
    country_code: input.address.country,
    country_name: countryLabel(input.address.country),
    email: input.address.email,
    phone: input.address.phone,
  };

  const byTransfer = input.paymentMethod === "bank_transfer" || input.paymentMethod === "deposit";
  const reference = byTransfer
    ? paymentReference(settings?.bank_reference_prefix ?? null, number)
    : null;

  // Only a real account goes into the confirmation e-mail: the seeded
  // placeholder must never be mailed to a customer (the e-mail then says the
  // details follow separately).
  const bankForEmail =
    byTransfer && settings?.bank_iban && settings?.bank_account_holder
      ? {
          accountHolder: settings.bank_account_holder,
          iban: settings.bank_iban,
          bic: settings.bank_bic,
        }
      : null;
  const mailBank =
    bankForEmail &&
    !isPlaceholderBankData({
      method: "bank_transfer",
      accountHolder: bankForEmail.accountHolder,
      iban: bankForEmail.iban,
      bic: bankForEmail.bic,
      bankName: settings?.bank_name ?? null,
    })
      ? bankForEmail
      : null;

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      order_number: number,
      customer_email: input.address.email,
      customer_name: `${input.address.firstName} ${input.address.lastName}`,
      status: "pending_payment",
      payment_status: "unpaid",
      payment_method: input.paymentMethod,
      payment_reference: reference,
      deposit_cents: deposit?.amountCents ?? 0,
      subtotal_cents: subtotalCents,
      discount_cents: promotion.discountCents,
      promotion_code: promotion.code,
      shipping_cents: shipping.totalCents,
      tax_cents: taxCents,
      total_cents: totalCents,
      billing_address: address,
      shipping_address: address,
    })
    .select("id")
    .single();
  if (error || !order) throw new OrderError("Bestellung konnte nicht angelegt werden.", 500);

  const { error: itemsError } = await supabase.from("order_items").insert(
    lines.map((line, index) => ({
      order_id: order.id,
      product_id: line.productId,
      name_snapshot: line.name,
      variant_snapshot: line.variant,
      quantity: line.quantity,
      unit_price_cents: line.unitPriceCents,
      discount_cents: (promotion.lineDiscounts[index] ?? 0),
      line_total_cents: line.unitPriceCents * line.quantity - (promotion.lineDiscounts[index] ?? 0),
      tax_rate: 19,
      product_snapshot: { slug: line.slug, kind: line.kind },
    })),
  );
  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    throw new OrderError("Bestellpositionen konnten nicht gespeichert werden.", 500);
  }

  if (promotion.promotionId) {
    const { error: redeemError } = await supabase.rpc("redeem_promotion", {
      p_promotion_id: promotion.promotionId,
      p_order_id: order.id,
      p_customer_email: input.address.email,
      p_discount_cents: promotion.discountCents,
    });
    if (redeemError) {
      // The usage limit can be exhausted between quote and checkout. Remove the
      // not-yet-confirmed aggregate so no discounted orphan order survives.
      await supabase.from("order_items").delete().eq("order_id", order.id);
      await supabase.from("orders").delete().eq("id", order.id);
      throw new OrderError("Der Rabattcode konnte nicht eingelöst werden.", 409);
    }
  }

  await supabase.from("order_events").insert({
    order_id: order.id,
    event_type: "order.placed",
    to_status: "pending_payment",
    metadata: { payment_method: input.paymentMethod, zone },
  });

  // Notifications never block the order: if a channel is down or unconfigured,
  // the order still stands and the customer still gets their confirmation page.
  await notifyOrderPlaced(
    {
      orderNumber: number,
      customerName: `${input.address.firstName} ${input.address.lastName}`,
      lines: lines.map((line, index) => ({
        name: line.name,
        quantity: line.quantity,
        lineTotalCents: line.unitPriceCents * line.quantity - (promotion.lineDiscounts[index] ?? 0),
      })),
      subtotalCents,
      shippingCents: shipping.totalCents,
      totalCents,
      paymentLabel: PAYMENT_LABEL[input.paymentMethod],
      paymentReference: reference,
      bank: mailBank,
      deposit: deposit
        ? { percent: deposit.percent, amountCents: deposit.amountCents, remainingCents: deposit.remainingCents }
        : null,
      address: {
        street: input.address.street,
        houseNumber: input.address.houseNumber,
        postcode: input.address.postcode,
        city: place?.city ?? input.address.city,
        country: countryLabel(input.address.country),
      },
    },
    input.address.email,
  );

  // Honours site_settings.invoice_trigger = "order". Never throws: a missing
  // company address must not undo an order that is already recorded.
  await maybeIssueInvoice(order.id, "order");

  if (input.cartSessionToken) {
    const sessionHash = createHash("sha256").update(input.cartSessionToken).digest("hex");
    await supabase.from("abandoned_carts").update({ status: "converted", converted_order_id: order.id, updated_at: new Date().toISOString() }).eq("session_hash", sessionHash).eq("status", "active");
  }

  return {
    orderNumber: number,
    totalCents,
    subtotalCents,
    shippingCents: shipping.totalCents,
    discountCents: promotion.discountCents,
    paymentMethod: input.paymentMethod,
    paymentReference: reference,
    depositCents: deposit?.amountCents ?? null,
    remainingCents: deposit?.remainingCents ?? null,
    depositPercent: deposit?.percent ?? null,
  };
}

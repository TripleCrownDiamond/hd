"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdminAccess, auditAdminAction } from "@/lib/auth/admin";
import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { issueInvoiceForOrder } from "@/lib/invoices/issue";
import { invalidateCatalogCache } from "@/lib/products/catalog";
import { notifyStatusChange } from "@/lib/notifications/orders";
import {
  NOTIFY_ON,
  STATUS_LABEL,
  STATUS_MESSAGE,
  trackingUrl,
  type OrderStatus,
} from "@/lib/orders/status";

const optionalText = z.string().trim().transform((value) => value || null);
const idSchema = z.string().uuid();

const productSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/),
  model: z.string().trim().min(2).max(200),
  kind: z.enum(["stove", "wood", "log", "pellet", "briquette", "kindling", "coal", "accessory"]),
  subtitle: optionalText,
  short_description: optionalText,
  price_cents_public: z.coerce.number().int().nonnegative().nullable(),
  // What the price buys, and the unit its Grundpreis is quoted in.
  quantity_amount: z.coerce.number().positive().nullable(),
  quantity_unit: z.enum(["kg", "t", "srm", "rm", "fm", "l", "stk"]).nullable(),
  base_price_unit: z.enum(["kg", "100kg", "t", "srm", "rm", "fm", "l", "stk"]).nullable(),
  review_status: z.enum(["pending", "approved", "rejected", "superseded"]),
  is_published: z.boolean(),
});

export async function saveProduct(formData: FormData) {
  const actor = await requireAdminAccess(["admin", "content_editor"]);
  const priceRaw = String(formData.get("price_cents_public") ?? "").trim();
  // A German decimal comma is what an admin types into a quantity field.
  const quantityRaw = String(formData.get("quantity_amount") ?? "").trim().replace(",", ".");
  const input = productSchema.parse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"), model: formData.get("model"), kind: formData.get("kind"),
    subtitle: formData.get("subtitle"), short_description: formData.get("short_description"),
    price_cents_public: priceRaw ? Number(priceRaw) : null,
    quantity_amount: quantityRaw ? Number(quantityRaw) : null,
    quantity_unit: formData.get("quantity_unit") || null,
    base_price_unit: formData.get("base_price_unit") || null,
    review_status: formData.get("review_status"), is_published: formData.get("is_published") === "on",
  });
  const { id, ...values } = input;
  // A quantity without its unit yields no Grundpreis, so store neither: a
  // half-filled pair would read as "configured" in the admin list.
  const hasQuantity = values.quantity_amount != null && values.quantity_unit != null;
  const safeValues = {
    ...values,
    quantity_amount: hasQuantity ? values.quantity_amount : null,
    quantity_unit: hasQuantity ? values.quantity_unit : null,
    base_price_unit: hasQuantity ? values.base_price_unit : null,
    is_published: values.is_published && values.review_status === "approved",
    quote_mode: values.price_cents_public == null,
  };
  const supabase = await getMigrationAwareServerSupabase();
  const query = id
    ? supabase.from("products").update(safeValues).eq("id", id).select("id").single()
    : supabase.from("products").insert(safeValues).select("id").single();
  const { data, error } = await query;
  if (error) throw new Error("Produkt konnte nicht gespeichert werden.");
  await auditAdminAction({ ...actor, actorId: actor.userId, action: id ? "product.update" : "product.create", entity: "product", entityId: data.id });
  invalidateCatalogCache(); revalidateTag("catalog"); revalidatePath("/admin/produkte");
}

export async function archiveProduct(formData: FormData) {
  const actor = await requireAdminAccess(["admin", "content_editor"]);
  const id = idSchema.parse(formData.get("id"));
  const supabase = await getMigrationAwareServerSupabase();
  const { error } = await supabase.from("products").update({ is_published: false, review_status: "superseded" }).eq("id", id);
  if (error) throw new Error("Produkt konnte nicht archiviert werden.");
  await auditAdminAction({ ...actor, actorId: actor.userId, action: "product.archive", entity: "product", entityId: id });
  invalidateCatalogCache(); revalidateTag("catalog"); revalidatePath("/admin/produkte");
}

export async function updateOrder(formData: FormData) {
  const actor = await requireAdminAccess(["admin", "support"]);
  const id = idSchema.parse(formData.get("id"));
  const status = z.enum(["draft","pending_payment","paid","confirmed","processing","shipped","delivered","cancelled","refunded"]).parse(formData.get("status"));
  const notes = optionalText.parse(String(formData.get("internal_notes") ?? ""));
  const carrier = optionalText.parse(String(formData.get("tracking_carrier") ?? ""));
  const trackingNumber = optionalText.parse(String(formData.get("tracking_number") ?? ""));

  const supabase = await getMigrationAwareServerSupabase();
  // Read the current row first: the previous status decides whether the
  // customer is notified, and the customer's contact data drives the email.
  const { data: before } = await supabase
    .from("orders")
    .select("status,customer_email,customer_name,order_number")
    .eq("id", id)
    .single();

  const url = trackingUrl(carrier, trackingNumber);
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status,
    internal_notes: notes,
    tracking_carrier: carrier,
    tracking_number: trackingNumber,
    tracking_url: url,
  };
  // Timestamp the two milestones the customer cares about, once.
  if (status === "shipped") patch.shipped_at = now;
  if (status === "delivered") patch.delivered_at = now;

  const { error } = await supabase.from("orders").update(patch).eq("id", id);
  if (error) throw new Error("Bestellung konnte nicht aktualisiert werden.");

  await supabase.from("order_events").insert({
    order_id: id,
    event_type: "order.status_changed",
    from_status: before?.status ?? null,
    to_status: status,
    actor_id: actor.userId,
    metadata: carrier && trackingNumber ? { carrier, tracking_number: trackingNumber } : {},
  });

  await auditAdminAction({ ...actor, actorId: actor.userId, action: "order.update", entity: "order", entityId: id, metadata: { status } });

  // Notify the customer only when the status actually changed to one worth an
  // email — never on a no-op save or an internal-only status.
  if (before && before.status !== status && NOTIFY_ON.has(status as OrderStatus)) {
    await notifyStatusChange(
      {
        orderNumber: before.order_number,
        customerName: before.customer_name,
        statusLabel: STATUS_LABEL[status as OrderStatus],
        message: STATUS_MESSAGE[status as OrderStatus],
        tracking: carrier && trackingNumber ? { carrier, number: trackingNumber, url } : null,
      },
      before.customer_email,
    );
  }

  revalidatePath("/admin/bestellungen");
}

const contentSchema = z.object({
  id: z.string().uuid().optional(), slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(2), kind: z.enum(["page","article","legal"]),
  format: z.enum(["rich_text","markdown","html"]), body: z.string(),
  excerpt: optionalText, status: z.enum(["draft","review","published","archived"]),
  seo_title: optionalText, seo_description: optionalText,
});

export async function saveContent(formData: FormData) {
  const actor = await requireAdminAccess(["admin", "content_editor"]);
  const input = contentSchema.parse(Object.fromEntries(formData));
  const { id, ...values } = input;
  const payload = { ...values, author_id: actor.userId, published_at: values.status === "published" ? new Date().toISOString() : null };
  const supabase = await getMigrationAwareServerSupabase();
  const query = id ? supabase.from("content_entries").update(payload).eq("id", id).select("id").single() : supabase.from("content_entries").insert(payload).select("id").single();
  const { data, error } = await query;
  if (error) throw new Error("Inhalt konnte nicht gespeichert werden.");
  await auditAdminAction({ ...actor, actorId: actor.userId, action: id ? "content.update" : "content.create", entity: "content", entityId: data.id });
  revalidatePath("/admin/inhalte"); revalidatePath(`/${values.slug}`);
}

const reviewSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid().nullable().optional(),
  author_name: z.string().trim().min(2).max(80),
  location: optionalText,
  rating: z.coerce.number().int().min(1).max(5),
  title: optionalText,
  body: z.string().trim().min(5).max(2000),
  verified: z.boolean(),
  status: z.enum(["pending", "approved", "rejected"]),
  reviewed_on: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function saveReview(formData: FormData) {
  const actor = await requireAdminAccess(["admin", "content_editor"]);
  const input = reviewSchema.parse({
    id: formData.get("id") || undefined,
    product_id: (formData.get("product_id") as string) || null,
    author_name: formData.get("author_name"),
    location: formData.get("location"),
    rating: formData.get("rating"),
    title: formData.get("title"),
    body: formData.get("body"),
    verified: formData.get("verified") === "on",
    status: formData.get("status"),
    reviewed_on: formData.get("reviewed_on") || new Date().toISOString().slice(0, 10),
  });
  const { id, ...values } = input;
  const supabase = await getMigrationAwareServerSupabase();
  const query = id
    ? supabase.from("reviews").update(values).eq("id", id).select("id").single()
    : supabase.from("reviews").insert(values).select("id").single();
  const { data, error } = await query;
  if (error) throw new Error("Bewertung konnte nicht gespeichert werden.");
  await auditAdminAction({ ...actor, actorId: actor.userId, action: id ? "review.update" : "review.create", entity: "review", entityId: data.id });
  revalidatePath("/admin/bewertungen"); revalidatePath("/", "layout");
}

export async function deleteReview(formData: FormData) {
  const actor = await requireAdminAccess(["admin", "content_editor"]);
  const id = idSchema.parse(formData.get("id"));
  const supabase = await getMigrationAwareServerSupabase();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw new Error("Bewertung konnte nicht gelöscht werden.");
  await auditAdminAction({ ...actor, actorId: actor.userId, action: "review.delete", entity: "review", entityId: id });
  revalidatePath("/admin/bewertungen"); revalidatePath("/", "layout");
}

const settingsFields = ["company_name","legal_form","street","postal_code","city","country_code","phone","phone_secondary","email","support_email","vat_id","tax_number","commercial_register","register_court","managing_director","social_instagram","social_facebook","social_linkedin","social_youtube","logo_url","invoice_prefix","invoice_footer","chatbot_name","support_hours"] as const;

export async function saveSiteSettings(formData: FormData) {
  const actor = await requireAdminAccess(["admin"]);
  const values = Object.fromEntries(settingsFields.map((field) => [field, optionalText.parse(String(formData.get(field) ?? ""))]));
  const supabase = await getMigrationAwareServerSupabase();
  const { error } = await supabase.from("site_settings").update({ ...values,
    newsletter_enabled: formData.get("newsletter_enabled") === "on", chatbot_enabled: formData.get("chatbot_enabled") === "on", cart_recovery_enabled: formData.get("cart_recovery_enabled") === "on",
    invoice_payment_terms_days: z.coerce.number().int().min(0).max(365).parse(formData.get("invoice_payment_terms_days")), invoice_trigger: z.enum(["manual","order","payment","shipment"]).parse(formData.get("invoice_trigger")),
    cart_recovery_first_delay_minutes: z.coerce.number().int().min(30).max(10080).parse(formData.get("cart_recovery_first_delay_minutes")), cart_recovery_second_delay_minutes: z.coerce.number().int().min(60).max(20160).parse(formData.get("cart_recovery_second_delay_minutes")), cart_recovery_max_reminders: z.coerce.number().int().min(1).max(3).parse(formData.get("cart_recovery_max_reminders")),
    updated_by: actor.userId }).eq("id", 1);
  if (error) throw new Error("Einstellungen konnten nicht gespeichert werden.");
  await auditAdminAction({ ...actor, actorId: actor.userId, action: "settings.update", entity: "site_settings", entityId: "1" });
  revalidatePath("/", "layout"); revalidatePath("/admin/einstellungen");
}

const paymentTextFields = [
  "bank_account_holder", "bank_iban", "bank_bic", "bank_name", "bank_reference_prefix",
  "crypto_provider", "crypto_provider_url", "crypto_note",
  "card_provider", "card_publishable_key", "card_note",
] as const;

/** An IBAN is validated only for shape here; the bank confirms the rest. */
const ibanShape = z
  .string()
  .trim()
  .transform((value) => value.replace(/\s+/g, "").toUpperCase())
  .refine((value) => value === "" || /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(value), {
    message: "IBAN ungültig.",
  });

export async function savePaymentSettings(formData: FormData) {
  const actor = await requireAdminAccess(["admin"]);

  const text = Object.fromEntries(
    paymentTextFields.map((field) => [field, optionalText.parse(String(formData.get(field) ?? ""))]),
  );
  const iban = ibanShape.parse(String(formData.get("bank_iban") ?? "")) || null;
  const currencies = formData
    .getAll("crypto_currencies")
    .map((value) => String(value))
    .filter(Boolean);

  const bankEnabled = formData.get("bank_transfer_enabled") === "on";
  const cryptoEnabled = formData.get("crypto_enabled") === "on";
  const cardEnabled = formData.get("card_enabled") === "on";

  // A method cannot be switched on without what it needs to take a payment,
  // otherwise the checkout would offer a dead end.
  if (bankEnabled && (!iban || !text.bank_account_holder)) {
    throw new Error("Für Überweisung sind IBAN und Kontoinhaber erforderlich.");
  }
  if (cardEnabled && (!text.card_provider || !text.card_publishable_key)) {
    throw new Error("Für Kartenzahlung sind Anbieter und Publishable Key erforderlich.");
  }
  if (cryptoEnabled && (!text.crypto_provider || currencies.length === 0)) {
    throw new Error("Für Krypto sind Anbieter und mindestens eine Währung erforderlich.");
  }

  const supabase = await getMigrationAwareServerSupabase();
  const { error } = await supabase
    .from("payment_settings")
    .update({
      ...text,
      bank_iban: iban,
      crypto_currencies: currencies,
      bank_transfer_enabled: bankEnabled,
      crypto_enabled: cryptoEnabled,
      card_enabled: cardEnabled,
      updated_by: actor.userId,
    })
    .eq("id", 1);
  if (error) throw new Error("Zahlungseinstellungen konnten nicht gespeichert werden.");

  await auditAdminAction({ ...actor, actorId: actor.userId, action: "payment_settings.update", entity: "payment_settings", entityId: "1" });
  revalidatePath("/admin/zahlungen"); revalidatePath("/kasse");
}

const promotionSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(2).max(64).regex(/^[A-Za-z0-9_-]+$/).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(120),
  description: optionalText,
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.coerce.number().positive(),
  scope: z.enum(["all", "products", "categories"]),
  minimum_subtotal_cents: z.coerce.number().int().nonnegative(),
  maximum_discount_cents: z.coerce.number().int().positive().nullable(),
  usage_limit: z.coerce.number().int().positive().nullable(),
  starts_at: optionalText,
  ends_at: optionalText,
  is_active: z.boolean(),
});

export async function savePromotion(formData: FormData) {
  const actor = await requireAdminAccess(["admin"]);
  const nullableNumber = (name: string) => String(formData.get(name) ?? "").trim() || null;
  const input = promotionSchema.parse({
    id: formData.get("id") || undefined,
    code: formData.get("code"), name: formData.get("name"), description: formData.get("description"),
    discount_type: formData.get("discount_type"), discount_value: formData.get("discount_value"),
    scope: formData.get("scope"), minimum_subtotal_cents: formData.get("minimum_subtotal_cents") || 0,
    maximum_discount_cents: nullableNumber("maximum_discount_cents"), usage_limit: nullableNumber("usage_limit"),
    starts_at: formData.get("starts_at"), ends_at: formData.get("ends_at"), is_active: formData.get("is_active") === "on",
  });
  const storedValue = input.discount_type === "percentage" ? Math.round(input.discount_value * 100) : Math.round(input.discount_value);
  if (input.discount_type === "percentage" && storedValue > 10_000) throw new Error("Der prozentuale Rabatt darf 100 % nicht überschreiten.");
  const { id, ...rest } = input;
  const supabase = await getMigrationAwareServerSupabase();
  const payload = { ...rest, discount_value: storedValue, created_by: actor.userId };
  const query = id ? supabase.from("promotions").update(payload).eq("id", id).select("id").single() : supabase.from("promotions").insert(payload).select("id").single();
  const { data, error } = await query;
  if (error || !data) throw new Error("Rabatt konnte nicht gespeichert werden.");
  const promotionId = data.id as string;
  await Promise.all([
    supabase.from("promotion_products").delete().eq("promotion_id", promotionId),
    supabase.from("promotion_categories").delete().eq("promotion_id", promotionId),
  ]);
  if (input.scope === "products") {
    const ids = formData.getAll("product_ids").map(String);
    if (!ids.length) throw new Error("Mindestens ein Produkt auswählen.");
    const { error: linkError } = await supabase.from("promotion_products").insert(ids.map((product_id) => ({ promotion_id: promotionId, product_id })));
    if (linkError) throw new Error("Produktauswahl konnte nicht gespeichert werden.");
  }
  if (input.scope === "categories") {
    const ids = formData.getAll("category_ids").map(String);
    if (!ids.length) throw new Error("Mindestens eine Kategorie auswählen.");
    const { error: linkError } = await supabase.from("promotion_categories").insert(ids.map((category_id) => ({ promotion_id: promotionId, category_id })));
    if (linkError) throw new Error("Kategorieauswahl konnte nicht gespeichert werden.");
  }
  await auditAdminAction({ ...actor, actorId: actor.userId, action: id ? "promotion.update" : "promotion.create", entity: "promotion", entityId: promotionId });
  revalidatePath("/admin/rabatte"); revalidatePath("/kasse");
}

export async function archivePromotion(formData: FormData) {
  const actor = await requireAdminAccess(["admin"]);
  const id = idSchema.parse(formData.get("id"));
  const supabase = await getMigrationAwareServerSupabase();
  const { error } = await supabase.from("promotions").update({ is_active: false }).eq("id", id);
  if (error) throw new Error("Rabatt konnte nicht deaktiviert werden.");
  await auditAdminAction({ ...actor, actorId: actor.userId, action: "promotion.archive", entity: "promotion", entityId: id });
  revalidatePath("/admin/rabatte"); revalidatePath("/kasse");
}

const faqSchema = z.object({
  id: z.string().uuid().optional(), question: z.string().trim().min(5).max(300),
  answer: z.string().trim().min(5).max(8000), category: z.string().trim().min(2).max(80),
  product_id: z.string().uuid().nullable(), position: z.coerce.number().int().min(0).max(9999),
  status: z.enum(["draft", "published", "archived"]),
});

export async function saveFaq(formData: FormData) {
  const actor = await requireAdminAccess(["admin", "content_editor"]);
  const input = faqSchema.parse({ id: formData.get("id") || undefined, question: formData.get("question"), answer: formData.get("answer"), category: formData.get("category"), product_id: formData.get("product_id") || null, position: formData.get("position") || 0, status: formData.get("status") });
  const { id, ...values } = input; const supabase = await getMigrationAwareServerSupabase();
  const query = id ? supabase.from("faq_entries").update({ ...values, updated_by: actor.userId }).eq("id", id).select("id").single() : supabase.from("faq_entries").insert({ ...values, updated_by: actor.userId }).select("id").single();
  const { data, error } = await query; if (error || !data) throw new Error("FAQ-Eintrag konnte nicht gespeichert werden.");
  await auditAdminAction({ ...actor, actorId: actor.userId, action: id ? "faq.update" : "faq.create", entity: "faq", entityId: data.id });
  revalidatePath("/faq"); revalidatePath("/admin/faq");
}

export async function archiveFaq(formData: FormData) {
  const actor = await requireAdminAccess(["admin", "content_editor"]); const id = idSchema.parse(formData.get("id"));
  const supabase = await getMigrationAwareServerSupabase(); const { error } = await supabase.from("faq_entries").update({ status: "archived", updated_by: actor.userId }).eq("id", id);
  if (error) throw new Error("FAQ-Eintrag konnte nicht archiviert werden.");
  await auditAdminAction({ ...actor, actorId: actor.userId, action: "faq.archive", entity: "faq", entityId: id }); revalidatePath("/faq"); revalidatePath("/admin/faq");
}

export async function issueInvoice(formData: FormData) {
  const actor = await requireAdminAccess(["admin"]); const orderId = idSchema.parse(formData.get("order_id"));
  const invoice = await issueInvoiceForOrder(orderId); await auditAdminAction({ ...actor, actorId: actor.userId, action: "invoice.issue", entity: "invoice", entityId: invoice.id, metadata: { order_id: orderId, invoice_number: invoice.invoiceNumber } }); revalidatePath("/admin/rechnungen");
}

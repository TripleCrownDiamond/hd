"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdminAccess, auditAdminAction } from "@/lib/auth/admin";
import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { maybeIssueInvoice } from "@/lib/invoices/auto";
import { issueInvoiceForOrder, issueStandaloneInvoice } from "@/lib/invoices/issue";
import { invalidateShortcodeCache } from "@/lib/content/shortcodes";
import { LEGAL_DEFAULTS } from "@/lib/legal/defaults";
import { invalidateCatalogCache } from "@/lib/products/catalog";
import { adminInbox, sendEmail, verifyEmailTransport } from "@/lib/notifications/email";
import { notifyStatusChange } from "@/lib/notifications/orders";
import { BRAND_NAME } from "@/lib/brand";
import {
  NOTIFY_ON,
  STATUS_LABEL,
  STATUS_MESSAGE,
  trackingUrl,
  type OrderStatus,
} from "@/lib/orders/status";
import {
  PLACEHOLDER_ACCOUNT_HOLDER,
  PLACEHOLDER_IBAN,
} from "@/lib/payments/config";

const optionalText = z.string().trim().transform((value) => value || null);
const idSchema = z.string().uuid();

const productSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/),
  model: z.string().trim().min(2).max(200),
  kind: z.enum(["stove", "wood", "log", "pellet", "briquette", "kindling", "coal", "accessory"]),
  subtitle: optionalText,
  short_description: optionalText,
  long_description: optionalText,
  price_cents_public: z.coerce.number().int().nonnegative().nullable(),
  quantity_amount: z.coerce.number().positive().nullable(),
  quantity_unit: z.enum(["kg", "t", "srm", "rm", "fm", "l", "stk"]).nullable(),
  base_price_unit: z.enum(["kg", "100kg", "t", "srm", "rm", "fm", "l", "stk"]).nullable(),
  review_status: z.enum(["pending", "approved", "rejected", "superseded"]),
  is_published: z.boolean(),
  // Stove-specific technical fields.
  power_kw_nominal: z.coerce.number().positive().nullable().optional(),
  efficiency_pct: z.coerce.number().min(0).max(100).nullable().optional(),
  energy_class: optionalText,
  fuel: optionalText,
  flue_diameter_mm: z.coerce.number().positive().nullable().optional(),
  height_mm: z.coerce.number().positive().nullable().optional(),
  width_mm: z.coerce.number().positive().nullable().optional(),
  depth_mm: z.coerce.number().positive().nullable().optional(),
  weight_kg: z.coerce.number().positive().nullable().optional(),
});

export async function saveProduct(formData: FormData) {
  const actor = await requireAdminAccess(["admin", "content_editor"]);
  const priceRaw = String(formData.get("price_cents_public") ?? "").trim();
  // A German decimal comma is what an admin types into a quantity field.
  const quantityRaw = String(formData.get("quantity_amount") ?? "").trim().replace(",", ".");
  const numOrNull = (name: string) => {
    const raw = String(formData.get(name) ?? "").trim().replace(",", ".");
    return raw ? Number(raw) : null;
  };
  const input = productSchema.parse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"), model: formData.get("model"), kind: formData.get("kind"),
    subtitle: formData.get("subtitle"), short_description: formData.get("short_description"),
    long_description: formData.get("long_description"),
    price_cents_public: priceRaw ? Number(priceRaw) : null,
    quantity_amount: quantityRaw ? Number(quantityRaw) : null,
    quantity_unit: formData.get("quantity_unit") || null,
    base_price_unit: formData.get("base_price_unit") || null,
    review_status: formData.get("review_status"), is_published: formData.get("is_published") === "on",
    power_kw_nominal: numOrNull("power_kw_nominal"),
    efficiency_pct: numOrNull("efficiency_pct"),
    energy_class: formData.get("energy_class"),
    fuel: formData.get("fuel"),
    flue_diameter_mm: numOrNull("flue_diameter_mm"),
    height_mm: numOrNull("height_mm"),
    width_mm: numOrNull("width_mm"),
    depth_mm: numOrNull("depth_mm"),
    weight_kg: numOrNull("weight_kg"),
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
    // Only set stove fields when the kind is stove; clear them otherwise.
    power_kw_nominal: values.kind === "stove" ? (values.power_kw_nominal ?? null) : null,
    efficiency_pct: values.kind === "stove" ? (values.efficiency_pct ?? null) : null,
    energy_class: values.kind === "stove" ? (values.energy_class ?? null) : null,
    fuel: values.kind === "stove" ? (values.fuel ?? null) : null,
    flue_diameter_mm: values.kind === "stove" ? (values.flue_diameter_mm ?? null) : null,
    height_mm: values.kind === "stove" ? (values.height_mm ?? null) : null,
    width_mm: values.kind === "stove" ? (values.width_mm ?? null) : null,
    depth_mm: values.kind === "stove" ? (values.depth_mm ?? null) : null,
    weight_kg: values.kind === "stove" ? (values.weight_kg ?? null) : null,
  };
  const supabase = await getMigrationAwareServerSupabase();
  const query = id
    ? supabase.from("products").update(safeValues).eq("id", id).select("id").single()
    : supabase.from("products").insert(safeValues).select("id").single();
  const { data, error } = await query;
  if (error || !data) throw new Error("Le produit n'a pas pu être enregistré.");
  await auditAdminAction({ ...actor, actorId: actor.userId, action: id ? "product.update" : "product.create", entity: "product", entityId: data.id });
  invalidateCatalogCache(); revalidateTag("catalog"); revalidatePath("/admin/produkte");
  if (id) revalidatePath(`/admin/produkte/${id}`);
}

export async function archiveProduct(formData: FormData) {
  const actor = await requireAdminAccess(["admin", "content_editor"]);
  const id = idSchema.parse(formData.get("id"));
  const supabase = await getMigrationAwareServerSupabase();
  const { error } = await supabase.from("products").update({ is_published: false, review_status: "superseded" }).eq("id", id);
  if (error) throw new Error("Le produit n'a pas pu être archivé.");
  await auditAdminAction({ ...actor, actorId: actor.userId, action: "product.archive", entity: "product", entityId: id });
  invalidateCatalogCache(); revalidateTag("catalog"); revalidatePath("/admin/produkte");
}

export async function deleteProduct(formData: FormData) {
  const actor = await requireAdminAccess(["admin"]);
  const id = idSchema.parse(formData.get("id"));
  const supabase = await getMigrationAwareServerSupabase();
  // Delete media and documents first (foreign key cascade may or may not exist).
  await supabase.from("product_media").delete().eq("product_id", id);
  await supabase.from("product_documents").delete().eq("product_id", id);
  await supabase.from("product_variants").delete().eq("product_id", id);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error("Le produit n'a pas pu être supprimé.");
  await auditAdminAction({ ...actor, actorId: actor.userId, action: "product.delete", entity: "product", entityId: id });
  invalidateCatalogCache(); revalidateTag("catalog"); revalidatePath("/admin/produkte");
}

/** Delete multiple products at once (bulk action from the admin list). */
export async function deleteProducts(formData: FormData) {
  const actor = await requireAdminAccess(["admin"]);
  const raw = formData.get("ids");
  if (!raw || typeof raw !== "string") throw new Error("Aucun produit sélectionné.");
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.length === 0) throw new Error("Aucun produit sélectionné.");
  if (ids.length > 200) throw new Error("Trop de produits sélectionnés (max 200).");
  // Validate every ID is a UUID.
  for (const id of ids) idSchema.parse(id);

  const supabase = await getMigrationAwareServerSupabase();
  // Delete children first (foreign key cascade may or may not exist).
  await supabase.from("product_media").delete().in("product_id", ids);
  await supabase.from("product_documents").delete().in("product_id", ids);
  await supabase.from("product_variants").delete().in("product_id", ids);
  const { error } = await supabase.from("products").delete().in("id", ids);
  if (error) throw new Error("Les produits n'ont pas pu être supprimés.");
  await auditAdminAction({
    ...actor, actorId: actor.userId,
    action: "product.bulk_delete", entity: "product",
    metadata: { count: ids.length },
  });
  invalidateCatalogCache(); revalidateTag("catalog"); revalidatePath("/admin/produkte");
}

/** Delete a single product_media row. */
export async function deleteProductImage(formData: FormData) {
  const actor = await requireAdminAccess(["admin", "content_editor"]);
  const imageId = z.string().uuid().parse(formData.get("image_id"));
  const productId = z.string().uuid().parse(formData.get("product_id"));
  const supabase = await getMigrationAwareServerSupabase();
  const { error } = await supabase.from("product_media").delete().eq("id", imageId);
  if (error) throw new Error("L'image n'a pas pu être supprimée.");
  await auditAdminAction({ ...actor, actorId: actor.userId, action: "product.image_delete", entity: "product_media", entityId: imageId });
  revalidatePath(`/admin/produkte/${productId}`);
}

/** Move an image one position up or down. */
export async function reorderProductImage(formData: FormData) {
  const actor = await requireAdminAccess(["admin", "content_editor"]);
  const imageId = z.string().uuid().parse(formData.get("image_id"));
  const productId = z.string().uuid().parse(formData.get("product_id"));
  const direction = z.enum(["up", "down"]).parse(formData.get("direction"));
  const supabase = await getMigrationAwareServerSupabase();
  // Fetch all images for this product ordered by position.
  const { data: images } = await supabase
    .from("product_media")
    .select("id,position")
    .eq("product_id", productId)
    .order("position", { ascending: true });
  if (!images || images.length < 2) return;
  const idx = images.findIndex((img) => img.id === imageId);
  if (idx === -1) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= images.length) return;
  // Swap positions.
  const a = images[idx]!;
  const b = images[swapIdx]!;
  await supabase.from("product_media").update({ position: b.position }).eq("id", a.id);
  await supabase.from("product_media").update({ position: a.position }).eq("id", b.id);
  await auditAdminAction({ ...actor, actorId: actor.userId, action: "product.image_reorder", entity: "product_media", entityId: imageId });
  revalidatePath(`/admin/produkte/${productId}`);
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
  if (error) throw new Error("La commande n'a pas pu être mise à jour.");

  await supabase.from("order_events").insert({
    order_id: id,
    event_type: "order.status_changed",
    from_status: before?.status ?? null,
    to_status: status,
    actor_id: actor.userId,
    metadata: carrier && trackingNumber ? { carrier, tracking_number: trackingNumber } : {},
  });

  await auditAdminAction({ ...actor, actorId: actor.userId, action: "order.update", entity: "order", entityId: id, metadata: { status } });

  // Honours site_settings.invoice_trigger for the two milestones that are not
  // order placement. Only fires on an actual transition, so re-saving a shipped
  // order does not try to raise a second invoice.
  if (before && before.status !== status) {
    if (status === "paid") await maybeIssueInvoice(id, "payment");
    if (status === "shipped") await maybeIssueInvoice(id, "shipment");
  }

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
  if (error) throw new Error("Le contenu n'a pas pu être enregistré.");
  await auditAdminAction({ ...actor, actorId: actor.userId, action: id ? "content.update" : "content.create", entity: "content", entityId: data.id });
  revalidatePath("/admin/inhalte"); revalidatePath(`/${values.slug}`);
}

/**
 * Copies the shipped legal and information texts into the CMS as drafts.
 *
 * Until an entry exists, those pages render from `lib/legal/defaults` and no
 * editor can touch them. This turns each one into a normal content entry that
 * can be edited, reviewed and published like anything else. Slugs that already
 * exist are skipped, so running it twice never overwrites edited text.
 */
export async function seedLegalContent() {
  const actor = await requireAdminAccess(["admin", "content_editor"]);
  const supabase = await getMigrationAwareServerSupabase();

  const { data: existing, error: readError } = await supabase
    .from("content_entries")
    .select("slug")
    .in(
      "slug",
      LEGAL_DEFAULTS.map((entry) => entry.slug),
    );
  if (readError) throw new Error("Les contenus existants n'ont pas pu être lus.");

  const taken = new Set((existing ?? []).map((row) => String(row.slug).toLowerCase()));
  const missing = LEGAL_DEFAULTS.filter((entry) => !taken.has(entry.slug));
  if (missing.length === 0) {
    revalidatePath("/admin/inhalte");
    return;
  }

  const { error } = await supabase.from("content_entries").insert(
    missing.map((entry) => ({
      slug: entry.slug,
      kind: entry.kind,
      title: entry.title,
      excerpt: entry.excerpt,
      seo_description: entry.seoDescription,
      format: "markdown" as const,
      body: entry.body,
      // Drafts, not published: these texts still need a legal review, and
      // publishing them here would put them live without one.
      status: "draft" as const,
      author_id: actor.userId,
    })),
  );
  if (error) throw new Error("Les textes juridiques n'ont pas pu être créés.");

  await auditAdminAction({
    ...actor,
    actorId: actor.userId,
    action: "content.seed_legal",
    entity: "content",
    metadata: { created: missing.map((entry) => entry.slug).join(",") },
  });
  revalidatePath("/admin/inhalte");
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
  if (error) throw new Error("L'avis n'a pas pu être enregistré.");
  await auditAdminAction({ ...actor, actorId: actor.userId, action: id ? "review.update" : "review.create", entity: "review", entityId: data.id });
  revalidatePath("/admin/bewertungen"); revalidatePath("/", "layout");
}

export async function deleteReview(formData: FormData) {
  const actor = await requireAdminAccess(["admin", "content_editor"]);
  const id = idSchema.parse(formData.get("id"));
  const supabase = await getMigrationAwareServerSupabase();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw new Error("L'avis n'a pas pu être supprimé.");
  await auditAdminAction({ ...actor, actorId: actor.userId, action: "review.delete", entity: "review", entityId: id });
  revalidatePath("/admin/bewertungen"); revalidatePath("/", "layout");
}

const settingsFields = ["company_name","legal_form","street","postal_code","city","country_code","phone","phone_secondary","email","support_email","vat_id","tax_number","commercial_register","register_court","managing_director","social_instagram","social_facebook","social_tiktok","social_linkedin","social_youtube","logo_url","invoice_prefix","invoice_footer","chatbot_name","support_hours"] as const;

/** Columns a database might not have yet, keyed by the migration that adds them. */
const OPTIONAL_SETTINGS_COLUMNS = ["social_tiktok"] as const;

export async function saveSiteSettings(formData: FormData) {
  const actor = await requireAdminAccess(["admin"]);
  const values = Object.fromEntries(settingsFields.map((field) => [field, optionalText.parse(String(formData.get(field) ?? ""))]));
  const supabase = await getMigrationAwareServerSupabase();
  const patch = { ...values,
    newsletter_enabled: formData.get("newsletter_enabled") === "on", chatbot_enabled: formData.get("chatbot_enabled") === "on", cart_recovery_enabled: formData.get("cart_recovery_enabled") === "on",
    invoice_payment_terms_days: z.coerce.number().int().min(0).max(365).parse(formData.get("invoice_payment_terms_days")), invoice_trigger: z.enum(["manual","order","payment","shipment"]).parse(formData.get("invoice_trigger")),
    cart_recovery_first_delay_minutes: z.coerce.number().int().min(30).max(10080).parse(formData.get("cart_recovery_first_delay_minutes")), cart_recovery_second_delay_minutes: z.coerce.number().int().min(60).max(20160).parse(formData.get("cart_recovery_second_delay_minutes")), cart_recovery_max_reminders: z.coerce.number().int().min(1).max(3).parse(formData.get("cart_recovery_max_reminders")),
    updated_by: actor.userId };

  let { error } = await supabase.from("site_settings").update(patch).eq("id", 1);
  // A column from a migration this database has not run turns the whole save
  // into a 42703 and loses every other edit on the form. Drop the optional
  // ones and save the rest rather than making the admin retype it.
  if (error && (error as { code?: string }).code === "42703") {
    const reduced = { ...patch };
    for (const column of OPTIONAL_SETTINGS_COLUMNS) delete (reduced as Record<string, unknown>)[column];
    ({ error } = await supabase.from("site_settings").update(reduced).eq("id", 1));
  }
  if (error) throw new Error("Les réglages n'ont pas pu être enregistrés.");
  await auditAdminAction({ ...actor, actorId: actor.userId, action: "settings.update", entity: "site_settings", entityId: "1" });
  // Legal pages read the company details through the shortcode cache; without
  // this an address change takes up to a minute to appear.
  invalidateShortcodeCache();
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
    message: "IBAN invalide.",
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

  const depositEnabled = formData.get("deposit_enabled") === "on";
  const depositMinRaw = String(formData.get("deposit_min") ?? "10000").trim().replace(",", ".");
  const depositMinCents = Math.round((Number(depositMinRaw) || 0) * 100);
  const depositPercent = z.coerce.number().int().min(1).max(100).parse(formData.get("deposit_percent") ?? "30");

  // A method cannot be switched on without what it needs to take a payment,
  // otherwise the checkout would offer a dead end.
  if (bankEnabled && (!iban || !text.bank_account_holder)) {
    throw new Error("Le virement nécessite un IBAN et un titulaire de compte.");
  }
  if (cardEnabled && (!text.card_provider || !text.card_publishable_key)) {
    throw new Error("Le paiement par carte nécessite un prestataire et une clé publishable.");
  }
  if (cryptoEnabled && (!text.crypto_provider || currencies.length === 0)) {
    throw new Error("Le paiement en crypto nécessite un prestataire et au moins une devise.");
  }
  // The deposit is settled by transfer and the customer pays it now, so it
  // needs the bank transfer switched on with a real account — the seeded
  // placeholder must never be shown as a destination for a due payment.
  if (
    depositEnabled &&
    (!bankEnabled ||
      !iban ||
      iban === PLACEHOLDER_IBAN ||
      !text.bank_account_holder ||
      text.bank_account_holder === PLACEHOLDER_ACCOUNT_HOLDER)
  ) {
    throw new Error("L'acompte nécessite un virement activé avec un vrai compte bancaire (pas les coordonnées provisoires).");
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
      deposit_enabled: depositEnabled,
      deposit_min_cents: depositMinCents,
      deposit_percent: depositPercent,
      updated_by: actor.userId,
    })
    .eq("id", 1);
  if (error) throw new Error("Les moyens de paiement n'ont pas pu être enregistrés.");

  await auditAdminAction({ ...actor, actorId: actor.userId, action: "payment_settings.update", entity: "payment_settings", entityId: "1" });
  // The Zahlungsarten page renders the IBAN through a shortcode.
  invalidateShortcodeCache();
  revalidatePath("/admin/zahlungen"); revalidatePath("/kasse"); revalidatePath("/zahlung");
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
  if (input.discount_type === "percentage" && storedValue > 10_000) throw new Error("La remise en pourcentage ne peut pas dépasser 100 %.");
  const { id, ...rest } = input;
  const supabase = await getMigrationAwareServerSupabase();
  const payload = { ...rest, discount_value: storedValue, created_by: actor.userId };
  const query = id ? supabase.from("promotions").update(payload).eq("id", id).select("id").single() : supabase.from("promotions").insert(payload).select("id").single();
  const { data, error } = await query;
  if (error || !data) throw new Error("La remise n'a pas pu être enregistrée.");
  const promotionId = data.id as string;
  await Promise.all([
    supabase.from("promotion_products").delete().eq("promotion_id", promotionId),
    supabase.from("promotion_categories").delete().eq("promotion_id", promotionId),
  ]);
  if (input.scope === "products") {
    const ids = formData.getAll("product_ids").map(String);
    if (!ids.length) throw new Error("Sélectionnez au moins un produit.");
    const { error: linkError } = await supabase.from("promotion_products").insert(ids.map((product_id) => ({ promotion_id: promotionId, product_id })));
    if (linkError) throw new Error("La sélection de produits n'a pas pu être enregistrée.");
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
  if (error) throw new Error("La remise n'a pas pu être désactivée.");
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
  const { data, error } = await query; if (error || !data) throw new Error("L'entrée FAQ n'a pas pu être enregistrée.");
  await auditAdminAction({ ...actor, actorId: actor.userId, action: id ? "faq.update" : "faq.create", entity: "faq", entityId: data.id });
  revalidatePath("/faq"); revalidatePath("/admin/faq");
}

export async function archiveFaq(formData: FormData) {
  const actor = await requireAdminAccess(["admin", "content_editor"]); const id = idSchema.parse(formData.get("id"));
  const supabase = await getMigrationAwareServerSupabase(); const { error } = await supabase.from("faq_entries").update({ status: "archived", updated_by: actor.userId }).eq("id", id);
  if (error) throw new Error("L'entrée FAQ n'a pas pu être archivée.");
  await auditAdminAction({ ...actor, actorId: actor.userId, action: "faq.archive", entity: "faq", entityId: id }); revalidatePath("/faq"); revalidatePath("/admin/faq");
}

/**
 * Opens the mail connection and sends one message to the admin inbox.
 *
 * A misconfigured mailbox is otherwise invisible until a real customer orders
 * and never hears back — the notification path is deliberately best-effort, so
 * nothing fails loudly on its own. This is the loud version, on demand.
 */
export async function sendTestEmail() {
  const actor = await requireAdminAccess(["admin"]);
  const inbox = adminInbox();
  if (!inbox) throw new Error("Aucun e-mail admin configuré (ADMIN_EMAIL).");

  const check = await verifyEmailTransport();
  if (!check.ok) throw new Error(check.detail);

  const sentAt = new Date().toLocaleString("de-DE");
  const result = await sendEmail({
    to: inbox,
    subject: `${BRAND_NAME} — Testnachricht`,
    text: `Diese Testnachricht wurde am ${sentAt} aus der Administration ausgelöst. Wenn Sie sie lesen, funktioniert der Versand von Bestellbestätigungen und Statusmeldungen.`,
    html: `<p>Diese Testnachricht wurde am ${sentAt} aus der Administration ausgelöst.</p><p>Wenn Sie sie lesen, funktioniert der Versand von Bestellbestätigungen und Statusmeldungen.</p>`,
  });
  if (!result.sent) throw new Error(`Envoi échoué : ${result.error ?? result.skipped}`);

  await auditAdminAction({
    ...actor,
    actorId: actor.userId,
    action: "email.test",
    entity: "settings",
    metadata: { transport: result.transport ?? "unknown", to: inbox },
  });
  revalidatePath("/admin");
}

const extraLineSchema = z.object({
  name: z.string().trim().min(1).max(200),
  quantity: z.coerce.number().positive(),
  price: z.coerce.number().positive(),
  site: z.boolean(),
});

/**
 * Reads the dynamic extra-line fields the invoice form appends
 * (`line_name_N`, `line_quantity_N`, `line_price_N`, `line_site_N`).
 */
function readExtraLines(formData: FormData) {
  const count = Number(formData.get("line_count") ?? 0);
  const lines = [];
  for (let index = 0; index < count; index++) {
    const name = String(formData.get(`line_name_${index}`) ?? "").trim();
    if (!name) continue;
    const quantityRaw = String(formData.get(`line_quantity_${index}`) ?? "1").trim().replace(",", ".");
    const priceRaw = String(formData.get(`line_price_${index}`) ?? "").trim().replace(",", ".");
    if (!priceRaw) continue;
    lines.push(extraLineSchema.parse({ name, quantity: quantityRaw, price: priceRaw, site: formData.get(`line_site_${index}`) === "on" }));
  }
  return lines;
}

export async function issueInvoice(formData: FormData) {
  const actor = await requireAdminAccess(["admin"]); const orderId = idSchema.parse(formData.get("order_id"));
  const extraLines = readExtraLines(formData);
  const invoice = await issueInvoiceForOrder(orderId, extraLines.map((line) => ({ name: line.name, quantity: line.quantity, unitPriceCents: Math.round(line.price * 100), createProduct: line.site })));
  await auditAdminAction({ ...actor, actorId: actor.userId, action: "invoice.issue", entity: "invoice", entityId: invoice.id, metadata: { order_id: orderId, invoice_number: invoice.invoiceNumber, extra_lines: extraLines.length, created_products: invoice.createdProducts.length } }); revalidatePath("/admin/rechnungen");
}

const standaloneLineSchema = z.object({
  name: z.string().trim().min(1).max(200),
  quantity: z.coerce.number().positive(),
  price: z.coerce.number().positive(),
  // German firewood is 7 % VAT; everything else defaults to 19 %.
  taxRate: z.coerce.number().refine((value) => value === 7 || value === 19, { message: "Taux de TVA invalide." }),
  site: z.boolean(),
});

const standaloneCustomerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().optional().or(z.literal("")),
  street: z.string().trim().optional().or(z.literal("")),
  house_number: z.string().trim().optional().or(z.literal("")),
  postcode: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
});

/**
 * Reads the dynamic standalone-invoice line fields (`sa_name_N`, `sa_quantity_N`,
 * `sa_price_N`, `sa_site_N`) plus the customer block.
 */
function readStandaloneLines(formData: FormData) {
  const count = Number(formData.get("sa_line_count") ?? 0);
  const lines = [];
  for (let index = 0; index < count; index++) {
    const name = String(formData.get(`sa_name_${index}`) ?? "").trim();
    if (!name) continue;
    const quantityRaw = String(formData.get(`sa_quantity_${index}`) ?? "1").trim().replace(",", ".");
    const priceRaw = String(formData.get(`sa_price_${index}`) ?? "").trim().replace(",", ".");
    if (!priceRaw) continue;
    lines.push(standaloneLineSchema.parse({ name, quantity: quantityRaw, price: priceRaw, taxRate: formData.get(`sa_tax_${index}`) ?? "19", site: formData.get(`sa_site_${index}`) === "on" }));
  }
  return lines;
}

export async function issueStandaloneInvoiceAction(formData: FormData) {
  const actor = await requireAdminAccess(["admin"]);
  const customer = standaloneCustomerSchema.parse({
    name: formData.get("sa_customer_name"),
    email: formData.get("sa_customer_email"),
    street: formData.get("sa_customer_street"),
    house_number: formData.get("sa_customer_house_number"),
    postcode: formData.get("sa_customer_postcode"),
    city: formData.get("sa_customer_city"),
  });
  const lines = readStandaloneLines(formData);
  const depositEnabled = formData.get("sa_deposit_enabled") === "on";
  // A German decimal comma is what an admin types into a percent field.
  const depositPercentRaw = String(formData.get("sa_deposit_percent") ?? "30").trim().replace(",", ".") || "30";
  const depositPercent = depositEnabled
    ? z.coerce.number().int().min(1).max(100).parse(depositPercentRaw)
    : null;
  const invoice = await issueStandaloneInvoice(
    {
      name: customer.name,
      email: customer.email || null,
      street: customer.street || null,
      houseNumber: customer.house_number || null,
      postcode: customer.postcode || null,
      city: customer.city || null,
    },
    lines.map((line) => ({ name: line.name, quantity: line.quantity, unitPriceCents: Math.round(line.price * 100), taxRatePct: line.taxRate, createProduct: line.site })),
    depositPercent ? { percent: depositPercent } : null,
  );
  await auditAdminAction({
    ...actor,
    actorId: actor.userId,
    action: "invoice.issue_standalone",
    entity: "invoice",
    entityId: invoice.id,
    metadata: { invoice_number: invoice.invoiceNumber, lines: lines.length, created_products: invoice.createdProducts.length, deposit_percent: depositPercent },
  });
  revalidatePath("/admin/rechnungen");
}

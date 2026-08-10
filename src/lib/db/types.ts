/**
 * Catalog subset of the generated Supabase types.
 *
 * Keep this file aligned with the SQL migrations. The hosted project currently
 * prevents type generation for this account; `pnpm db:types` remains the
 * canonical replacement once that permission is granted.
 */

import type { BasePriceUnit, QuantityUnit } from "@/lib/utils";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type CatalogTable<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface OrderRow {
  id: string; order_number: string; profile_id: string | null; customer_email: string;
  customer_name: string; status: string; payment_status: string; fulfillment_status: string;
  currency: "EUR"; subtotal_cents: number; shipping_cents: number; tax_cents: number;
  discount_cents: number; promotion_code: string | null; total_cents: number;
  billing_address: Json; shipping_address: Json; internal_notes: string | null;
  created_at: string; updated_at: string;
}

export interface InvoiceRow {
  id: string;
  /** Null for standalone invoices raised without an order (20260810000017). */
  order_id: string | null;
  invoice_number: string | null; kind: string; status: string;
  currency: "EUR"; net_cents: number; tax_cents: number; gross_cents: number; snapshot: Json;
  document_path: string | null; document_sha256: string | null; issued_at: string | null;
  due_date: string | null; created_at: string; updated_at: string;
}

export interface ContentEntryRow {
  id: string; slug: string; kind: "page" | "article" | "legal"; title: string;
  excerpt: string | null; format: "rich_text" | "markdown" | "html"; body: string;
  status: "draft" | "review" | "published" | "archived"; seo_title: string | null;
  seo_description: string | null; effective_from: string | null; published_at: string | null;
  author_id: string | null; created_at: string; updated_at: string;
}

export interface ReviewRow {
  id: string; product_id: string | null; author_name: string; location: string | null;
  rating: number; title: string | null; body: string; verified: boolean;
  status: "pending" | "approved" | "rejected"; reviewed_on: string;
  created_at: string; updated_at: string;
}

export interface SiteSettingsRow {
  id: number; company_name: string | null; legal_form: string | null; street: string | null;
  postal_code: string | null; city: string | null; country_code: string | null; phone: string | null;
  phone_secondary: string | null; email: string | null; support_email: string | null;
  vat_id: string | null; tax_number: string | null; commercial_register: string | null;
  register_court: string | null; managing_director: string | null; social_instagram: string | null;
  social_facebook: string | null; social_linkedin: string | null; social_youtube: string | null;
  /** Optional: added by 20260810000015_site_settings_tiktok.sql. */
  social_tiktok?: string | null;
  newsletter_enabled: boolean; logo_url: string | null; invoice_prefix: string;
  invoice_footer: string | null; invoice_payment_terms_days: number;
  invoice_trigger: "manual" | "order" | "payment" | "shipment";
  chatbot_enabled: boolean; chatbot_name: string; support_hours: string | null;
  cart_recovery_enabled: boolean; cart_recovery_first_delay_minutes: number;
  cart_recovery_second_delay_minutes: number; cart_recovery_max_reminders: number;
  updated_at: string; updated_by: string | null;
}

export interface PromotionRow {
  id: string; code: string; name: string; description: string | null;
  discount_type: "percentage" | "fixed"; discount_value: number;
  scope: "all" | "products" | "categories"; minimum_subtotal_cents: number;
  maximum_discount_cents: number | null; usage_limit: number | null;
  times_redeemed: number; starts_at: string | null; ends_at: string | null;
  is_active: boolean; created_by: string | null; created_at: string; updated_at: string;
}

export interface PromotionProductRow { promotion_id: string; product_id: string }
export interface PromotionCategoryRow { promotion_id: string; category_id: string }

export interface PromotionRedemptionRow {
  id: string; promotion_id: string; order_id: string; customer_email: string;
  discount_cents: number; redeemed_at: string;
}

export interface FaqEntryRow {
  id: string; question: string; answer: string; category: string; product_id: string | null;
  status: "draft" | "published" | "archived"; position: number;
  author_id: string | null; created_at: string; updated_at: string;
}

export interface ConversationRow {
  id: string; session_token_hash: string; profile_id: string | null; customer_email: string | null;
  status: "ai_active" | "waiting_for_customer" | "human_requested" | "queued" | "assigned" | "closed";
  context_path: string | null; summary: string | null; assigned_to: string | null;
  last_message_at: string; expires_at: string; created_at: string; updated_at: string;
}

export interface ConversationMessageRow {
  id: number; conversation_id: string; role: "user" | "assistant" | "system" | "human";
  content: string; sources: Json; model: string | null; confidence: number | null; created_at: string;
}

export interface AbandonedCartRow {
  id: string; session_token_hash: string; customer_email: string; customer_name: string | null;
  items: Json; currency: "EUR"; subtotal_cents: number; promotion_code: string | null;
  consent_at: string; last_activity_at: string; next_reminder_at: string | null;
  reminder_count: number; status: "active" | "recovered" | "converted" | "unsubscribed" | "expired";
  converted_order_id: string | null; created_at: string; updated_at: string;
}

export interface NotificationJobRow {
  id: string; kind: string; idempotency_key: string; payload: Json;
  status: "pending" | "processing" | "sent" | "failed" | "cancelled";
  attempts: number; next_attempt_at: string; locked_at: string | null;
  provider_message_id: string | null; last_error: string | null;
  created_at: string; updated_at: string;
}

export interface NewsletterSubscriberRow {
  id: string; email: string; status: string; source: string; consent_at: string;
  confirmed_at: string | null; unsubscribed_at: string | null; created_at: string; updated_at: string;
}

export interface UserRoleRow {
  profile_id: string;
  role: Database["public"]["Enums"]["app_role"];
  granted_at: string;
  granted_by: string | null;
}

export interface ProfileRow {
  id: string; email: string; first_name: string | null; last_name: string | null;
  phone: string | null; locale: string; marketing_opt_in: boolean;
  marketing_opt_in_at: string | null; created_at: string; updated_at: string; deleted_at: string | null;
}

export interface AuditLogRow {
  id: number; at: string; actor_id: string | null; actor_role: string | null;
  action: string; entity: string; entity_id: string | null; metadata: Json;
}

export type ProductKind =
  | "stove"
  | "wood"
  /** Stammholz, Meterholz, Rundholz — sold by the Ster or Festmeter. */
  | "log"
  | "pellet"
  | "briquette"
  | "kindling"
  | "coal"
  | "accessory";

export interface BrandRow {
  id: string;
  slug: string;
  name: string;
  country_code: string | null;
  website: string | null;
  logo_cloudinary_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  slug: string;
  parent_id: string | null;
  name: string;
  short_description: string | null;
  hero_cloudinary_id: string | null;
  position: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductRow {
  id: string;
  slug: string;
  kind: ProductKind;
  brand_id: string | null;
  category_id: string | null;
  economic_operator_id: string | null;
  model: string;
  subtitle: string | null;
  short_description: string | null;
  long_description: string | null;
  description_authorized: boolean;
  power_kw_min: number | null;
  power_kw_max: number | null;
  power_kw_nominal: number | null;
  efficiency_pct: number | null;
  energy_class: string | null;
  fuel: string | null;
  flue_diameter_mm: number | null;
  connection_position: string | null;
  height_mm: number | null;
  width_mm: number | null;
  depth_mm: number | null;
  weight_kg: number | null;
  co_mg_nm3: number | null;
  ogc_mg_nm3: number | null;
  particulates_mg_nm3: number | null;
  raw_air_independent: string | null;
  extra: Json;
  price_cents_public: number | null;
  /**
   * Quantity `price_cents_public` covers, counted in `quantity_unit`, plus the
   * reference unit for the § 4 PAngV Grundpreis — solid fuels are quoted per t.
   *
   * Optional because a database that has not yet run
   * `20260809000012_product_sales_unit.sql` returns rows without them.
   */
  quantity_amount?: number | null;
  quantity_unit?: QuantityUnit | null;
  base_price_unit?: BasePriceUnit | null;
  quote_mode: boolean;
  ecodesign_2022: boolean | null;
  bimschv_stufe: string | null;
  compliance_verified_at: string | null;
  source: string | null;
  source_url: string | null;
  source_scraped_at: string | null;
  is_published: boolean;
  is_featured: boolean;
  review_status: "pending" | "approved" | "rejected" | "superseded";
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductVariantRow {
  id: string;
  product_id: string;
  axis: string;
  code: string;
  label: string;
  swatch_cloudinary_id: string | null;
  main_image_cloudinary_id: string | null;
  video_cloudinary_id: string | null;
  surcharge_cents: number;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductMediaRow {
  id: string;
  product_id: string;
  variant_id: string | null;
  kind: "image" | "video" | "energy_label" | "diagram";
  cloudinary_public_id: string;
  source_url: string | null;
  alt_de: string | null;
  position: number;
  created_at: string;
}

export interface ProductDocumentRow {
  id: string;
  product_id: string;
  kind: "datasheet" | "manual" | "energy_label" | "certificate" | "brochure";
  title: string;
  storage_path: string;
  language: string;
  version: string | null;
  effective_from: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      brands: CatalogTable<BrandRow>;
      categories: CatalogTable<CategoryRow>;
      products: CatalogTable<ProductRow>;
      product_variants: CatalogTable<ProductVariantRow>;
      product_media: CatalogTable<ProductMediaRow>;
      product_documents: CatalogTable<ProductDocumentRow>;
      orders: CatalogTable<OrderRow>;
      invoices: CatalogTable<InvoiceRow>;
      promotions: CatalogTable<PromotionRow>;
      promotion_products: CatalogTable<PromotionProductRow>;
      promotion_categories: CatalogTable<PromotionCategoryRow>;
      promotion_redemptions: CatalogTable<PromotionRedemptionRow>;
      faq_entries: CatalogTable<FaqEntryRow>;
      conversations: CatalogTable<ConversationRow>;
      conversation_messages: CatalogTable<ConversationMessageRow>;
      abandoned_carts: CatalogTable<AbandonedCartRow>;
      notification_jobs: CatalogTable<NotificationJobRow>;
      content_entries: CatalogTable<ContentEntryRow>;
      site_settings: CatalogTable<SiteSettingsRow>;
      newsletter_subscribers: CatalogTable<NewsletterSubscriberRow>;
      user_roles: CatalogTable<UserRoleRow>;
      profiles: CatalogTable<ProfileRow>;
      audit_logs: CatalogTable<AuditLogRow>;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      app_role:
        | "customer"
        | "support"
        | "logistics"
        | "content_editor"
        | "finance"
        | "admin";
      product_kind: ProductKind;
      media_kind: "image" | "video" | "energy_label" | "diagram";
    };
    CompositeTypes: Record<never, never>;
  };
}

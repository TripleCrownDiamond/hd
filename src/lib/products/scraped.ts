export interface ScrapedVariant {
  axis: string;
  code: string;
  label_de: string;
  swatch_url_source: string | null;
  main_image_url_source: string | null;
  video_url_source: string | null;
  surcharge_cents: number | null;
}

export interface ScrapedVariantCloudinary {
  code: string;
  main: string | null;
  swatch: string | null;
}

export interface ScrapedProductDocument {
  id: string;
  kind: "datasheet" | "manual" | "energy_label" | "certificate" | "brochure";
  title: string;
  download_url: string;
}

export interface ScrapedProduct {
  source: string;
  source_url: string;
  scraped_at?: string | null;
  slug: string;
  brand: string;
  model: string;
  category_source_label: string;
  descriptions: {
    subtitle_de?: string | null;
    short_de: string | null;
    long_de_raw: string | null;
    long_de_authorized: boolean;
  };
  technical: {
    power_kw_min: number | null;
    power_kw_max: number | null;
    power_kw_nominal: number | null;
    efficiency_pct: number | null;
    energy_class: string | null;
    fuel: string | null;
    flue_diameter_mm: number | null;
    connection: string | null;
    dimensions_mm: { height: number | null; width: number | null; depth: number | null };
    weight_kg: number | null;
    raw_air_independent: string | null;
    extra: Record<string, unknown>;
  };
  variants: ScrapedVariant[];
  media: {
    hero_image_url_source: string | null;
    gallery_url_sources: string[];
    video_url_sources: string[];
    energy_label_url_source: string | null;
  };
  media_cloudinary?: {
    hero: string | null;
    variants: ScrapedVariantCloudinary[];
    gallery?: Array<{ public_id: string; source_url: string }>;
  };
  pricing: {
    price_cents_public: number | null;
    quote_mode: boolean;
  };
  documents: ScrapedProductDocument[];
  review_status: string;
}

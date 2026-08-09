-- Catalog: categories, brands, economic operators, products, variants, media.

-- 1. Brands
create table public.brands (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  name text not null,
  country_code text default 'DE',
  website text,
  logo_cloudinary_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger brands_set_updated_at before update on public.brands
  for each row execute function public.set_updated_at();

-- 2. Economic operator (GPSR obligation)
create table public.economic_operators (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  role text not null check (role in ('manufacturer', 'importer', 'authorized_representative', 'fulfilment_service')),
  address text not null,
  postal_code text not null,
  city text not null,
  country_code text not null default 'DE',
  contact_email text,
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger economic_operators_set_updated_at before update on public.economic_operators
  for each row execute function public.set_updated_at();

-- 3. Categories (hierarchical)
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  parent_id uuid references public.categories(id) on delete restrict,
  name text not null,
  short_description text,
  hero_cloudinary_id text,
  position int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index categories_parent_idx on public.categories(parent_id);
create trigger categories_set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

-- 4. Product kinds
do $$
begin
  if not exists (select 1 from pg_type where typname = 'product_kind') then
    create type public.product_kind as enum (
      'stove',
      'wood',
      'pellet',
      'briquette',
      'kindling',
      'accessory'
    );
  end if;
end
$$;

-- 5. Products (core)
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  kind public.product_kind not null,
  brand_id uuid references public.brands(id) on delete restrict,
  category_id uuid references public.categories(id) on delete restrict,
  economic_operator_id uuid references public.economic_operators(id),
  model text not null,
  subtitle text,
  short_description text,
  long_description text,
  description_authorized boolean not null default false,
  -- Typed technical facts common to stoves. Non-applicable fields stay null.
  power_kw_min numeric(5,2),
  power_kw_max numeric(5,2),
  power_kw_nominal numeric(5,2),
  efficiency_pct numeric(5,2),
  energy_class text,
  fuel text,
  flue_diameter_mm int,
  connection_position text,
  height_mm int,
  width_mm int,
  depth_mm int,
  weight_kg numeric(6,2),
  co_mg_nm3 numeric(6,2),
  ogc_mg_nm3 numeric(6,2),
  particulates_mg_nm3 numeric(6,2),
  raw_air_independent text,
  -- Everything else the manufacturer publishes goes here (Nutzer-Benefits, CAIR, Stilwelt…)
  extra jsonb not null default '{}'::jsonb,
  -- Pricing (integer cents, EUR)
  price_cents_public int,
  quote_mode boolean not null default true,
  -- Compliance
  ecodesign_2022 boolean,
  bimschv_stufe text,
  compliance_verified_at timestamptz,
  -- Sourcing traceability
  source text,
  source_url text,
  source_scraped_at timestamptz,
  -- Editorial
  is_published boolean not null default false,
  is_featured boolean not null default false,
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected', 'superseded')),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_kind_idx on public.products(kind);
create index products_brand_idx on public.products(brand_id);
create index products_category_idx on public.products(category_id);
create index products_published_idx on public.products(is_published) where is_published;
create index products_model_trgm_idx on public.products using gin (model gin_trgm_ops);
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();

comment on column public.products.price_cents_public is
  'Integer EUR cents. NULL means quote_mode = true (Auf Anfrage).';
comment on column public.products.extra is
  'Manufacturer-specific attributes not covered by typed columns.';

-- 6. Product variants (colour, size, finish, …)
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  axis text not null,
  code citext not null,
  label text not null,
  swatch_cloudinary_id text,
  main_image_cloudinary_id text,
  video_cloudinary_id text,
  surcharge_cents int not null default 0,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, axis, code)
);
create index product_variants_product_idx on public.product_variants(product_id);
create trigger product_variants_set_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();

-- 7. Product media (extra photos, videos, energy labels)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'media_kind') then
    create type public.media_kind as enum ('image', 'video', 'energy_label', 'diagram');
  end if;
end
$$;

create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  kind public.media_kind not null default 'image',
  cloudinary_public_id text not null,
  source_url text,
  alt_de text,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index product_media_product_idx on public.product_media(product_id, position);
create index product_media_variant_idx on public.product_media(variant_id);

-- 8. Product documents (PDF datasheets, energy labels, manuals)
create table public.product_documents (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  kind text not null check (kind in ('datasheet', 'manual', 'energy_label', 'certificate', 'brochure')),
  title text not null,
  storage_path text not null,        -- Supabase Storage path (bucket: documents)
  language text not null default 'de-DE',
  version text,
  effective_from date,
  created_at timestamptz not null default now()
);
create index product_documents_product_idx on public.product_documents(product_id);

-- 9. Product compliance checks (per-model, per-standard proof)
create table public.product_compliance_checks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  standard text not null,               -- e.g. 'Ecodesign 2022', 'BImSchV Stufe 2', 'HKI CERT'
  status text not null check (status in ('verified', 'pending', 'not_applicable', 'rejected')),
  reference text,                       -- HKI-ID, certificate number, etc.
  document_id uuid references public.product_documents(id),
  verified_at timestamptz,
  verified_by uuid references public.profiles(id),
  notes text,
  unique (product_id, standard)
);

comment on table public.product_compliance_checks is
  'A regulated product cannot be published (is_published = true) if a required check has status <> verified.';

-- HKI-device table: per-model certification records from HKI CERT.
-- One row per device variant (non-RLU and RLU are separate rows).
create table public.hki_devices (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  product_id uuid not null references public.products(id) on delete cascade,
  hki_url text not null,
  product_slug citext not null,
  model_label text not null,
  nominal_power_kw numeric(5,2),
  rlu_approved boolean not null default false,
  standard text,
  test_year int,
  test_report text,
  ecodesign_passed boolean,
  bimschv_passed boolean,
  bimschv_stufe int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index hki_devices_product_idx on public.hki_devices(product_id);
create trigger hki_devices_set_updated_at before update on public.hki_devices
  for each row execute function public.set_updated_at();

comment on table public.hki_devices is
  'HKI CERT device registration per model variant. Populated by scrape-hki-resolution.';

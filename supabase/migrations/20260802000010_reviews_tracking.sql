-- Customer reviews, and shipment tracking on orders.

-- Reviews are moderated: nothing a visitor cannot see until an admin approves
-- it. A review may be tied to a product (drives its rating) or stand on its own
-- as a shop testimonial (drives the homepage section).
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  author_name text not null,
  location text,
  rating smallint not null check (rating between 1 and 5),
  title text,
  body text not null,
  -- A review linked to a real, paid order for this product.
  verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  -- When the review was written, which is not always when it was imported.
  reviewed_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reviews_product_idx on public.reviews(product_id, status);
create index reviews_status_idx on public.reviews(status, reviewed_on desc);
create trigger reviews_set_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

alter table public.reviews enable row level security;

create policy "reviews: public read approved"
  on public.reviews for select using (status = 'approved');
create policy "reviews: staff read all"
  on public.reviews for select
  using (public.has_any_role(array['admin','content_editor','support']::public.app_role[]));
create policy "reviews: editors manage"
  on public.reviews for all
  using (public.has_any_role(array['admin','content_editor']::public.app_role[]))
  with check (public.has_any_role(array['admin','content_editor']::public.app_role[]));

-- Shipment tracking, shown to the customer on the tracking page and emailed on
-- update. Carrier and number are set by an admin; the URL is derived for the
-- known carriers so a customer can click straight through.
alter table public.orders
  add column if not exists tracking_carrier text,
  add column if not exists tracking_number text,
  add column if not exists tracking_url text,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz;

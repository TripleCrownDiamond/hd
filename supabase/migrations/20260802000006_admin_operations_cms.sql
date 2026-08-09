-- Admin operations, CMS, site settings and newsletter.
-- All money is integer EUR cents. Issued invoices and order events are immutable.

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  profile_id uuid references public.profiles(id) on delete set null,
  customer_email citext not null,
  customer_name text not null,
  status text not null default 'draft' check (status in ('draft','pending_payment','paid','confirmed','processing','shipped','delivered','cancelled','refunded')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid','partially_refunded','refunded','failed')),
  fulfillment_status text not null default 'unfulfilled' check (fulfillment_status in ('unfulfilled','preparing','shipped','delivered','returned','cancelled')),
  currency text not null default 'EUR' check (currency = 'EUR'),
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  tax_cents integer not null default 0 check (tax_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  billing_address jsonb not null default '{}'::jsonb,
  shipping_address jsonb not null default '{}'::jsonb,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_profile_idx on public.orders(profile_id, created_at desc);
create index orders_status_idx on public.orders(status, created_at desc);
create index orders_email_idx on public.orders(customer_email);
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  sku text,
  name_snapshot text not null,
  variant_snapshot text,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  tax_rate numeric(5,2) not null default 19 check (tax_rate >= 0),
  line_total_cents integer not null check (line_total_cents >= 0),
  product_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items(order_id);

create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete restrict,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  from_status text,
  to_status text,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events(order_id, created_at desc);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  invoice_number text unique,
  kind text not null default 'invoice' check (kind in ('proforma','invoice','cancellation','credit_note')),
  status text not null default 'draft' check (status in ('draft','issued','void')),
  currency text not null default 'EUR' check (currency = 'EUR'),
  net_cents integer not null default 0 check (net_cents >= 0),
  tax_cents integer not null default 0 check (tax_cents >= 0),
  gross_cents integer not null default 0 check (gross_cents >= 0),
  snapshot jsonb not null default '{}'::jsonb,
  document_path text,
  document_sha256 text,
  issued_at timestamptz,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'issued' and invoice_number is not null and issued_at is not null) or status <> 'issued')
);
create index invoices_order_idx on public.invoices(order_id, created_at desc);
create trigger invoices_set_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();

create or replace function public.protect_issued_invoice()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.status = 'issued' and new is distinct from old then
    raise exception 'Issued invoices are immutable; create a correction document';
  end if;
  return new;
end;
$$;
create trigger invoices_protect_issued before update or delete on public.invoices
  for each row execute function public.protect_issued_invoice();

create table public.content_entries (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  kind text not null check (kind in ('page','article','legal')),
  title text not null,
  excerpt text,
  format text not null default 'markdown' check (format in ('rich_text','markdown','html')),
  body text not null default '',
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  seo_title text,
  seo_description text,
  effective_from timestamptz,
  published_at timestamptz,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index content_entries_kind_status_idx on public.content_entries(kind, status, updated_at desc);
create trigger content_entries_set_updated_at before update on public.content_entries
  for each row execute function public.set_updated_at();

create table public.content_revisions (
  id bigint generated always as identity primary key,
  entry_id uuid not null references public.content_entries(id) on delete cascade,
  revision integer not null,
  title text not null,
  format text not null,
  body text not null,
  status text not null,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(entry_id, revision)
);
create index content_revisions_entry_idx on public.content_revisions(entry_id, revision desc);

create or replace function public.snapshot_content_revision()
returns trigger language plpgsql set search_path = public as $$
begin
  insert into public.content_revisions(entry_id, revision, title, format, body, status, author_id)
  values (old.id, coalesce((select max(revision) + 1 from public.content_revisions where entry_id = old.id), 1), old.title, old.format, old.body, old.status, auth.uid());
  return new;
end;
$$;
create trigger content_entries_snapshot before update on public.content_entries
  for each row execute function public.snapshot_content_revision();

create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  company_name text,
  legal_form text,
  street text,
  postal_code text,
  city text,
  country_code text default 'DE',
  phone text,
  phone_secondary text,
  email text,
  support_email text,
  vat_id text,
  tax_number text,
  commercial_register text,
  register_court text,
  managing_director text,
  social_instagram text,
  social_facebook text,
  social_linkedin text,
  social_youtube text,
  newsletter_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);
create trigger site_settings_set_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();
insert into public.site_settings(id) values (1) on conflict do nothing;

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  status text not null default 'pending' check (status in ('pending','subscribed','unsubscribed','bounced')),
  source text not null default 'storefront',
  consent_at timestamptz not null,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index newsletter_status_idx on public.newsletter_subscribers(status, created_at desc);
create trigger newsletter_set_updated_at before update on public.newsletter_subscribers
  for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.invoices enable row level security;
alter table public.content_entries enable row level security;
alter table public.content_revisions enable row level security;
alter table public.site_settings enable row level security;
alter table public.newsletter_subscribers enable row level security;

create policy "orders: customer own" on public.orders for select using (profile_id = auth.uid());
create policy "orders: staff read" on public.orders for select using (public.has_any_role(array['admin','support','logistics','finance']::public.app_role[]));
create policy "orders: admin/support write" on public.orders for all using (public.has_any_role(array['admin','support']::public.app_role[])) with check (public.has_any_role(array['admin','support']::public.app_role[]));
create policy "order items: customer own" on public.order_items for select using (exists(select 1 from public.orders o where o.id = order_id and o.profile_id = auth.uid()));
create policy "order items: staff read" on public.order_items for select using (public.has_any_role(array['admin','support','logistics','finance']::public.app_role[]));
create policy "order items: admin write" on public.order_items for all using (public.has_role('admin'::public.app_role)) with check (public.has_role('admin'::public.app_role));
create policy "order events: customer own" on public.order_events for select using (exists(select 1 from public.orders o where o.id = order_id and o.profile_id = auth.uid()));
create policy "order events: staff read" on public.order_events for select using (public.has_any_role(array['admin','support','logistics','finance']::public.app_role[]));
create policy "order events: staff insert" on public.order_events for insert with check (public.has_any_role(array['admin','support','logistics','finance']::public.app_role[]));
create policy "invoices: customer own" on public.invoices for select using (exists(select 1 from public.orders o where o.id = order_id and o.profile_id = auth.uid()));
create policy "invoices: finance read" on public.invoices for select using (public.has_any_role(array['admin','finance','support']::public.app_role[]));
create policy "invoices: finance write" on public.invoices for all using (public.has_any_role(array['admin','finance']::public.app_role[])) with check (public.has_any_role(array['admin','finance']::public.app_role[]));
create policy "content: public published" on public.content_entries for select using (status = 'published' and (effective_from is null or effective_from <= now()));
create policy "content: editors manage" on public.content_entries for all using (public.has_any_role(array['admin','content_editor']::public.app_role[])) with check (public.has_any_role(array['admin','content_editor']::public.app_role[]));
create policy "revisions: editors read" on public.content_revisions for select using (public.has_any_role(array['admin','content_editor']::public.app_role[]));
create policy "settings: public read" on public.site_settings for select using (true);
create policy "settings: admin manage" on public.site_settings for all using (public.has_role('admin'::public.app_role)) with check (public.has_role('admin'::public.app_role));
create policy "newsletter: anonymous request" on public.newsletter_subscribers for insert with check (status = 'pending' and consent_at is not null);
create policy "newsletter: admin manage" on public.newsletter_subscribers for all using (public.has_role('admin'::public.app_role)) with check (public.has_role('admin'::public.app_role));

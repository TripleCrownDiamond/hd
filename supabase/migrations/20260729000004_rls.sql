-- RLS: enabled on every client-exposed table. Explicit policies required.

-- Identity
alter table public.profiles           enable row level security;
alter table public.addresses          enable row level security;
alter table public.user_roles         enable row level security;
alter table public.audit_logs         enable row level security;

-- Catalog
alter table public.brands                       enable row level security;
alter table public.economic_operators           enable row level security;
alter table public.categories                   enable row level security;
alter table public.products                     enable row level security;
alter table public.product_variants             enable row level security;
alter table public.product_media                enable row level security;
alter table public.product_documents            enable row level security;
alter table public.product_compliance_checks    enable row level security;

-- ────────────────────────────
-- profiles
-- ────────────────────────────
create policy "profiles: read own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: update own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles: admin/support can read all"
  on public.profiles for select
  using (public.has_any_role(array['admin','support']::public.app_role[]));

-- ────────────────────────────
-- addresses
-- ────────────────────────────
create policy "addresses: read own"
  on public.addresses for select
  using (profile_id = auth.uid());
create policy "addresses: write own"
  on public.addresses for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
create policy "addresses: logistics can read"
  on public.addresses for select
  using (public.has_any_role(array['logistics','admin']::public.app_role[]));

-- ────────────────────────────
-- user_roles — read own, write only via server-side privileged path
-- ────────────────────────────
create policy "user_roles: read own"
  on public.user_roles for select
  using (profile_id = auth.uid());
create policy "user_roles: admin can read all"
  on public.user_roles for select
  using (public.has_role('admin'::public.app_role));
-- No INSERT/UPDATE/DELETE policies — service_role (server) manages role assignments.

-- ────────────────────────────
-- audit_logs — never accessible to clients
-- ────────────────────────────
-- No policies. service_role bypasses RLS server-side.

-- ────────────────────────────
-- Catalog reads: published rows are public
-- ────────────────────────────
create policy "brands: public read"
  on public.brands for select using (true);

create policy "economic_operators: public read"
  on public.economic_operators for select using (true);

create policy "categories: public read published"
  on public.categories for select
  using (is_published);
create policy "categories: staff read all"
  on public.categories for select
  using (public.has_any_role(array['content_editor','admin']::public.app_role[]));

create policy "products: public read published"
  on public.products for select
  using (is_published and review_status = 'approved');
create policy "products: staff read all"
  on public.products for select
  using (public.has_any_role(array['content_editor','admin','support']::public.app_role[]));

create policy "product_variants: public read via product"
  on public.product_variants for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_published and p.review_status = 'approved'
    )
  );
create policy "product_variants: staff read all"
  on public.product_variants for select
  using (public.has_any_role(array['content_editor','admin']::public.app_role[]));

create policy "product_media: public read via product"
  on public.product_media for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_published and p.review_status = 'approved'
    )
  );
create policy "product_media: staff read all"
  on public.product_media for select
  using (public.has_any_role(array['content_editor','admin']::public.app_role[]));

create policy "product_documents: public read via product"
  on public.product_documents for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_published and p.review_status = 'approved'
    )
  );
create policy "product_documents: staff read all"
  on public.product_documents for select
  using (public.has_any_role(array['content_editor','admin']::public.app_role[]));

create policy "product_compliance_checks: staff read all"
  on public.product_compliance_checks for select
  using (public.has_any_role(array['content_editor','admin']::public.app_role[]));

-- ────────────────────────────
-- Catalog writes: staff only via app_role
-- ────────────────────────────
create policy "brands: staff write"
  on public.brands for all
  using (public.has_any_role(array['content_editor','admin']::public.app_role[]))
  with check (public.has_any_role(array['content_editor','admin']::public.app_role[]));

create policy "categories: staff write"
  on public.categories for all
  using (public.has_any_role(array['content_editor','admin']::public.app_role[]))
  with check (public.has_any_role(array['content_editor','admin']::public.app_role[]));

create policy "products: staff write"
  on public.products for all
  using (public.has_any_role(array['content_editor','admin']::public.app_role[]))
  with check (public.has_any_role(array['content_editor','admin']::public.app_role[]));

create policy "product_variants: staff write"
  on public.product_variants for all
  using (public.has_any_role(array['content_editor','admin']::public.app_role[]))
  with check (public.has_any_role(array['content_editor','admin']::public.app_role[]));

create policy "product_media: staff write"
  on public.product_media for all
  using (public.has_any_role(array['content_editor','admin']::public.app_role[]))
  with check (public.has_any_role(array['content_editor','admin']::public.app_role[]));

create policy "product_documents: staff write"
  on public.product_documents for all
  using (public.has_any_role(array['content_editor','admin']::public.app_role[]))
  with check (public.has_any_role(array['content_editor','admin']::public.app_role[]));

create policy "product_compliance_checks: staff write"
  on public.product_compliance_checks for all
  using (public.has_any_role(array['content_editor','admin']::public.app_role[]))
  with check (public.has_any_role(array['content_editor','admin']::public.app_role[]));

create policy "economic_operators: staff write"
  on public.economic_operators for all
  using (public.has_any_role(array['content_editor','admin']::public.app_role[]))
  with check (public.has_any_role(array['content_editor','admin']::public.app_role[]));

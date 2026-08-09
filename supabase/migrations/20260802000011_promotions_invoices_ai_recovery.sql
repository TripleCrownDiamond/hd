-- Promotions, invoice numbering, FAQ/RAG chat and consented cart recovery.
-- Secrets remain in server environment variables. Public clients never read
-- promotion codes, conversations, abandoned carts or notification payloads.

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  code citext not null unique,
  name text not null,
  description text,
  discount_type text not null check (discount_type in ('percentage','fixed')),
  -- percentage uses basis points: 1500 = 15.00 %. fixed uses EUR cents.
  discount_value integer not null check (discount_value > 0),
  scope text not null default 'all' check (scope in ('all','products','categories')),
  minimum_subtotal_cents integer not null default 0 check (minimum_subtotal_cents >= 0),
  maximum_discount_cents integer check (maximum_discount_cents is null or maximum_discount_cents > 0),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  times_redeemed integer not null default 0 check (times_redeemed >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_type <> 'percentage' or discount_value <= 10000),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create index promotions_active_window_idx
  on public.promotions (starts_at, ends_at)
  where is_active;
create trigger promotions_set_updated_at before update on public.promotions
  for each row execute function public.set_updated_at();

create table public.promotion_products (
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  primary key (promotion_id, product_id)
);
create index promotion_products_product_idx on public.promotion_products(product_id);

create table public.promotion_categories (
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (promotion_id, category_id)
);
create index promotion_categories_category_idx on public.promotion_categories(category_id);

alter table public.orders
  add column if not exists discount_cents integer not null default 0 check (discount_cents >= 0),
  add column if not exists promotion_code citext;
alter table public.order_items
  add column if not exists discount_cents integer not null default 0 check (discount_cents >= 0);

create table public.promotion_redemptions (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.promotions(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete restrict,
  customer_email citext not null,
  discount_cents integer not null check (discount_cents > 0),
  redeemed_at timestamptz not null default now()
);
create index promotion_redemptions_promotion_idx
  on public.promotion_redemptions(promotion_id, redeemed_at desc);

create or replace function public.redeem_promotion(
  p_promotion_id uuid,
  p_order_id uuid,
  p_customer_email citext,
  p_discount_cents integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_discount_cents <= 0 then
    raise exception 'discount must be positive';
  end if;

  update public.promotions
  set times_redeemed = times_redeemed + 1
  where id = p_promotion_id
    and is_active
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
    and (usage_limit is null or times_redeemed < usage_limit);

  if not found then
    raise exception 'promotion unavailable';
  end if;

  insert into public.promotion_redemptions(
    promotion_id, order_id, customer_email, discount_cents
  ) values (p_promotion_id, p_order_id, p_customer_email, p_discount_cents);
end;
$$;
revoke all on function public.redeem_promotion(uuid,uuid,citext,integer) from public, anon, authenticated;
grant execute on function public.redeem_promotion(uuid,uuid,citext,integer) to service_role;

create table public.invoice_sequences (
  fiscal_year integer not null,
  document_kind text not null check (document_kind in ('proforma','invoice','cancellation','credit_note')),
  last_value integer not null default 0 check (last_value >= 0),
  updated_at timestamptz not null default now(),
  primary key (fiscal_year, document_kind)
);

alter table public.site_settings
  add column if not exists logo_url text,
  add column if not exists invoice_prefix text not null default 'RE',
  add column if not exists invoice_footer text,
  add column if not exists invoice_payment_terms_days integer not null default 14
    check (invoice_payment_terms_days between 0 and 365),
  add column if not exists invoice_trigger text not null default 'manual'
    check (invoice_trigger in ('manual','order','payment','shipment')),
  add column if not exists chatbot_enabled boolean not null default false,
  add column if not exists chatbot_name text not null default 'HOLZKRAFT Assistent',
  add column if not exists support_hours text,
  add column if not exists cart_recovery_enabled boolean not null default false,
  add column if not exists cart_recovery_first_delay_minutes integer not null default 60
    check (cart_recovery_first_delay_minutes between 30 and 10080),
  add column if not exists cart_recovery_second_delay_minutes integer not null default 1440
    check (cart_recovery_second_delay_minutes between 60 and 20160),
  add column if not exists cart_recovery_max_reminders smallint not null default 2
    check (cart_recovery_max_reminders between 1 and 3);

create or replace function public.create_invoice_draft(
  p_order_id uuid,
  p_kind text,
  p_snapshot jsonb,
  p_net_cents integer,
  p_tax_cents integer,
  p_gross_cents integer,
  p_due_date date
) returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year integer := extract(year from current_date)::integer;
  v_sequence integer;
  v_prefix text;
  v_invoice public.invoices;
begin
  if p_kind not in ('proforma','invoice','cancellation','credit_note') then
    raise exception 'invalid invoice kind';
  end if;
  if p_net_cents < 0 or p_tax_cents < 0 or p_gross_cents < 0 then
    raise exception 'invalid invoice amount';
  end if;

  insert into public.invoice_sequences(fiscal_year, document_kind, last_value)
  values (v_year, p_kind, 1)
  on conflict (fiscal_year, document_kind)
  do update set last_value = public.invoice_sequences.last_value + 1,
                updated_at = now()
  returning last_value into v_sequence;

  select coalesce(nullif(trim(invoice_prefix), ''), 'RE')
    into v_prefix from public.site_settings where id = 1;

  insert into public.invoices(
    order_id, invoice_number, kind, status, currency,
    net_cents, tax_cents, gross_cents, snapshot, due_date
  ) values (
    p_order_id,
    v_prefix || '-' || v_year || '-' || lpad(v_sequence::text, 6, '0'),
    p_kind,
    'draft',
    'EUR',
    p_net_cents,
    p_tax_cents,
    p_gross_cents,
    p_snapshot,
    p_due_date
  ) returning * into v_invoice;
  return v_invoice;
end;
$$;
revoke all on function public.create_invoice_draft(uuid,text,jsonb,integer,integer,integer,date) from public, anon, authenticated;
grant execute on function public.create_invoice_draft(uuid,text,jsonb,integer,integer,integer,date) to service_role;

create table public.faq_entries (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text not null default 'Allgemein',
  product_id uuid references public.products(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  position integer not null default 0,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index faq_entries_public_idx on public.faq_entries(category, position, updated_at desc)
  where status = 'published';
create index faq_entries_product_idx on public.faq_entries(product_id)
  where product_id is not null and status = 'published';
create index faq_entries_search_idx on public.faq_entries
  using gin (to_tsvector('german', question || ' ' || answer));
create trigger faq_entries_set_updated_at before update on public.faq_entries
  for each row execute function public.set_updated_at();

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  session_token_hash text not null unique,
  profile_id uuid references public.profiles(id) on delete set null,
  customer_email citext,
  status text not null default 'ai_active'
    check (status in ('ai_active','waiting_for_customer','human_requested','queued','assigned','closed')),
  context_path text,
  summary text,
  assigned_to uuid references public.profiles(id) on delete set null,
  last_message_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index conversations_queue_idx on public.conversations(status, last_message_at desc);
create trigger conversations_set_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();

create table public.conversation_messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system','human')),
  content text not null check (length(content) between 1 and 12000),
  sources jsonb not null default '[]'::jsonb,
  model text,
  confidence numeric(4,3) check (confidence is null or confidence between 0 and 1),
  created_at timestamptz not null default now()
);
create index conversation_messages_conversation_idx
  on public.conversation_messages(conversation_id, created_at desc);

create table public.abandoned_carts (
  id uuid primary key default gen_random_uuid(),
  session_token_hash text not null unique,
  customer_email citext not null,
  customer_name text,
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  currency text not null default 'EUR' check (currency = 'EUR'),
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  promotion_code citext,
  consent_at timestamptz not null,
  last_activity_at timestamptz not null default now(),
  next_reminder_at timestamptz,
  reminder_count smallint not null default 0 check (reminder_count between 0 and 3),
  status text not null default 'active'
    check (status in ('active','recovered','converted','unsubscribed','expired')),
  converted_order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index abandoned_carts_due_idx on public.abandoned_carts(next_reminder_at)
  where status = 'active';
create index abandoned_carts_email_idx on public.abandoned_carts(customer_email, updated_at desc);
create trigger abandoned_carts_set_updated_at before update on public.abandoned_carts
  for each row execute function public.set_updated_at();

create table public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  idempotency_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed','cancelled')),
  attempts smallint not null default 0 check (attempts between 0 and 20),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notification_jobs_due_idx on public.notification_jobs(next_attempt_at, created_at)
  where status in ('pending','failed');
create trigger notification_jobs_set_updated_at before update on public.notification_jobs
  for each row execute function public.set_updated_at();

alter table public.promotions enable row level security;
alter table public.promotion_products enable row level security;
alter table public.promotion_categories enable row level security;
alter table public.promotion_redemptions enable row level security;
alter table public.invoice_sequences enable row level security;
alter table public.faq_entries enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.abandoned_carts enable row level security;
alter table public.notification_jobs enable row level security;

create policy "promotions: admin manage" on public.promotions for all
  using (public.has_role('admin'::public.app_role))
  with check (public.has_role('admin'::public.app_role));
create policy "promotion products: admin manage" on public.promotion_products for all
  using (public.has_role('admin'::public.app_role))
  with check (public.has_role('admin'::public.app_role));
create policy "promotion categories: admin manage" on public.promotion_categories for all
  using (public.has_role('admin'::public.app_role))
  with check (public.has_role('admin'::public.app_role));
create policy "promotion redemptions: finance read" on public.promotion_redemptions for select
  using (public.has_any_role(array['admin','finance','support']::public.app_role[]));
create policy "invoice sequences: finance read" on public.invoice_sequences for select
  using (public.has_any_role(array['admin','finance']::public.app_role[]));
create policy "faq: public read published" on public.faq_entries for select
  using (status = 'published');
create policy "faq: editors manage" on public.faq_entries for all
  using (public.has_any_role(array['admin','content_editor']::public.app_role[]))
  with check (public.has_any_role(array['admin','content_editor']::public.app_role[]));
create policy "conversations: support read" on public.conversations for select
  using (public.has_any_role(array['admin','support']::public.app_role[]));
create policy "conversations: support update" on public.conversations for update
  using (public.has_any_role(array['admin','support']::public.app_role[]))
  with check (public.has_any_role(array['admin','support']::public.app_role[]));
create policy "messages: support read" on public.conversation_messages for select
  using (public.has_any_role(array['admin','support']::public.app_role[]));
create policy "messages: support insert" on public.conversation_messages for insert
  with check (public.has_any_role(array['admin','support']::public.app_role[]));
create policy "abandoned carts: admin/support read" on public.abandoned_carts for select
  using (public.has_any_role(array['admin','support']::public.app_role[]));
create policy "abandoned carts: admin manage" on public.abandoned_carts for all
  using (public.has_role('admin'::public.app_role))
  with check (public.has_role('admin'::public.app_role));
create policy "notification jobs: admin/support read" on public.notification_jobs for select
  using (public.has_any_role(array['admin','support']::public.app_role[]));
create policy "notification jobs: admin manage" on public.notification_jobs for all
  using (public.has_role('admin'::public.app_role))
  with check (public.has_role('admin'::public.app_role));

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('invoices', 'invoices', false, 10485760, array['application/pdf'])
on conflict (id) do update set public = false;

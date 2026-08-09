-- Payment methods the storefront can offer, and how each is configured.
--
-- Only public-safe configuration lives here: an IBAN and a card publishable
-- key are meant to be shown to the customer, so this table keeps the public
-- read policy the rest of the storefront settings use. Secrets — a Stripe
-- secret key, a BTCPay API key — never belong in a public-read row and stay in
-- server environment variables.

create table if not exists public.payment_settings (
  id smallint primary key default 1 check (id = 1),

  -- SEPA bank transfer. Works with no external provider: the customer is shown
  -- the account details and a reference, and the order waits for reconciliation.
  bank_transfer_enabled boolean not null default false,
  bank_account_holder text,
  bank_iban text,
  bank_bic text,
  bank_name text,
  -- Prefix for the payment reference, e.g. "HK" -> "HK-2026-000123".
  bank_reference_prefix text default 'HK',

  -- Crypto, settled through a provider that generates the address and confirms
  -- the payment on-chain. We never hold keys or funds.
  crypto_enabled boolean not null default false,
  crypto_provider text check (crypto_provider in ('btcpay', 'coinbase', 'bitpay')),
  crypto_provider_url text,
  crypto_currencies text[] not null default '{}',
  crypto_note text,

  -- Card, settled through a PSP that tokenises the card in the browser. Only the
  -- publishable key is stored; the secret key stays in the server environment.
  card_enabled boolean not null default false,
  card_provider text check (card_provider in ('stripe', 'mollie', 'adyen')),
  card_publishable_key text,
  card_note text,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create trigger payment_settings_set_updated_at before update on public.payment_settings
  for each row execute function public.set_updated_at();

insert into public.payment_settings(id) values (1) on conflict do nothing;

alter table public.payment_settings enable row level security;

-- Public read: the checkout must know which methods to offer and show the IBAN.
create policy "payment settings: public read"
  on public.payment_settings for select using (true);
create policy "payment settings: admin manage"
  on public.payment_settings for all
  using (public.has_role('admin'::public.app_role))
  with check (public.has_role('admin'::public.app_role));

-- How each order is being paid, recorded when it is placed.
alter table public.orders
  add column if not exists payment_method text
    check (payment_method in ('bank_transfer', 'crypto', 'card')),
  add column if not exists payment_reference text;

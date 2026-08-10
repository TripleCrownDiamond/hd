-- Deposit (Anzahlung) payments and bank-transfer default.
--
-- 1. Bank transfer is switched OFF by default. 20260810000016 enabled it with
--    an explicitly marked placeholder account so the checkout had a method on
--    day one; the shop owner now prefers to switch it on in the admin with a
--    real account. While disabled, no IBAN is shown anywhere (checkout, success
--    page, e-mails, invoice).
-- 2. A deposit payment lets a customer pay a percentage of the order up front
--    by transfer and the rest later. Threshold and percentage are editable in
--    the admin (/admin/zahlungen). The deposit option only appears when the
--    bank transfer is enabled and configured with a real account.

update public.payment_settings
set bank_transfer_enabled = false
where id = 1;

alter table public.payment_settings
  add column if not exists deposit_enabled boolean not null default true,
  add column if not exists deposit_min_cents integer not null default 1000000
    check (deposit_min_cents >= 0),
  add column if not exists deposit_percent integer not null default 30
    check (deposit_percent between 1 and 100);

-- How much of the total was paid up front when the customer chose a deposit.
alter table public.orders
  add column if not exists deposit_cents integer not null default 0;

-- The deposit is settled by transfer, so the payment_method enum gains it.
alter table public.orders
  drop constraint if exists orders_payment_method_check;
alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method in ('bank_transfer', 'crypto', 'card', 'deposit'));

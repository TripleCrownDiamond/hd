-- Standalone invoices: an invoice may exist without an order.
--
-- The admin can raise an invoice for a customer directly, with lines taken
-- from the catalogue or entered freely. `order_id` becomes nullable; an
-- invoice with a null order simply has no link to the orders table. The
-- customer-own RLS policy already fails safely for a null order_id (the
-- EXISTS subquery matches nothing), so a standalone invoice is never exposed
-- to a logged-in customer account.

alter table public.invoices
  alter column order_id drop not null;

-- Accept a NULL order id. plpgsql parameters are nullable by default, but
-- the draft insert is written to make the intent explicit.
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

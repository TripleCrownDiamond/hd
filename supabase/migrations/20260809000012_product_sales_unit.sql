-- What quantity a product's price actually buys, and the unit its Grundpreis
-- is quoted in.
--
-- Until now `price_cents_public` was a bare number and the quantity next to it
-- came from `extra.unit_de` — free text copied off the supplier page. Nothing
-- tied the two together, so a pallet price could sit under a "15 kg" label and
-- read as 33.000 €/t without anything flagging it.
--
-- These three columns close that gap and are also what § 4 PAngV requires:
-- goods sold by weight must carry a Grundpreis. For solid fuels the trade
-- quotes it per tonne, which is why 't' is the default reference unit here.
--
-- The Grundpreis itself is never stored — it is derived from the price and the
-- quantity at read time, so it cannot drift away from the price it describes.

alter table public.products
  -- How much the price covers, e.g. 990 (kg) or 3 (Schüttraummeter).
  add column if not exists quantity_amount numeric(12, 3)
    check (quantity_amount is null or quantity_amount > 0),

  -- Unit that `quantity_amount` is counted in.
  --   kg  Kilogramm          srm Schüttraummeter    l   Liter
  --   t   Tonne              rm  Raummeter          stk Stück
  --                          fm  Festmeter
  add column if not exists quantity_unit text
    check (quantity_unit is null or quantity_unit in
      ('kg', 't', 'srm', 'rm', 'fm', 'l', 'stk')),

  -- Reference unit the Grundpreis is displayed in. Mass units convert freely
  -- between each other; the volume units do not (srm -> fm depends on the
  -- species and the split), so those must match `quantity_unit`.
  add column if not exists base_price_unit text
    check (base_price_unit is null or base_price_unit in
      ('kg', '100kg', 't', 'srm', 'rm', 'fm', 'l', 'stk'));

comment on column public.products.quantity_amount is
  'Quantity covered by price_cents_public. With quantity_unit, yields the Grundpreis.';
comment on column public.products.base_price_unit is
  'Reference unit for the § 4 PAngV Grundpreis. Solid fuels are quoted per t.';

-- Backfill the obvious case: a declared net weight and no quantity yet. Those
-- rows were imported with weight_kg from the supplier feed.
update public.products
set quantity_amount = weight_kg,
    quantity_unit = 'kg',
    base_price_unit = 't'
where quantity_amount is null
  and weight_kg is not null
  and weight_kg > 0
  and kind in ('pellet', 'briquette', 'kindling', 'coal', 'wood');

-- Coal and charcoal as a product kind of their own.
--
-- They were arriving as `accessory` — the catch-all — and landing in
-- Ofenzubehör next to flue pipes and gloves. Coal is a fuel: it needs its own
-- category so a buyer can compare Körnung, Heizwert and Gebindegröße the same
-- way they compare pellets.
--
-- `add value` is committed on its own: PostgreSQL cannot use a new enum label
-- inside the transaction that created it, so the category row is inserted by
-- the companion migration 20260802000008_coal_category.sql.

alter type public.product_kind add value if not exists 'coal';

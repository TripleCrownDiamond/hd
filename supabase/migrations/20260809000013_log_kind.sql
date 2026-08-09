-- Stammholz, Meterholz and Rundholz as a product kind of their own.
--
-- `wood` covers split, stove-length firewood sold by the Schüttraummeter. Logs
-- are a different purchase: metre lengths or whole trunks, sold by the Ster or
-- the Festmeter, usually self-collected or dropped by crane, and bought by
-- people who split their own. Filing them under `wood` puts a 3-metre trunk in
-- the same list as a 25 cm kiln-dried sack and makes both filters useless.
--
-- `add value` is committed on its own: PostgreSQL cannot use a new enum label
-- inside the transaction that created it, so the category row is inserted by
-- the companion migration 20260809000014_log_category.sql.

alter type public.product_kind add value if not exists 'log';

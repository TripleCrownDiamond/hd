-- Local dev seed. NEVER used in production.

-- Categories
insert into public.categories (slug, name, position, is_published) values
  ('brennholz',    'Brennholz',   1, true),
  ('kaminoefen',   'Kaminöfen',   2, true),
  ('holzpellets',  'Holzpellets', 3, true),
  ('holzbriketts', 'Holzbriketts', 4, true),
  ('anzuendholz',  'Anzündholz',   5, true),
  ('zubehoer',     'Ofenzubehör',  6, true)
on conflict (slug) do nothing;

-- Brands (start with Spartherm)
insert into public.brands (slug, name, country_code, website) values
  ('spartherm', 'Spartherm', 'DE', 'https://www.spartherm.com')
on conflict (slug) do nothing;

-- Spartherm as its own economic operator (manufacturer)
insert into public.economic_operators (legal_name, role, address, postal_code, city, country_code, contact_email)
select
  'Spartherm Feuerungstechnik GmbH',
  'manufacturer',
  'Maschweg 38',
  '49324',
  'Melle',
  'DE',
  'info@spartherm.com'
where not exists (
  select 1 from public.economic_operators where legal_name = 'Spartherm Feuerungstechnik GmbH'
);

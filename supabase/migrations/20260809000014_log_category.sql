-- The storefront category for the `log` kind added in 20260809000013.

insert into public.categories (slug, name, short_description, position, is_published)
values (
  'stammholz',
  'Stammholz & Meterholz',
  'Rundholz, Meterscheite und Polterholz mit deklarierter Länge, Holzart und Menge in Ster oder Festmeter — zum Selberspalten.',
  40,
  true
)
on conflict (slug) do update
  set name = excluded.name,
      short_description = excluded.short_description,
      is_published = true;

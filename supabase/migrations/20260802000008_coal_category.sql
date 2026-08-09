-- The storefront category for the `coal` kind added in 20260802000007.

insert into public.categories (slug, name, short_description, position, is_published)
values (
  'kohle',
  'Kohle & Grillkohle',
  'Braunkohle- und Steinkohlebriketts, Anthrazit und Grillkohle mit deklarierter Körnung und Gebindegröße.',
  60,
  true
)
on conflict (slug) do update
  set name = excluded.name,
      short_description = excluded.short_description,
      is_published = true;

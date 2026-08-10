-- TikTok alongside the other social profiles.
--
-- The shop's audience finds firewood suppliers there as much as on Facebook,
-- and the footer already had a slot for every other network. Nullable and
-- additive, so a database that has not run this yet keeps working — the
-- storefront reads site_settings with `*` and falls back to the code profile.

alter table public.site_settings
  add column if not exists social_tiktok text;

comment on column public.site_settings.social_tiktok is
  'Full profile URL, e.g. https://www.tiktok.com/@handle. Empty hides the icon.';

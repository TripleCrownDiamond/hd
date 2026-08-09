-- Initial extensions and shared utilities.

-- UUID generation with gen_random_uuid()
create extension if not exists "pgcrypto";
-- Trigram search for product name suggestions
create extension if not exists "pg_trgm";
-- Case-insensitive text
create extension if not exists "citext";

-- Shared updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at is
  'Standard trigger: keeps updated_at in sync on any row update.';

-- Application role enum used across the RBAC.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum (
      'customer',
      'support',
      'logistics',
      'content_editor',
      'finance',
      'admin'
    );
  end if;
end
$$;

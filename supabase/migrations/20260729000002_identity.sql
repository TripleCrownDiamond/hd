-- Identity: profiles, addresses, roles, permissions, audit.

-- 1. profiles (1-1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  first_name text,
  last_name text,
  phone text,
  locale text not null default 'de-DE',
  marketing_opt_in boolean not null default false,
  marketing_opt_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

comment on table public.profiles is
  'Customer profile — one row per auth.users. Never store PAN, CVV or password data here.';

-- 2. addresses
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('shipping', 'billing')),
  is_default boolean not null default false,
  company text,
  first_name text not null,
  last_name text not null,
  line1 text not null,
  line2 text,
  postal_code text not null,
  city text not null,
  country text not null default 'DE',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index addresses_profile_id_idx on public.addresses(profile_id);
create trigger addresses_set_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();

-- Only one default per (profile, kind)
create unique index addresses_one_default_per_kind
  on public.addresses(profile_id, kind)
  where is_default;

-- 3. user_roles (many-to-many via a first-class row)
create table public.user_roles (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references public.profiles(id),
  primary key (profile_id, role)
);

-- 4. audit_logs — append-only ledger. RLS blocks writes from clients.
create table public.audit_logs (
  id bigserial primary key,
  at timestamptz not null default now(),
  actor_id uuid references public.profiles(id),
  actor_role public.app_role,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb
);
create index audit_logs_at_idx on public.audit_logs(at desc);
create index audit_logs_entity_idx on public.audit_logs(entity, entity_id);

comment on table public.audit_logs is
  'Append-only audit. Never expose full rows to the client — filter through server actions.';

-- 5. Helper: does the caller have a role?
create or replace function public.has_role(target public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where profile_id = auth.uid()
      and role = target
  );
$$;

create or replace function public.has_any_role(targets public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where profile_id = auth.uid()
      and role = any(targets)
  );
$$;

-- 6. Auto-create a profile row after signup.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

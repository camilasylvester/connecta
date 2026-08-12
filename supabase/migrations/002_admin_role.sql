-- Add admin role + allowlist + full-access RLS

DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE 'admin';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

create table if not exists public.admin_allowlist (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.admin_allowlist enable row level security;

drop policy if exists "Admins can read allowlist" on public.admin_allowlist;
create policy "Admins can read allowlist"
  on public.admin_allowlist for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_brand()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('brand', 'admin')
  );
$$;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role then
    if current_setting('app.allow_role_change', true) = 'on' then
      return new;
    end if;
    raise exception 'No se puede cambiar el rol del perfil';
  end if;
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_role public.user_role;
  requested text;
begin
  requested := coalesce(new.raw_user_meta_data->>'role', 'creator');

  if requested = 'admin' then
    if exists (
      select 1 from public.admin_allowlist a
      where lower(a.email) = lower(new.email)
    ) then
      chosen_role := 'admin';
    else
      chosen_role := 'creator';
    end if;
  elsif requested = 'brand' then
    chosen_role := 'brand';
  else
    chosen_role := 'creator';
  end if;

  insert into public.profiles (id, role, display_name, handle, brand_name)
  values (
    new.id,
    chosen_role,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'handle',
    new.raw_user_meta_data->>'brand_name'
  );

  return new;
end;
$$;

create or replace function public.promote_admin_by_email(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_allowlist (email)
  values (lower(target_email))
  on conflict (email) do nothing;

  perform set_config('app.allow_role_change', 'on', true);

  update public.profiles p
  set role = 'admin',
      display_name = coalesce(nullif(p.display_name, ''), 'Admin CONNECTA'),
      updated_at = now()
  from auth.users u
  where p.id = u.id
    and lower(u.email) = lower(target_email);
end;
$$;

drop policy if exists "Admin can read all profiles" on public.profiles;
create policy "Admin can read all profiles"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "Admin can read all events" on public.events;
create policy "Admin can read all events"
  on public.events for select
  using (public.is_admin());

drop policy if exists "Admin can manage all events" on public.events;
create policy "Admin can manage all events"
  on public.events for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin can read all applications" on public.applications;
create policy "Admin can read all applications"
  on public.applications for select
  using (public.is_admin());

drop policy if exists "Admin can update all applications" on public.applications;
create policy "Admin can update all applications"
  on public.applications for update
  using (public.is_admin())
  with check (public.is_admin());

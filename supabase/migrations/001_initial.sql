-- CONNECTA initial schema
create extension if not exists "pgcrypto";

create type public.user_role as enum ('brand', 'creator');
create type public.application_status as enum ('pending', 'approved', 'rejected');
create type public.event_status as enum ('draft', 'active', 'closed');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  display_name text,
  handle text,
  category text,
  followers integer default 0,
  city text,
  brand_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  location text,
  event_date date,
  quota integer not null default 50,
  invite_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  status public.event_status not null default 'active',
  category text,
  profile_sought text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  creator_id uuid not null references public.profiles (id) on delete cascade,
  status public.application_status not null default 'pending',
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, creator_id)
);

create index applications_event_id_idx on public.applications (event_id);
create index applications_creator_id_idx on public.applications (creator_id);
create index events_brand_id_idx on public.events (brand_id);
create index events_invite_token_idx on public.events (invite_token);

-- Auto-create profile on signup from user metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_role public.user_role;
begin
  chosen_role := coalesce(
    (new.raw_user_meta_data->>'role')::public.user_role,
    'creator'
  );

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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_brand()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'brand'
  );
$$;

create or replace function public.owns_event(eid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.events
    where id = eid and brand_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.applications enable row level security;

-- Profiles policies
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Brand can read creator profiles of their applicants"
  on public.profiles for select
  using (
    public.is_brand()
    and exists (
      select 1
      from public.applications a
      join public.events e on e.id = a.event_id
      where a.creator_id = profiles.id
        and e.brand_id = auth.uid()
    )
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Prevent privilege escalation via role changes
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'No se puede cambiar el rol del perfil';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- Events policies
create policy "Brand can manage own events"
  on public.events for all
  using (brand_id = auth.uid())
  with check (brand_id = auth.uid() and public.is_brand());

create policy "Authenticated users can read active events"
  on public.events for select
  to authenticated
  using (status = 'active');

create policy "Creators can read events they applied to"
  on public.events for select
  using (
    exists (
      select 1 from public.applications a
      where a.event_id = events.id and a.creator_id = auth.uid()
    )
  );

-- Public lookup by invite token (for /aplicar/[token] before/after login)
create or replace function public.get_event_by_invite_token(token text)
returns setof public.events
language sql
security definer
set search_path = public
as $$
  select * from public.events
  where invite_token = token
    and status in ('active', 'closed');
$$;

grant execute on function public.get_event_by_invite_token(text) to anon, authenticated;

-- Applications policies
create policy "Creators can insert own applications"
  on public.applications for insert
  with check (
    creator_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'creator'
    )
    and exists (
      select 1 from public.events e
      where e.id = event_id and e.status = 'active'
    )
  );

create policy "Creators can read own applications"
  on public.applications for select
  using (creator_id = auth.uid());

create policy "Brand can read applications on own events"
  on public.applications for select
  using (public.owns_event(event_id));

create policy "Brand can update applications on own events"
  on public.applications for update
  using (public.owns_event(event_id))
  with check (public.owns_event(event_id));

create policy "Creators can update own pending applications message"
  on public.applications for update
  using (creator_id = auth.uid() and status = 'pending')
  with check (creator_id = auth.uid() and status = 'pending');

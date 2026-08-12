-- CONNECTA on Neon (Clerk auth — profiles.id = Clerk user id)

create type user_role as enum ('admin', 'brand', 'creator');
create type application_status as enum ('pending', 'approved', 'rejected');
create type event_status as enum ('draft', 'active', 'closed');

create table profiles (
  id text primary key,
  role user_role not null,
  display_name text,
  handle text,
  category text,
  followers integer default 0,
  city text,
  brand_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table admin_allowlist (
  email text primary key,
  created_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  brand_id text not null references profiles (id) on delete cascade,
  title text not null,
  description text,
  location text,
  event_date text,
  quota integer not null default 50,
  invite_token text not null unique,
  status event_status not null default 'active',
  category text,
  profile_sought text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  creator_id text not null references profiles (id) on delete cascade,
  status application_status not null default 'pending',
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index applications_event_creator_uidx on applications (event_id, creator_id);
create index events_brand_id_idx on events (brand_id);
create index events_invite_token_idx on events (invite_token);
create index applications_event_id_idx on applications (event_id);
create index applications_creator_id_idx on applications (creator_id);

-- Promote admin after signup:
-- insert into admin_allowlist (email) values ('tu@email.com');
-- update profiles set role = 'admin' where lower(email) = 'tu@email.com';

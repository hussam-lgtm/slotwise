-- ============================================================
-- SlotWise — full database schema
-- Run this in the Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- ORGANISATIONS
-- One row per agency
-- ============================================================
create table organisations (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text unique not null,           -- used in URLs
  logo_url    text,
  created_at  timestamptz default now()
);

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table users (
  id              uuid primary key references auth.users on delete cascade,
  organisation_id uuid references organisations(id) on delete cascade,
  role            text not null check (role in ('admin', 'member', 'client')),
  full_name       text,
  avatar_url      text,
  created_at      timestamptz default now()
);

-- Auto-create a user row when someone signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- CLIENTS
-- Each client is a company/person the agency manages
-- ============================================================
create table clients (
  id              uuid primary key default uuid_generate_v4(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  user_id         uuid references users(id) on delete set null,  -- if they have a login
  name            text not null,
  email           text,
  company         text,
  avatar_url      text,
  notes           text,
  created_at      timestamptz default now()
);

-- ============================================================
-- CALENDAR CONNECTIONS
-- Stores OAuth tokens for a client's calendar
-- ============================================================
create table calendar_connections (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid not null references clients(id) on delete cascade,
  provider        text not null check (provider in ('google', 'microsoft')),
  access_token    text not null,             -- encrypt at rest in production
  refresh_token   text,
  token_expiry    timestamptz,
  calendar_id     text,                      -- e.g. primary, a specific cal id
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (client_id, provider)
);

-- ============================================================
-- BOOKING LINKS
-- Each link = one bookable meeting type for a client
-- ============================================================
create table booking_links (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid not null references clients(id) on delete cascade,
  created_by      uuid not null references users(id),
  name            text not null,             -- e.g. "30-min discovery call"
  slug            text unique not null,       -- /book/<slug>
  description     text,
  duration_mins   int not null default 30,
  buffer_before   int default 0,             -- minutes
  buffer_after    int default 15,            -- minutes
  timezone        text default 'UTC',
  availability    jsonb,                     -- weekly schedule {mon:[{start,end}]}
  is_active       bool default true,
  max_bookings_per_day int,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- BOOKINGS
-- A confirmed appointment on a booking link
-- ============================================================
create table bookings (
  id               uuid primary key default uuid_generate_v4(),
  booking_link_id  uuid not null references booking_links(id) on delete cascade,
  booker_name      text not null,
  booker_email     text not null,
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  timezone         text not null,
  status           text not null default 'confirmed'
                   check (status in ('confirmed', 'cancelled', 'rescheduled')),
  calendar_event_id text,                   -- returned by Google/Microsoft API
  notes            text,
  created_at       timestamptz default now()
);

-- ============================================================
-- INVITATIONS
-- Agency invites a client via email
-- ============================================================
create table invitations (
  id              uuid primary key default uuid_generate_v4(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  invited_by      uuid not null references users(id),
  email           text not null,
  role            text not null check (role in ('member', 'client')),
  client_id       uuid references clients(id),  -- pre-linked if inviting a client
  token           text unique not null default encode(gen_random_bytes(32), 'hex'),
  accepted_at     timestamptz,
  expires_at      timestamptz default (now() + interval '7 days'),
  created_at      timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table organisations         enable row level security;
alter table users                 enable row level security;
alter table clients               enable row level security;
alter table calendar_connections  enable row level security;
alter table booking_links         enable row level security;
alter table bookings              enable row level security;
alter table invitations           enable row level security;

-- Helper: get the current user's row
create or replace function auth_user()
returns users language sql security definer stable as $$
  select * from users where id = auth.uid();
$$;

-- ORGANISATIONS: members/admins can read their own org
create policy "org read own" on organisations
  for select using (
    id = (select organisation_id from users where id = auth.uid())
  );

create policy "org update admin" on organisations
  for update using (
    id = (select organisation_id from users where id = auth.uid())
    and (select role from users where id = auth.uid()) = 'admin'
  );

-- USERS: can read users in same org
create policy "users read same org" on users
  for select using (
    organisation_id = (select organisation_id from users where id = auth.uid())
    or id = auth.uid()
  );

create policy "users update own" on users
  for update using (id = auth.uid());

-- CLIENTS: agency members see all clients in their org; clients see only themselves
create policy "clients org access" on clients
  for select using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );

create policy "clients org write" on clients
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
    and (select role from users where id = auth.uid()) in ('admin', 'member')
  );

-- CALENDAR_CONNECTIONS: agency team + owning client
create policy "cal_conn read" on calendar_connections
  for select using (
    client_id in (
      select id from clients
      where organisation_id = (select organisation_id from users where id = auth.uid())
    )
    or client_id in (select id from clients where user_id = auth.uid())
  );

create policy "cal_conn write" on calendar_connections
  for all using (
    client_id in (
      select id from clients
      where organisation_id = (select organisation_id from users where id = auth.uid())
    )
    or client_id in (select id from clients where user_id = auth.uid())
  );

-- BOOKING_LINKS: agency team can write; clients can read their own; public can read active links
create policy "booking_links agency write" on booking_links
  for all using (
    client_id in (
      select id from clients
      where organisation_id = (select organisation_id from users where id = auth.uid())
    )
    and (select role from users where id = auth.uid()) in ('admin', 'member')
  );

create policy "booking_links client read" on booking_links
  for select using (
    client_id in (select id from clients where user_id = auth.uid())
  );

create policy "booking_links public read" on booking_links
  for select using (is_active = true);

-- BOOKINGS: agency + client can read; anyone can insert (public booking)
create policy "bookings read" on bookings
  for select using (
    booking_link_id in (
      select bl.id from booking_links bl
      join clients c on c.id = bl.client_id
      where c.organisation_id = (select organisation_id from users where id = auth.uid())
         or c.user_id = auth.uid()
    )
  );

create policy "bookings insert public" on bookings
  for insert with check (
    booking_link_id in (select id from booking_links where is_active = true)
  );

-- ============================================================
-- INDEXES
-- ============================================================
create index on clients (organisation_id);
create index on booking_links (client_id);
create index on booking_links (slug);
create index on bookings (booking_link_id);
create index on bookings (starts_at);
create index on calendar_connections (client_id);

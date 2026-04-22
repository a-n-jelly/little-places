-- Little Places — Supabase Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable pgvector extension for future semantic search
create extension if not exists vector;

-- Places table
create table if not exists places (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  type              text not null,
  address           text not null,
  description       text not null,
  stages            text[] default '{}',
  child_friendly_features text[] default '{}',
  tags              text[] default '{}',       -- unused, kept for schema compatibility
  lat               float,
  lng               float,
  submitted_by      text,
  rating            float default 0,

  -- AI fields (populated by background job)
  search_summary    text,
  embedding         vector(1536),
  embedding_status  text default 'pending' check (embedding_status in ('pending', 'complete', 'failed')),

  is_seed           boolean default false,
  created_at        timestamptz default now()
);

-- Index for fast embedding status lookups (background job query)
create index if not exists idx_places_embedding_status
  on places (embedding_status)
  where embedding_status = 'pending';

-- Index for full text search fallback
create index if not exists idx_places_name_description
  on places using gin(to_tsvector('english', name || ' ' || description));

-- Row Level Security — public read, anyone can insert
alter table places enable row level security;

drop policy if exists "Anyone can read places" on places;
create policy "Anyone can read places"
  on places for select
  using (true);

drop policy if exists "Anyone can submit a place" on places;
create policy "Anyone can submit a place"
  on places for insert
  with check (true);

-- Only service role (background job) can update
drop policy if exists "Service role can update places" on places;
create policy "Service role can update places"
  on places for update
  using (auth.role() = 'service_role');

-- Events table
create table if not exists events (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  place_id      uuid references places(id) on delete cascade,
  day_of_week   text,           -- for recurring events (e.g. 'Monday')
  time          text,           -- e.g. '10:00 AM'
  age_range     text[] default '{}',
  cost          text,
  recurrence    text check (recurrence in ('weekly', 'monthly', 'one-off')),
  date          date,           -- for one-off events
  description   text,
  is_seed       boolean default false,
  created_at    timestamptz default now()
);

-- Index for querying events by place
create index if not exists idx_events_place_id
  on events (place_id);

-- Index for querying by day of week (recurring events)
create index if not exists idx_events_day_of_week
  on events (day_of_week)
  where day_of_week is not null;

-- Index for querying one-off events by date
create index if not exists idx_events_date
  on events (date)
  where date is not null;

-- Row Level Security — public read, anyone can insert
alter table events enable row level security;

drop policy if exists "Anyone can read events" on events;
create policy "Anyone can read events"
  on events for select
  using (true);

drop policy if exists "Anyone can submit an event" on events;
create policy "Anyone can submit an event"
  on events for insert
  with check (true);

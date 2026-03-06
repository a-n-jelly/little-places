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
  accessibility     text[] default '{}',
  tags              text[] default '{}',
  lat               float,
  lng               float,
  submitted_by      text,
  rating            float default 0,

  -- AI fields (populated by background job)
  search_summary    text,
  embedding         vector(1536),
  embedding_status  text default 'pending' check (embedding_status in ('pending', 'complete', 'failed')),

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

create policy "Anyone can read places"
  on places for select
  using (true);

create policy "Anyone can submit a place"
  on places for insert
  with check (true);

-- Only service role (background job) can update
create policy "Service role can update places"
  on places for update
  using (auth.role() = 'service_role');

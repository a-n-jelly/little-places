-- T33: Replace description input with tips; derive description via AI
-- 1. Relax NOT NULL on places.description so places can be submitted before AI generates one.
-- 2. Add tips table for community-contributed child-friendly insights.

alter table places alter column description drop not null;

create table if not exists tips (
  id           uuid primary key default gen_random_uuid(),
  place_id     uuid references places(id) on delete cascade not null,
  tip_text     text not null,
  display_name text,           -- optional; persisted in user's localStorage
  created_at   timestamptz default now()
);

create index if not exists idx_tips_place_id on tips (place_id);

alter table tips enable row level security;

drop policy if exists "tips_read" on tips;
create policy "tips_read" on tips for select using (true);

drop policy if exists "tips_insert" on tips;
create policy "tips_insert" on tips for insert with check (true);

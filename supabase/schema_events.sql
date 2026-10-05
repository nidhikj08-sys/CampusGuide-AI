-- CampusGuide: Events Schema
-- Run in Supabase SQL Editor after schema.sql and schema_rooms.sql.
-- Safe to re-run.

-- ============================================================
-- EVENTS TABLE
-- ============================================================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_type text not null default 'other' check (event_type in (
    'college_fest', 'hackathon', 'workshop', 'seminar', 'sports', 'cultural', 'exam', 'other'
  )),
  event_date date not null,
  start_time time not null,
  end_time time not null,
  location text,
  organizer text,
  status text not null default 'upcoming' check (status in ('upcoming', 'today', 'past')),
  target_roles text[] default '{"student","faculty","admin"}',
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.events enable row level security;

-- Everyone can view events
create policy "events read all" on public.events
  for select using (true);

-- Only admins can insert, update, delete events
create policy "admin manage events" on public.events
  for all using (public.my_role() = 'admin')
  with check (public.my_role() = 'admin');

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_events_date on public.events(event_date, status);
create index if not exists idx_events_type on public.events(event_type);

-- ============================================================
-- updated_at TRIGGER
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_touch_updated_at on public.events;
create trigger events_touch_updated_at
  before update on public.events
  for each row execute function public.touch_updated_at();

-- ============================================================
-- REALTIME
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'events'
  ) then
    alter publication supabase_realtime add table public.events;
  end if;
end $$;

-- CampusGuide: Student Timetable Schema
-- Run in Supabase SQL Editor after schema.sql and schema_rooms.sql.
-- Safe to re-run (all statements are idempotent).

-- ============================================
-- 1. PROFILE COLUMNS NEEDED FOR TIMETABLE LOOKUP
--    year + branch + section + semester
-- ============================================
alter table public.profiles add column if not exists branch text;
alter table public.profiles add column if not exists semester text;

-- ============================================
-- 2. VALUE NORMALIZATION HELPERS
--    The app stores human-readable profile values such as
--    year = "3rd Year" and semester = "5th". The timetable stores
--    plain integers so lookups are exact and indexable.
-- ============================================

-- "3rd Year" / "Year 3" / "3"  ->  3
-- "5th" / "Semester 5" / "5"  ->  5
create or replace function public.cg_num(v text)
returns integer
language sql
immutable
as $$
  select nullif(regexp_replace(coalesce(v, ''), '\D', '', 'g'), '')::integer;
$$;

-- Resolves a canonical branch code for a profile.
-- Prefers the explicit `branch` column so the admin stays in control.
-- Falls back to keyword matching on `department`, then to the
-- uppercased department text as a last resort.
create or replace function public.cg_branch_code(explicit_code text, dept text)
returns text
language sql
immutable
as $$
  select nullif(
    upper(
      btrim(
        coalesce(
          nullif(btrim(coalesce(explicit_code, '')), ''),
          case
            when dept ~* '\bcse\b'
              or dept ilike '%computer science%'
              or dept ilike '%computer%engineering%'   then 'CSE'
            when dept ~* '\bece\b'
              or (dept ilike '%electronics%'
                  and dept ilike '%communication%')     then 'ECE'
            when dept ~* '\bmech\b'
              or dept ilike '%mechanical%'             then 'MECH'
            when dept ~* '\bcivil\b'                    then 'CIVIL'
            when dept ~* '\bise\b'
              or dept ilike '%information science%'     then 'ISE'
            when dept ~* '\bmath\b' or dept ilike '%mathematics%' then 'MATHS'
            else btrim(coalesce(dept, ''))
          end
        )
      )
    ),
    ''
  );
$$;

-- The single class key that identifies a student's timetable.
-- Returns NULL when the profile is missing any of the four fields,
-- which makes the timetable unreadable rather than falling back to
-- another section's schedule.
create or replace function public.my_timetable_class()
returns table (year integer, branch text, section text, semester integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    public.cg_num(p.year),
    public.cg_branch_code(p.branch, p.department),
    upper(btrim(coalesce(p.section, ''))),
    public.cg_num(p.semester)
  from public.profiles p
  where p.id = auth.uid()
    and p.role = 'student'
    and public.cg_num(p.year) is not null
    and public.cg_branch_code(p.branch, p.department) is not null
    and btrim(coalesce(p.section, '')) <> ''
    and public.cg_num(p.semester) is not null;
$$;

-- ============================================
-- 3. BACKFILL EXISTING PROFILES
--    Give every current student a resolvable class key, otherwise their
--    timetable would be unreadable before an admin has touched anything.
-- ============================================
update public.profiles
set branch = public.cg_branch_code(null, department)
where (branch is null or btrim(branch) = '')
  and department is not null
  and btrim(department) <> '';

-- ============================================
-- 4. TIMETABLE TABLE
-- ============================================
create table if not exists public.timetable (
  id bigint generated always as identity primary key,
  year int not null check (year between 1 and 5),
  branch text not null,
  section text not null,
  semester int not null check (semester between 1 and 10),
  day text not null check (day in (
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  )),
  period_number int not null check (period_number > 0),
  start_time time not null,
  end_time time not null,
  subject text not null,
  faculty text not null,
  room text not null,
  subject_code text,                     -- optional, e.g. "CS501"
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint timetable_valid_slot check (end_time > start_time)
);

-- ============================================
-- 5. CONSTRAINTS & INDEXES
-- ============================================
-- One row per period per class per day. Re-running the same slot is
-- rejected, so an admin can never accidentally stack two subjects in
-- period 3 of Monday for the same section.
create unique index if not exists uq_timetable_slot
  on public.timetable (year, branch, section, semester, day, period_number);

-- Primary student read path:
-- login -> year+branch+section+semester -> order by day, period.
create index if not exists idx_timetable_class
  on public.timetable (year, branch, section, semester);

create index if not exists idx_timetable_class_day
  on public.timetable (year, branch, section, semester, day, period_number, start_time);

create index if not exists idx_timetable_faculty
  on public.timetable (faculty);

create index if not exists idx_timetable_room
  on public.timetable (room);

-- ============================================
-- 6. updated_at TRIGGER
-- ============================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists timetable_touch_updated_at on public.timetable;
create trigger timetable_touch_updated_at
  before update on public.timetable
  for each row execute function public.touch_updated_at();

-- ============================================
-- 7. ROW LEVEL SECURITY
--    A student may read ONLY the timetable for their own
--    year + branch + section + semester. Every other row is
--    invisible to them, including at the database level.
-- ============================================
alter table public.timetable enable row level security;

drop policy if exists "timetable read own class" on public.timetable;
create policy "timetable read own class" on public.timetable
  for select using (
    public.my_role() = 'admin'
    or exists (
      select 1
      from public.my_timetable_class() c
      where c.year      = timetable.year
        and c.branch    = timetable.branch
        and c.section   = timetable.section
        and c.semester  = timetable.semester
    )
  );

-- Admins manage every row. Students and faculty get no write policy.
drop policy if exists "admin manage timetable" on public.timetable;
create policy "admin manage timetable" on public.timetable
  for all using (public.my_role() = 'admin')
  with check (public.my_role() = 'admin');

-- ============================================
-- 8. REALTIME
--    Required so a student sees admin timetable edits without a reload.
-- ============================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'timetable'
  ) then
    alter publication supabase_realtime add table public.timetable;
  end if;
end $$;

-- ============================================
-- 9. REFERENCE / SEED DATA
--    No timetable rows are seeded here on purpose. The real timetable
--    will be entered by an admin (or loaded from the reference sheet)
--    once it is supplied.
-- ============================================
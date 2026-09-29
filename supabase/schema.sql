-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- (If you already ran it successfully, do NOT run it again.)

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'student'
    check (role in ('student','faculty','admin')),
  usn text, year text, section text,
  employee_id text, department text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create function public.my_role() returns text
language sql security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create policy "read own" on public.profiles
  for select using (auth.uid() = id);
create policy "admin read all" on public.profiles
  for select using (public.my_role() = 'admin');
create policy "update own, not role" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = public.my_role());
create policy "admin manage" on public.profiles
  for all using (public.my_role() = 'admin');

-- Creates the profile automatically when someone signs up.
-- Only student or faculty can be chosen from the app; admin is set manually.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles
    (id, name, email, role, usn, year, section, employee_id, department)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    case when new.raw_user_meta_data->>'role' = 'faculty'
         then 'faculty' else 'student' end,
    new.raw_user_meta_data->>'usn',
    new.raw_user_meta_data->>'year',
    new.raw_user_meta_data->>'section',
    new.raw_user_meta_data->>'employee_id',
    new.raw_user_meta_data->>'department'
  );
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- CLASSROOMS & ROOM MANAGEMENT (MOCKUP 8)
-- ============================================================
create table if not exists public.classrooms (
  id serial primary key,
  room_number text not null unique,
  floor int not null check (floor in (1, 2, 3)),
  type text not null check (type in ('Classroom', 'Lab', 'Office', 'Seminar Hall', 'Staff Room')),
  capacity int not null default 60,
  building text not null default 'Main Block',
  has_projector boolean default false,
  created_at timestamptz default now()
);

alter table public.classrooms enable row level security;

-- Everyone (students, faculty, visitors) can view classrooms for navigation
create policy "anyone can read classrooms" on public.classrooms
  for select using (true);

-- Only admins can add, update, or delete classrooms
create policy "admin manage classrooms" on public.classrooms
  for all using (public.my_role() = 'admin');

-- Initial Seed Classrooms for KVGCE 3 Floors
insert into public.classrooms (room_number, floor, type, capacity, building)
values
  ('101', 1, 'Classroom', 60, 'Main Block'),
  ('102', 1, 'Classroom', 60, 'Main Block'),
  ('103', 1, 'Office', 15, 'Main Block'),
  ('104', 1, 'Lab', 45, 'Main Block'),
  ('201', 2, 'Classroom', 60, 'Main Block'),
  ('202', 2, 'Classroom', 60, 'Main Block'),
  ('203', 2, 'Lab', 40, 'Main Block'),
  ('204', 2, 'Classroom', 60, 'Main Block'),
  ('205', 2, 'Classroom', 60, 'Main Block'),
  ('206', 2, 'Classroom', 60, 'Main Block'),
  ('207', 2, 'Seminar Hall', 120, 'Main Block'),
  ('301', 3, 'Classroom', 60, 'Main Block'),
  ('302', 3, 'Classroom', 60, 'Main Block'),
  ('303', 3, 'Lab', 40, 'Main Block')
on conflict (room_number) do nothing;


-- CampusGuide: Buildings, Floors, Rooms Schema
-- Run in Supabase SQL Editor after the auth schema

-- ============================================
-- BUILDINGS
-- ============================================
create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,           -- short code: "CS", "LIB", "ADM"
  name text not null,                  -- "Computer Science Block"
  description text,
  address text,
  latitude numeric(10, 7),             -- for outdoor map reference
  longitude numeric(10, 7),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- FLOORS
-- ============================================
create table public.floors (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  level integer not null,              -- -1 (basement), 0 (ground), 1, 2, 3...
  name text,                           -- "Ground Floor", "First Floor"
  description text,
  -- SVG/MapLibre style floor plan reference
  map_image_url text,                  -- URL to floor plan image
  map_bounds jsonb,                    -- { "x": 0, "y": 0, "width": 1000, "height": 800 }
  -- For coordinate transformation (pixels → lat/lng or local grid)
  map_transform jsonb,                 -- { "scale": 0.05, "origin": { "x": 0, "y": 0 } }
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (building_id, level)
);

-- ============================================
-- ROOMS
-- ============================================
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid not null references public.floors(id) on delete cascade,
  room_number text not null,           -- "101", "CS-204", "LIB-G1"
  name text,                           -- "Lecture Hall 1", "Dean's Office"
  type text not null check (type in (
    'classroom', 'lab', 'office', 'library', 'auditorium',
    'conference', 'canteen', 'restroom', 'corridor', 'staircase', 'elevator', 'other'
  )),
  capacity integer,
  features jsonb default '[]'::jsonb,  -- ["projector", "ac", "whiteboard", "smartboard", "computers"]
  -- Room geometry for indoor mapping (polygon in floor coordinate system)
  geometry jsonb,                      -- GeoJSON Polygon: { "type": "Polygon", "coordinates": [[[x,y],...]] }
  -- Entrance points for routing (doors)
  entrances jsonb default '[]'::jsonb, -- [{ "x": 100, "y": 200, "type": "door" }, ...]
  -- Navigation metadata
  is_navigable boolean default true,   -- corridors, stairs = true; walls = false
  is_accessible boolean default true,  -- wheelchair accessible
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (floor_id, room_number)
);

-- ============================================
-- CLASSROOM ALLOCATIONS (timetable)
-- ============================================
create table public.allocations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  year text not null,                  -- "1st Year", "2nd Year", etc.
  section text not null,               -- "A", "B", "C", "D"
  subject text not null,               -- "Data Structures"
  faculty_id uuid references auth.users(id), -- assigned faculty
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0=Sun, 1=Mon...
  start_time time not null,            -- "09:00"
  end_time time not null,              -- "10:00"
  semester text,                       -- "2024-odd", "2024-even"
  is_recurring boolean default true,   -- weekly recurring
  valid_from date default current_date,
  valid_to date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- NOTIFICATIONS (for room changes, announcements)
-- ============================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- null = broadcast to all
  role text check (role in ('student', 'faculty', 'admin')), -- or null for all roles
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info', 'warning', 'success', 'error', 'room_change')),
  related_room_id uuid references public.rooms(id),
  related_allocation_id uuid references public.allocations(id),
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.buildings enable row level security;
alter table public.floors enable row level security;
alter table public.rooms enable row level security;
alter table public.allocations enable row level security;
alter table public.notifications enable row level security;

-- Buildings: everyone can read
create policy "buildings read all" on public.buildings
  for select using (true);

-- Floors: everyone can read
create policy "floors read all" on public.floors
  for select using (true);

-- Rooms: everyone can read
create policy "rooms read all" on public.rooms
  for select using (true);

-- Allocations: users see their own (by year/section), faculty see theirs, admins see all
create policy "allocations read own" on public.allocations
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and (
        p.role = 'admin'
        or (p.role = 'student' and p.year = allocations.year and p.section = allocations.section)
        or (p.role = 'faculty' and p.id = allocations.faculty_id)
      )
    )
  );

-- Notifications: users see their own + broadcasts for their role
create policy "notifications read own" on public.notifications
  for select using (
    user_id = auth.uid()
    or (user_id is null and (role is null or role = (select role from public.profiles where id = auth.uid())))
  );

-- Admin full access to all new tables
create policy "admin manage buildings" on public.buildings for all using (public.my_role() = 'admin');
create policy "admin manage floors" on public.floors for all using (public.my_role() = 'admin');
create policy "admin manage rooms" on public.rooms for all using (public.my_role() = 'admin');
create policy "admin manage allocations" on public.allocations for all using (public.my_role() = 'admin');
create policy "admin manage notifications" on public.notifications for all using (public.my_role() = 'admin');

-- ============================================
-- INDEXES
-- ============================================
create index idx_floors_building on public.floors(building_id);
create index idx_rooms_floor on public.rooms(floor_id);
create index idx_rooms_type on public.rooms(type);
create index idx_allocations_room_time on public.allocations(room_id, day_of_week, start_time, end_time);
create index idx_allocations_year_section on public.allocations(year, section, day_of_week);
create index idx_allocations_faculty on public.allocations(faculty_id, day_of_week);
create index idx_notifications_user on public.notifications(user_id, is_read, created_at desc);

-- ============================================
-- SAMPLE DATA (optional - run to test)
-- ============================================
/*
-- Buildings
insert into public.buildings (code, name, description, latitude, longitude) values
  ('CS', 'Computer Science Block', 'Main engineering building', 12.9716, 77.5946),
  ('LIB', 'Central Library', 'Main campus library', 12.9720, 77.5950),
  ('ADM', 'Admin Block', 'Administrative offices', 12.9710, 77.5940);

-- Floors (CS Block: Ground, 1st, 2nd)
insert into public.floors (building_id, level, name, map_image_url) values
  ((select id from buildings where code='CS'), 0, 'Ground Floor', '/maps/cs-ground.svg'),
  ((select id from buildings where code='CS'), 1, 'First Floor', '/maps/cs-first.svg'),
  ((select id from buildings where code='CS'), 2, 'Second Floor', '/maps/cs-second.svg');

-- Rooms (sample)
insert into public.rooms (floor_id, room_number, name, type, capacity, features, geometry, entrances) values
  ((select id from floors where building_id=(select id from buildings where code='CS') and level=0), 'CS-101', 'Lecture Hall 1', 'classroom', 60, '["projector","ac","whiteboard"]', '{"type":"Polygon","coordinates":[[[100,100],[300,100],[300,250],[100,250],[100,100]]]}', '[{"x":200,"y":100,"type":"door"}]'),
  ((select id from floors where building_id=(select id from buildings where code='CS') and level=0), 'CS-102', 'Computer Lab 1', 'lab', 40, '["computers","ac","projector"]', '{"type":"Polygon","coordinates":[[[350,100],[550,100],[550,250],[350,250],[350,100]]]}', '[{"x":450,"y":100,"type":"door"}]');
*/
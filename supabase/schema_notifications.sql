-- ============================================================
-- NOTIFICATIONS TABLE + RLS
-- Run this ONLY if you have NOT already run schema_rooms.sql
-- (schema_rooms.sql already creates this table).
-- If you already ran schema_rooms.sql, skip this file.
-- ============================================================

-- Allow users to mark their own notifications as read
create policy if not exists "users update own notifications" on public.notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Allow admins to insert notifications
create policy if not exists "admin insert notifications" on public.notifications
  for insert
  with check (public.my_role() = 'admin');

-- ============================================================
-- SAMPLE SEED NOTIFICATIONS (optional, for testing)
-- Run this block to populate test data:
-- ============================================================
/*
insert into public.notifications (user_id, role, title, message, type)
values
  (null, 'student', 'Welcome to CampusGuide!', 'Navigate your campus easily using the indoor map.', 'info'),
  (null, 'faculty', 'Room Booking System Live', 'You can now request classroom changes directly from your dashboard.', 'success'),
  (null, null, 'Holiday Notice', 'College will remain closed on Oct 15th for a public holiday.', 'warning'),
  (null, 'student', 'Library Timing Update', 'Library is now open until 9 PM on weekdays.', 'info');
*/

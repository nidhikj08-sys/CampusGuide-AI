-- CampusGuide: AI Chat Schema
-- Run in Supabase SQL Editor after schema.sql.
-- Safe to re-run (all statements are idempotent).

-- ============================================
-- CHAT MESSAGES
--    One row per message. user_id defaults to the
--    logged-in user, so a message can never be
--    written on someone else's behalf.
-- ============================================
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

alter table public.chat_messages enable row level security;

-- Users may only ever see their own conversation.
create policy "users read own messages" on public.chat_messages
  for select using (auth.uid() = user_id);

-- Users may only insert a message attributed to themselves.
create policy "users insert own messages" on public.chat_messages
  for insert with check (auth.uid() = user_id);

-- "Clear chat" deletes only the caller's own rows.
create policy "users delete own messages" on public.chat_messages
  for delete using (auth.uid() = user_id);

-- History is always loaded oldest-first for the current user.
create index if not exists idx_chat_messages_user
  on public.chat_messages (user_id, created_at);

-- ============================================
-- REALTIME
--    Lets a conversation update live if it is
--    open on more than one device.
-- ============================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;
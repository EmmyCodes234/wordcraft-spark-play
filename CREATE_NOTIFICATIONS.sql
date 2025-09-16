-- Notifications core schema (idempotent, safe to run multiple times)
-- 1) Table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in (
    'post_commented','post_reacted','post_shared','friend_request','system','word_judge'
  )),
  title text,
  body text,
  metadata jsonb default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2) Indexes
create index if not exists idx_notifications_user_created_at
  on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_unread
  on public.notifications(user_id) where is_read = false;

-- 3) RLS
alter table public.notifications enable row level security;
drop policy if exists "read own notifications" on public.notifications;
create policy "read own notifications" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "insert for self or system" on public.notifications;
create policy "insert for self or system" on public.notifications
  for insert with check (
    -- allow backend service role, or user inserting for themselves
    (auth.role() = 'service_role') or (auth.uid() = user_id)
  );

drop policy if exists "update own notifications" on public.notifications;
create policy "update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- 4) Helper function to emit a notification (safe wrapper)
create or replace function public.emit_notification(
  p_user_id uuid,
  p_type text,
  p_title text default null,
  p_body text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_actor_id uuid default null
) returns uuid language plpgsql security definer as $$
declare
  v_id uuid;
begin
  insert into public.notifications(user_id, type, title, body, metadata, actor_id)
  values (p_user_id, p_type, p_title, p_body, p_metadata, p_actor_id)
  returning id into v_id;
  return v_id;
exception when others then
  -- swallow and return null to avoid breaking caller flows
  return null;
end;
$$;

grant usage on schema public to anon, authenticated; -- typical supabase default
grant select, insert, update on table public.notifications to authenticated;
grant execute on function public.emit_notification(uuid,text,text,text,jsonb,uuid) to authenticated;



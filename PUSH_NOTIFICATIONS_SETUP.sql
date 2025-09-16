-- Push Notifications Setup
-- Run this in Supabase SQL Editor after CREATE_NOTIFICATIONS.sql

-- 1) Push subscriptions table
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, endpoint)
);

-- 2) Indexes
create index if not exists idx_push_subscriptions_user_id 
  on public.push_subscriptions(user_id);

-- 3) RLS
alter table public.push_subscriptions enable row level security;

drop policy if exists "manage own subscriptions" on public.push_subscriptions;
create policy "manage own subscriptions" on public.push_subscriptions
  for all using (auth.uid() = user_id);

-- 4) Helper function to store subscription
create or replace function public.store_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_user_agent text default null
) returns uuid language plpgsql security definer as $$
declare
  v_id uuid;
begin
  insert into public.push_subscriptions(user_id, endpoint, p256dh, auth, user_agent)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth, p_user_agent)
  on conflict (user_id, endpoint) 
  do update set 
    p256dh = excluded.p256dh,
    auth = excluded.auth,
    user_agent = excluded.user_agent,
    updated_at = now()
  returning id into v_id;
  return v_id;
exception when others then
  return null;
end;
$$;

-- 5) Helper function to get user's subscriptions
create or replace function public.get_user_push_subscriptions(p_user_id uuid)
returns table(endpoint text, p256dh text, auth text) 
language plpgsql security definer as $$
begin
  return query
  select ps.endpoint, ps.p256dh, ps.auth
  from public.push_subscriptions ps
  where ps.user_id = p_user_id;
end;
$$;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.push_subscriptions to authenticated;
grant execute on function public.store_push_subscription(text,text,text,text) to authenticated;
grant execute on function public.get_user_push_subscriptions(uuid) to authenticated;

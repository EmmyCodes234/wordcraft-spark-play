-- Notification Triggers
-- Run this after CREATE_NOTIFICATIONS.sql and PUSH_NOTIFICATIONS_SETUP.sql

-- 1) Trigger for new social posts (notify followers)
create or replace function public.notify_post_created()
returns trigger language plpgsql security definer as $$
declare
  follower_record record;
begin
  -- Notify all followers of the user who created the post
  for follower_record in 
    select f.follower_id 
    from public.friendships f 
    where f.following_id = new.user_id and f.status = 'accepted'
  loop
    perform public.emit_notification(
      follower_record.follower_id,
      'user_post',
      'New Post from ' || (select username from public.profiles where id = new.user_id),
      coalesce(new.content_text, 'Shared a new post'),
      jsonb_build_object('post_id', new.id, 'user_id', new.user_id),
      new.user_id
    );
  end loop;
  
  return new;
end;
$$;

-- 2) Trigger for comments (notify post author)
create or replace function public.notify_comment_created()
returns trigger language plpgsql security definer as $$
declare
  post_author_id uuid;
begin
  -- Get the post author
  select user_id into post_author_id 
  from public.social_posts 
  where id = new.post_id;
  
  -- Don't notify if commenting on own post
  if post_author_id != new.user_id then
    perform public.emit_notification(
      post_author_id,
      'post_commented',
      'New Comment',
      (select username from public.profiles where id = new.user_id) || ' commented on your post',
      jsonb_build_object('post_id', new.post_id, 'comment_id', new.id, 'user_id', new.user_id),
      new.user_id
    );
  end if;
  
  return new;
end;
$$;

-- 3) Trigger for word judge completions (system notification)
create or replace function public.notify_word_judge_completion()
returns trigger language plpgsql security definer as $$
begin
  -- This would be called manually when a word judge session completes
  -- For now, we'll create a simple system notification
  perform public.emit_notification(
    new.user_id,
    'word_judge',
    'Word Judge Complete',
    'Your word challenge has been processed',
    jsonb_build_object('session_id', new.id, 'result', new.result),
    null
  );
  
  return new;
end;
$$;

-- 4) Create triggers
drop trigger if exists trigger_notify_post_created on public.social_posts;
create trigger trigger_notify_post_created
  after insert on public.social_posts
  for each row execute function public.notify_post_created();

drop trigger if exists trigger_notify_comment_created on public.post_comments;
create trigger trigger_notify_comment_created
  after insert on public.post_comments
  for each row execute function public.notify_comment_created();

-- 5) Helper function to send test notification
create or replace function public.send_test_notification(
  p_user_id uuid,
  p_title text default 'Test Notification',
  p_body text default 'This is a test notification from WordSmith!'
)
returns uuid language plpgsql security definer as $$
declare
  v_notification_id uuid;
begin
  -- Insert notification
  v_notification_id := public.emit_notification(
    p_user_id,
    'system',
    p_title,
    p_body,
    jsonb_build_object('test', true),
    null
  );
  
  -- Also trigger push notification via edge function
  -- This would be called from the client side
  
  return v_notification_id;
end;
$$;

grant execute on function public.send_test_notification(uuid,text,text) to authenticated;

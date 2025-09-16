-- Update scheduled notifications to use last_active column
-- This provides more accurate activity-based notifications

-- 1) Morning motivation notifications - Updated to use last_active
CREATE OR REPLACE FUNCTION public.send_morning_notifications()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Send to users who were active yesterday
  PERFORM public.emit_notification(
    p.id,
    'system',
    '🌅 Good Morning!',
    'Start your day with a word challenge!',
    jsonb_build_object(
      'time', 'morning',
      'action', 'daily_challenge',
      'motivation', true
    ),
    null
  )
  FROM public.profiles p
  WHERE p.last_active > NOW() - INTERVAL '24 hours'
    AND p.last_active < NOW() - INTERVAL '12 hours'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE user_id = p.id 
        AND type = 'system' 
        AND created_at > NOW() - INTERVAL '12 hours'
        AND metadata->>'time' = 'morning'
    );
END;
$$;

-- 2) Evening wrap-up notifications - Updated to use last_active
CREATE OR REPLACE FUNCTION public.send_evening_notifications()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Send to users who were active today
  PERFORM public.emit_notification(
    p.id,
    'system',
    '🌙 Great Day!',
    'Review what you learned today and plan tomorrow''s goals.',
    jsonb_build_object(
      'time', 'evening',
      'action', 'review_progress',
      'reflection', true
    ),
    null
  )
  FROM public.profiles p
  WHERE p.last_active > NOW() - INTERVAL '12 hours'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE user_id = p.id 
        AND type = 'system' 
        AND created_at > NOW() - INTERVAL '12 hours'
        AND metadata->>'time' = 'evening'
    );
END;
$$;

-- 3) Weekly progress notifications - Updated to use last_active
CREATE OR REPLACE FUNCTION public.send_weekly_progress()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  user_record record;
  weekly_words integer;
  weekly_quizzes integer;
BEGIN
  FOR user_record IN 
    SELECT p.*, us.* 
    FROM public.profiles p
    LEFT JOIN public.user_stats us ON p.id = us.user_id
    WHERE p.last_active > NOW() - INTERVAL '7 days'
  LOOP
    -- Calculate weekly progress (simplified - using total stats as proxy)
    weekly_words := COALESCE(user_record.words_learned, 0);
    weekly_quizzes := COALESCE(user_record.quizzes_completed, 0);
    
    IF weekly_words > 0 OR weekly_quizzes > 0 THEN
      PERFORM public.emit_notification(
        user_record.id,
        'system',
        '📊 Weekly Progress',
        'This week: ' || weekly_words || ' words learned, ' || weekly_quizzes || ' quizzes completed!',
        jsonb_build_object(
          'period', 'weekly',
          'words', weekly_words,
          'quizzes', weekly_quizzes,
          'action', 'view_progress'
        ),
        null
      );
    END IF;
  END LOOP;
END;
$$;

-- 4) Feature discovery notifications - Updated to use last_active
CREATE OR REPLACE FUNCTION public.send_feature_discovery()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Suggest Word Judge to users who haven't tried it
  PERFORM public.emit_notification(
    p.id,
    'system',
    '⚖️ Try Word Judge!',
    'Test your word knowledge with our tournament-style judge!',
    jsonb_build_object(
      'feature', 'word_judge',
      'discovery', true,
      'action', 'try_word_judge'
    ),
    null
  )
  FROM public.profiles p
  WHERE p.last_active > NOW() - INTERVAL '7 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE user_id = p.id 
        AND metadata->>'feature' = 'word_judge'
    );
  
  -- Suggest Social Feed to active users
  PERFORM public.emit_notification(
    p.id,
    'system',
    '👥 Join the Community!',
    'Connect with other word enthusiasts in our social feed!',
    jsonb_build_object(
      'feature', 'social_feed',
      'discovery', true,
      'action', 'explore_social'
    ),
    null
  )
  FROM public.profiles p
  WHERE p.last_active > NOW() - INTERVAL '3 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE user_id = p.id 
        AND metadata->>'feature' = 'social_feed'
    );
END;
$$;

-- 5) Smart engagement notifications - Updated to use last_active
CREATE OR REPLACE FUNCTION public.send_engagement_notifications()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  user_record record;
  engagement_level text;
BEGIN
  FOR user_record IN 
    SELECT p.*, us.* 
    FROM public.profiles p
    LEFT JOIN public.user_stats us ON p.id = us.user_id
    WHERE p.last_active > NOW() - INTERVAL '30 days'
  LOOP
    -- Determine engagement level based on last_active
    IF user_record.last_active > NOW() - INTERVAL '1 day' THEN
      engagement_level := 'high';
    ELSIF user_record.last_active > NOW() - INTERVAL '3 days' THEN
      engagement_level := 'medium';
    ELSE
      engagement_level := 'low';
    END IF;
    
    -- Send appropriate notification
    CASE engagement_level
      WHEN 'high' THEN
        PERFORM public.emit_notification(
          user_record.id,
          'system',
          '⭐ Power User!',
          'You''re doing amazing! Try creating a custom study deck.',
          jsonb_build_object(
            'engagement', 'high',
            'action', 'create_study_deck'
          ),
          null
        );
      WHEN 'medium' THEN
        PERFORM public.emit_notification(
          user_record.id,
          'system',
          '📚 Keep It Up!',
          'You''re making great progress! Try the Pattern Matcher.',
          jsonb_build_object(
            'engagement', 'medium',
            'action', 'pattern_matcher'
          ),
          null
        );
      WHEN 'low' THEN
        PERFORM public.emit_notification(
          user_record.id,
          'system',
          '😊 We Miss You!',
          'Come back and discover new words! We have exciting features waiting.',
          jsonb_build_object(
            'engagement', 'low',
            'action', 'reengage'
          ),
          null
        );
    END CASE;
  END LOOP;
END;
$$;

-- 6) Create a function to update last_active from client-side
CREATE OR REPLACE FUNCTION public.update_last_active()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles 
  SET last_active = now() 
  WHERE id = auth.uid();
END;
$$;

-- 7) Grant permissions
GRANT EXECUTE ON FUNCTION public.update_last_active() TO authenticated;

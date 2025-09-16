-- Scheduled Notifications Setup
-- This creates functions for different types of scheduled notifications

-- 1) Morning motivation notifications - Updated for existing schema
CREATE OR REPLACE FUNCTION public.send_morning_notifications()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Send to users who were created recently (as proxy for activity)
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
  WHERE p.created_at > NOW() - INTERVAL '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE user_id = p.id 
        AND type = 'system' 
        AND created_at > NOW() - INTERVAL '12 hours'
        AND metadata->>'time' = 'morning'
    );
END;
$$;

-- 2) Evening wrap-up notifications - Updated for existing schema
CREATE OR REPLACE FUNCTION public.send_evening_notifications()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Send to users who were created recently (as proxy for activity)
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
  WHERE p.created_at > NOW() - INTERVAL '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE user_id = p.id 
        AND type = 'system' 
        AND created_at > NOW() - INTERVAL '12 hours'
        AND metadata->>'time' = 'evening'
    );
END;
$$;

-- 3) Weekly progress notifications - Updated for existing schema
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
    WHERE p.created_at > NOW() - INTERVAL '30 days'
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

-- 4) Feature discovery notifications - Updated for existing schema
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
  WHERE p.created_at > NOW() - INTERVAL '30 days'
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
  WHERE p.created_at > NOW() - INTERVAL '7 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE user_id = p.id 
        AND metadata->>'feature' = 'social_feed'
    );
END;
$$;

-- 5) Achievement notifications
CREATE OR REPLACE FUNCTION public.check_achievements()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  user_record record;
BEGIN
  FOR user_record IN 
    SELECT p.*, us.* 
    FROM public.profiles p
    LEFT JOIN public.user_stats us ON p.id = us.user_id
    WHERE us.user_id IS NOT NULL
  LOOP
    -- First week achievement
    IF user_record.created_at < NOW() - INTERVAL '7 days' 
       AND user_record.created_at > NOW() - INTERVAL '8 days' THEN
      PERFORM public.emit_notification(
        user_record.id,
        'system',
        '🎉 One Week Strong!',
        'Congratulations on completing your first week with WordSmith!',
        jsonb_build_object(
          'achievement', 'one_week',
          'milestone', true
        ),
        null
      );
    END IF;
    
    -- First month achievement
    IF user_record.created_at < NOW() - INTERVAL '30 days' 
       AND user_record.created_at > NOW() - INTERVAL '31 days' THEN
      PERFORM public.emit_notification(
        user_record.id,
        'system',
        '🏆 One Month Master!',
        'Amazing! You''ve been with us for a month. You''re a true word enthusiast!',
        jsonb_build_object(
          'achievement', 'one_month',
          'milestone', true
        ),
        null
      );
    END IF;
  END LOOP;
END;
$$;

-- 6) Smart engagement notifications - Updated for existing schema
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
    WHERE p.created_at > NOW() - INTERVAL '30 days'
  LOOP
    -- Determine engagement level based on account age and stats
    IF p.created_at > NOW() - INTERVAL '3 days' THEN
      engagement_level := 'high';
    ELSIF p.created_at > NOW() - INTERVAL '7 days' THEN
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

-- 7) Grant permissions
GRANT EXECUTE ON FUNCTION public.send_morning_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_evening_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_weekly_progress() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_feature_discovery() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_achievements() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_engagement_notifications() TO authenticated;

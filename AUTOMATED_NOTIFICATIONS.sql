-- Automated Smart Notifications System
-- This creates triggers and functions for automatic notifications based on user behavior

-- 1) Trigger for new user registration
CREATE OR REPLACE FUNCTION public.notify_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Welcome notification for new user
  PERFORM public.emit_notification(
    NEW.id,
    'system',
    '🎉 Welcome to WordSmith!',
    'Start your word journey! Try the Anagram Solver or take a quiz to begin.',
    jsonb_build_object(
      'welcome', true,
      'user_type', 'new',
      'suggested_actions', ARRAY['anagram_solver', 'quiz_mode', 'word_judge']
    ),
    null
  );
  
  -- Onboarding tips
  PERFORM public.emit_notification(
    NEW.id,
    'system',
    '💡 Quick Tip',
    'Use the Pattern Matcher to find words with specific letter patterns!',
    jsonb_build_object('tip_type', 'onboarding', 'feature', 'pattern_matcher'),
    null
  );
  
  RETURN NEW;
END;
$$;

-- 2) Trigger for user activity (login/usage) - Updated for existing schema
CREATE OR REPLACE FUNCTION public.notify_user_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  days_since_created integer;
  user_stats_record record;
BEGIN
  -- Get user stats
  SELECT * INTO user_stats_record 
  FROM public.user_stats 
  WHERE user_id = NEW.id;
  
  -- Calculate days since account creation (as proxy for activity)
  days_since_created := EXTRACT(DAY FROM NOW() - NEW.created_at);
  
  -- Re-engagement for users who haven't been active recently
  -- (We'll use account age as a proxy since we don't have last_active)
  IF days_since_created > 7 AND days_since_created < 30 THEN
    PERFORM public.emit_notification(
      NEW.id,
      'system',
      '😊 We Miss You!',
      'Come back and discover new words! We have new features waiting for you.',
      jsonb_build_object(
        'reengagement', true,
        'days_since_created', days_since_created,
        'suggested_features', ARRAY['word_judge', 'social_feed']
      ),
      null
    );
  END IF;
  
  -- Daily streak encouragement (if we have streak data)
  IF user_stats_record.daily_streak > 0 THEN
    PERFORM public.emit_notification(
      NEW.id,
      'system',
      '🔥 Streak Continues!',
      'Great job! You''re on a ' || user_stats_record.daily_streak || '-day streak!',
      jsonb_build_object(
        'streak', user_stats_record.daily_streak,
        'encouragement', true
      ),
      null
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3) Trigger for quiz completions
CREATE OR REPLACE FUNCTION public.notify_quiz_completion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  user_stats_record record;
  achievement_unlocked boolean := false;
BEGIN
  -- Get user stats
  SELECT * INTO user_stats_record 
  FROM public.user_stats 
  WHERE user_id = NEW.user_id;
  
  -- Achievement notifications
  IF user_stats_record.quizzes_completed = 1 THEN
    PERFORM public.emit_notification(
      NEW.user_id,
      'system',
      '🏆 First Quiz Complete!',
      'Congratulations on completing your first quiz! You''re on your way to becoming a word master.',
      jsonb_build_object('achievement', 'first_quiz', 'milestone', true),
      null
    );
    achievement_unlocked := true;
  END IF;
  
  IF user_stats_record.quizzes_completed = 10 THEN
    PERFORM public.emit_notification(
      NEW.user_id,
      'system',
      '🎯 Quiz Master!',
      'Amazing! You''ve completed 10 quizzes. Try the Word Judge for a new challenge!',
      jsonb_build_object(
        'achievement', 'quiz_master',
        'count', 10,
        'next_challenge', 'word_judge'
      ),
      null
    );
    achievement_unlocked := true;
  END IF;
  
  -- Performance-based recommendations
  IF NEW.score >= 80 THEN
    PERFORM public.emit_notification(
      NEW.user_id,
      'system',
      '⭐ Excellent Score!',
      'Great job! Try the Pattern Matcher to challenge yourself further.',
      jsonb_build_object(
        'performance', 'excellent',
        'score', NEW.score,
        'recommendation', 'pattern_matcher'
      ),
      null
    );
  ELSIF NEW.score < 50 THEN
    PERFORM public.emit_notification(
      NEW.user_id,
      'system',
      '📚 Keep Learning!',
      'Don''t worry! Try the Study Deck feature to improve your vocabulary.',
      jsonb_build_object(
        'performance', 'needs_improvement',
        'score', NEW.score,
        'recommendation', 'study_deck'
      ),
      null
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4) Trigger for word discoveries
CREATE OR REPLACE FUNCTION public.notify_word_discovery()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  user_stats_record record;
  word_count integer;
BEGIN
  -- Get user stats
  SELECT * INTO user_stats_record 
  FROM public.user_stats 
  WHERE user_id = NEW.user_id;
  
  word_count := user_stats_record.words_learned;
  
  -- Milestone notifications
  IF word_count = 10 THEN
    PERFORM public.emit_notification(
      NEW.user_id,
      'system',
      '📖 Word Explorer!',
      'Fantastic! You''ve learned 10 new words. Share your progress with friends!',
      jsonb_build_object(
        'milestone', '10_words',
        'count', word_count,
        'social', 'share_progress'
      ),
      null
    );
  END IF;
  
  IF word_count = 50 THEN
    PERFORM public.emit_notification(
      NEW.user_id,
      'system',
      '🎓 Word Scholar!',
      'Incredible! 50 words learned. Try creating your own study deck!',
      jsonb_build_object(
        'milestone', '50_words',
        'count', word_count,
        'feature', 'create_study_deck'
      ),
      null
    );
  END IF;
  
  IF word_count = 100 THEN
    PERFORM public.emit_notification(
      NEW.user_id,
      'system',
      '👑 Word Master!',
      'Outstanding! 100 words mastered. You''re ready for advanced challenges!',
      jsonb_build_object(
        'milestone', '100_words',
        'count', word_count,
        'level', 'advanced'
      ),
      null
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5) Smart recommendation system - Updated for existing schema
CREATE OR REPLACE FUNCTION public.send_smart_recommendations()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  user_record record;
  days_since_created integer;
  recommendation_type text;
  recommendation_message text;
  recommendation_action text;
BEGIN
  -- Loop through all users
  FOR user_record IN 
    SELECT p.*, us.* 
    FROM public.profiles p
    LEFT JOIN public.user_stats us ON p.id = us.user_id
  LOOP
    -- Skip if no stats
    IF user_record.user_id IS NULL THEN
      CONTINUE;
    END IF;
    
    days_since_created := EXTRACT(DAY FROM NOW() - user_record.created_at);
    
    -- Determine recommendation based on user state
    IF days_since_created > 7 AND days_since_created < 30 THEN
      recommendation_type := 'reengagement';
      recommendation_message := 'Come back! We have new word challenges waiting for you.';
      recommendation_action := 'daily_challenge';
    ELSIF COALESCE(user_record.words_learned, 0) < 10 THEN
      recommendation_type := 'beginner';
      recommendation_message := 'Start with the Anagram Solver to build your vocabulary!';
      recommendation_action := 'anagram_solver';
    ELSIF COALESCE(user_record.quizzes_completed, 0) = 0 THEN
      recommendation_type := 'quiz_suggestion';
      recommendation_message := 'Try our Quiz Mode to test your word knowledge!';
      recommendation_action := 'quiz_mode';
    ELSIF COALESCE(user_record.words_learned, 0) > 50 AND COALESCE(user_record.quizzes_completed, 0) > 5 THEN
      recommendation_type := 'advanced';
      recommendation_message := 'Ready for a challenge? Try the Word Judge!';
      recommendation_action := 'word_judge';
    ELSIF COALESCE(user_record.daily_streak, 0) > 7 THEN
      recommendation_type := 'streak_celebration';
      recommendation_message := 'Amazing streak! Share your progress with the community!';
      recommendation_action := 'social_feed';
    ELSE
      recommendation_type := 'general';
      recommendation_message := 'Explore new features! Try the Pattern Matcher.';
      recommendation_action := 'pattern_matcher';
    END IF;
    
    -- Send recommendation (only if user hasn't received one recently)
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE user_id = user_record.id 
        AND type = 'system' 
        AND created_at > NOW() - INTERVAL '24 hours'
        AND metadata->>'recommendation_type' = recommendation_type
    ) THEN
      PERFORM public.emit_notification(
        user_record.id,
        'system',
        '💡 Recommended for You',
        recommendation_message,
        jsonb_build_object(
          'recommendation_type', recommendation_type,
          'action', recommendation_action,
          'user_level', CASE 
            WHEN COALESCE(user_record.words_learned, 0) < 10 THEN 'beginner'
            WHEN COALESCE(user_record.words_learned, 0) < 50 THEN 'intermediate'
            ELSE 'advanced'
          END
        ),
        null
      );
    END IF;
  END LOOP;
END;
$$;

-- 6) Create the triggers
DROP TRIGGER IF EXISTS trigger_notify_new_user ON public.profiles;
CREATE TRIGGER trigger_notify_new_user
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_user();

DROP TRIGGER IF EXISTS trigger_notify_user_activity ON public.profiles;
CREATE TRIGGER trigger_notify_user_activity
  AFTER UPDATE OF last_active ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_user_activity();

-- Note: You'll need to create triggers for quiz_completions and word_discoveries
-- when you have those tables. For now, you can call the functions manually.

-- 7) Scheduled recommendation function (call this periodically)
CREATE OR REPLACE FUNCTION public.run_daily_notifications()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Send smart recommendations
  PERFORM public.send_smart_recommendations();
  
  -- Send daily challenges to active users
  PERFORM public.emit_notification(
    p.id,
    'system',
    '📚 Daily Word Challenge',
    'Complete today''s word challenge to earn bonus points!',
    jsonb_build_object(
      'challenge', 'daily',
      'points', 25,
      'action', 'start_challenge'
    ),
    null
  )
  FROM public.profiles p
  WHERE p.last_active > NOW() - INTERVAL '7 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE user_id = p.id 
        AND type = 'system' 
        AND created_at > NOW() - INTERVAL '24 hours'
        AND metadata->>'challenge' = 'daily'
    );
  
  -- Send study reminders
  PERFORM public.emit_notification(
    p.id,
    'system',
    '📖 Study Time!',
    'Your study deck has new words waiting for you!',
    jsonb_build_object(
      'reminder', 'study',
      'action', 'study_deck'
    ),
    null
  )
  FROM public.profiles p
  WHERE p.last_active > NOW() - INTERVAL '3 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE user_id = p.id 
        AND type = 'system' 
        AND created_at > NOW() - INTERVAL '48 hours'
        AND metadata->>'reminder' = 'study'
    );
END;
$$;

-- 8) Grant permissions
GRANT EXECUTE ON FUNCTION public.notify_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_user_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_quiz_completion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_word_discovery() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_smart_recommendations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.run_daily_notifications() TO authenticated;

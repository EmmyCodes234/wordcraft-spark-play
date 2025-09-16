-- Add last_active column to profiles table
-- This will enable more accurate activity tracking for notifications

-- 1) Add the last_active column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_active timestamptz DEFAULT now();

-- 2) Update existing profiles to set last_active to their created_at time
UPDATE public.profiles 
SET last_active = created_at 
WHERE last_active IS NULL;

-- 3) Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_active 
ON public.profiles(last_active);

-- 4) Create a function to update last_active when user logs in
CREATE OR REPLACE FUNCTION public.update_user_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Update last_active when user logs in
  UPDATE public.profiles 
  SET last_active = now() 
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- 5) Create trigger to automatically update last_active on profile updates
-- (This will fire when user data is updated, indicating activity)
DROP TRIGGER IF EXISTS trigger_update_user_activity ON public.profiles;
CREATE TRIGGER trigger_update_user_activity
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_user_activity();

-- 6) Create a function to manually update last_active
CREATE OR REPLACE FUNCTION public.mark_user_active(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles 
  SET last_active = now() 
  WHERE id = p_user_id;
END;
$$;

-- 7) Grant permissions
GRANT EXECUTE ON FUNCTION public.update_user_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_user_active(uuid) TO authenticated;

-- 8) Update the automated notifications to use last_active
-- (We'll update the functions to use the new column)

-- Update notify_user_activity function
CREATE OR REPLACE FUNCTION public.notify_user_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  days_since_last_active integer;
  user_stats_record record;
BEGIN
  -- Get user stats
  SELECT * INTO user_stats_record 
  FROM public.user_stats 
  WHERE user_id = NEW.id;
  
  -- Calculate days since last active
  days_since_last_active := EXTRACT(DAY FROM NOW() - NEW.last_active);
  
  -- Re-engagement for inactive users
  IF days_since_last_active > 7 THEN
    PERFORM public.emit_notification(
      NEW.id,
      'system',
      '😊 We Miss You!',
      'Come back and discover new words! We have new features waiting for you.',
      jsonb_build_object(
        'reengagement', true,
        'days_inactive', days_since_last_active,
        'suggested_features', ARRAY['word_judge', 'social_feed']
      ),
      null
    );
  END IF;
  
  -- Daily streak encouragement
  IF days_since_last_active = 0 AND user_stats_record.daily_streak > 0 THEN
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

-- Update send_smart_recommendations function
CREATE OR REPLACE FUNCTION public.send_smart_recommendations()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  user_record record;
  days_since_active integer;
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
    
    days_since_active := EXTRACT(DAY FROM NOW() - user_record.last_active);
    
    -- Determine recommendation based on user state
    IF days_since_active > 3 THEN
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

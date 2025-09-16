-- Fix for stack depth limit exceeded error
-- Run this in Supabase SQL Editor

-- 1. Drop any existing triggers that might cause recursion
DROP TRIGGER IF EXISTS trigger_update_user_activity ON public.profiles;

-- 2. Drop the problematic function
DROP FUNCTION IF EXISTS public.update_user_activity();

-- 3. Create a simple, safe update_last_active function
CREATE OR REPLACE FUNCTION public.update_last_active()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Simple update without any complex logic
  UPDATE public.profiles 
  SET last_active = now() 
  WHERE id = auth.uid();
END;
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION public.update_last_active() TO authenticated;

-- 5. Create a safer version that checks if update is needed
CREATE OR REPLACE FUNCTION public.update_last_active_safe()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Get the current user ID
  user_id := auth.uid();
  
  -- Check if user exists and update if needed
  IF user_id IS NOT NULL THEN
    UPDATE public.profiles 
    SET last_active = now() 
    WHERE id = user_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- 6. Grant permissions for the safe function
GRANT EXECUTE ON FUNCTION public.update_last_active_safe() TO authenticated;

-- 7. Test the function (optional)
-- SELECT public.update_last_active_safe();

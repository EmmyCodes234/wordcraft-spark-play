-- Test script for last_active functions
-- Run this in Supabase SQL Editor to test the functions

-- 1. Test the safe function
SELECT public.update_last_active_safe() as safe_function_result;

-- 2. Test the regular function
SELECT public.update_last_active() as regular_function_result;

-- 3. Check if last_active was updated
SELECT 
  id,
  username,
  last_active,
  EXTRACT(EPOCH FROM (now() - last_active)) as seconds_since_update
FROM public.profiles 
WHERE id = auth.uid();

-- 4. Check for any triggers that might cause recursion
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

-- 5. Check function definitions
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%last_active%' 
  AND routine_schema = 'public';

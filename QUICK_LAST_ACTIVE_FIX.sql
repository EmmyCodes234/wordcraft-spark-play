-- Quick fix for last_active functionality
-- Run this in Supabase SQL Editor

-- 1. Add last_active column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_active timestamptz DEFAULT now();

-- 2. Update existing profiles to set last_active to their created_at time
UPDATE public.profiles 
SET last_active = created_at 
WHERE last_active IS NULL;

-- 3. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_active 
ON public.profiles(last_active);

-- 4. Create the update_last_active function (optimized for performance)
CREATE OR REPLACE FUNCTION public.update_last_active()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Use a more efficient update with WHERE clause to avoid unnecessary updates
  UPDATE public.profiles 
  SET last_active = now() 
  WHERE id = auth.uid() 
    AND (last_active IS NULL OR last_active < now() - INTERVAL '1 minute');
  
  -- If no rows were updated, the user doesn't exist or was updated recently
  -- This is fine, we don't need to do anything
END;
$$;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION public.update_last_active() TO authenticated;

-- 6. Create a more efficient version that only updates if needed
CREATE OR REPLACE FUNCTION public.update_last_active_if_needed()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Only update if last_active is more than 1 minute old
  UPDATE public.profiles 
  SET last_active = now() 
  WHERE id = auth.uid() 
    AND (last_active IS NULL OR last_active < now() - INTERVAL '1 minute');
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count > 0;
END;
$$;

-- 7. Grant permissions for the new function
GRANT EXECUTE ON FUNCTION public.update_last_active_if_needed() TO authenticated;

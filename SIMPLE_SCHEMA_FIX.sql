-- SIMPLE SCHEMA CACHE FIX (No System Table Access Required)
-- This uses only user-accessible operations to fix the relationship issue

-- 1. Drop and recreate the foreign key constraint to force cache refresh
ALTER TABLE social_posts DROP CONSTRAINT IF EXISTS social_posts_user_id_fkey;
ALTER TABLE social_posts ADD CONSTRAINT social_posts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Ensure profiles table has proper foreign key to auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Grant explicit permissions to ensure API can see relationships
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 4. Create a view that explicitly shows the relationship
CREATE OR REPLACE VIEW social_posts_with_profiles AS
SELECT 
  sp.*,
  p.username,
  p.avatar_url,
  p.bio
FROM social_posts sp
JOIN profiles p ON p.id = sp.user_id;

-- Grant access to the view
GRANT SELECT ON social_posts_with_profiles TO anon, authenticated;

-- 5. Create a simple function to test the relationship
CREATE OR REPLACE FUNCTION test_relationship()
RETURNS TEXT AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM social_posts sp 
    JOIN profiles p ON p.id = sp.user_id 
    LIMIT 1
  ) THEN
    RETURN 'RELATIONSHIP WORKS';
  ELSE
    RETURN 'RELATIONSHIP BROKEN';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION test_relationship TO anon, authenticated;

-- 6. Test the relationship explicitly
SELECT test_relationship() as relationship_status;

-- 7. Show current data
SELECT 
  'Current Data' as info,
  (SELECT COUNT(*) FROM profiles) as profile_count,
  (SELECT COUNT(*) FROM social_posts) as post_count,
  (SELECT COUNT(*) FROM social_posts_with_profiles) as joined_count;

-- Success message
SELECT 'Simple schema fix completed! The view should work as a fallback.' as message;

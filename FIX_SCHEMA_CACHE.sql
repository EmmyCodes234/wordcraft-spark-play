-- FIX SUPABASE SCHEMA CACHE ISSUE
-- This forces Supabase to refresh its schema cache and recognize relationships

-- 1. Drop and recreate the foreign key constraint to force cache refresh
ALTER TABLE social_posts DROP CONSTRAINT IF EXISTS social_posts_user_id_fkey;
ALTER TABLE social_posts ADD CONSTRAINT social_posts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Ensure profiles table has proper foreign key to auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Force refresh of the schema cache by updating table metadata
UPDATE pg_class SET relhasindex = relhasindex WHERE relname = 'social_posts';
UPDATE pg_class SET relhasindex = relhasindex WHERE relname = 'profiles';

-- 4. Refresh the PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- 5. Grant explicit permissions to ensure API can see relationships
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 6. Create a view that explicitly shows the relationship
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

-- 7. Test the relationship explicitly
SELECT 
  'relationship_test' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM social_posts sp 
      JOIN profiles p ON p.id = sp.user_id 
      LIMIT 1
    ) THEN '✅ RELATIONSHIP WORKS IN DATABASE'
    ELSE '❌ RELATIONSHIP BROKEN'
  END as status;

-- Success message
SELECT 'Schema cache refresh completed! Try the database test again.' as message;

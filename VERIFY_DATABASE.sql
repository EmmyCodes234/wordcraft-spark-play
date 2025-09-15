-- QUICK DATABASE VERIFICATION TEST
-- Run this to check if all tables and relationships are working

-- Test 1: Check if all tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('profiles', 'social_posts', 'post_likes', 'post_comments', 'post_reactions', 'post_shares', 'comment_reactions', 'media_files') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'social_posts', 'post_likes', 'post_comments', 'post_reactions', 'post_shares', 'comment_reactions', 'media_files')
ORDER BY table_name;

-- Test 2: Check if profiles table has data
SELECT 
  'profiles' as table_name,
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ HAS DATA' ELSE '⚠️ EMPTY' END as status
FROM profiles;

-- Test 3: Check if social_posts table has data
SELECT 
  'social_posts' as table_name,
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ HAS DATA' ELSE '⚠️ EMPTY' END as status
FROM social_posts;

-- Test 4: Test the relationship between social_posts and profiles
SELECT 
  'relationship_test' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM social_posts sp 
      JOIN profiles p ON p.id = sp.user_id 
      LIMIT 1
    ) THEN '✅ RELATIONSHIP WORKS'
    WHEN EXISTS (SELECT 1 FROM social_posts LIMIT 1) THEN '⚠️ POSTS EXIST BUT NO PROFILES'
    WHEN EXISTS (SELECT 1 FROM profiles LIMIT 1) THEN '⚠️ PROFILES EXIST BUT NO POSTS'
    ELSE '⚠️ BOTH TABLES EMPTY'
  END as status;

-- Test 5: Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE WHEN policyname IS NOT NULL THEN '✅ HAS POLICIES' ELSE '❌ NO POLICIES' END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'social_posts', 'post_likes', 'post_comments', 'post_reactions')
ORDER BY tablename, policyname;

-- Test 6: Check if there are any real users
SELECT 
  'real_users' as test_name,
  COUNT(*) as user_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ USERS EXIST' ELSE '⚠️ NO USERS' END as status
FROM auth.users;

-- Test 7: Check if there are any profiles for real users
SELECT 
  'profiles_for_users' as test_name,
  COUNT(*) as profile_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ PROFILES EXIST' ELSE '⚠️ NO PROFILES' END as status
FROM profiles p
JOIN auth.users u ON u.id = p.id;

-- Test 8: Final verification - try to query with join
SELECT 
  sp.id,
  sp.content_text,
  p.username,
  p.avatar_url
FROM social_posts sp
JOIN profiles p ON p.id = sp.user_id
LIMIT 5;

-- Success message
SELECT 'Database verification completed! Check the results above.' as message;

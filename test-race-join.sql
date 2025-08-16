-- Test script to check race joining functionality
-- Run this in your Supabase SQL editor to test the database operations

-- 1. Check if races table exists and has data
SELECT 'Races table check:' as test;
SELECT COUNT(*) as race_count FROM races;

-- 2. Check if race_participants table exists
SELECT 'Race participants table check:' as test;
SELECT COUNT(*) as participant_count FROM race_participants;

-- 3. Check RLS policies
SELECT 'RLS policies check:' as test;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('races', 'race_participants', 'race_words', 'race_results');

-- 4. Check table structure
SELECT 'Table structure check:' as test;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'races' 
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'race_participants' 
ORDER BY ordinal_position;

-- 5. Test inserting a participant (replace with actual values)
-- Note: This will only work if you're authenticated
-- SELECT 'Test participant insertion:' as test;
-- INSERT INTO race_participants (race_id, user_id, username, score, words_found, current_round, is_ready)
-- VALUES ('your-race-id', 'your-user-id', 'TestUser', 0, 0, 0, false)
-- ON CONFLICT DO NOTHING;

-- 6. Check for any recent errors in the logs
SELECT 'Recent activity check:' as test;
SELECT * FROM races ORDER BY created_at DESC LIMIT 5; 
-- SIMPLIFIED DATABASE FIX - Run this FIRST
-- This is a minimal fix for the 500 error during signup

-- 1. Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  user_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create user_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_words_played INTEGER DEFAULT 0,
  total_games_won INTEGER DEFAULT 0,
  total_games_lost INTEGER DEFAULT 0,
  win_streak INTEGER DEFAULT 0,
  best_word_score INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all user stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update their own user stats" ON user_stats;
DROP POLICY IF EXISTS "Users can create their own user stats" ON user_stats;

-- 5. Create RLS policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can create their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view all user stats" ON user_stats FOR SELECT USING (true);
CREATE POLICY "Users can update their own user stats" ON user_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own user stats" ON user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Grant permissions
GRANT ALL ON profiles TO anon, authenticated;
GRANT ALL ON user_stats TO anon, authenticated;

-- 7. Create function to auto-create user profile
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, avatar_url, user_code)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username', 
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    'USER_' || substr(NEW.id::text, 1, 8) || '_' || extract(epoch from now())::text
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to auto-create user stats
CREATE OR REPLACE FUNCTION create_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_stats ON auth.users;

-- 10. Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

CREATE TRIGGER on_auth_user_created_stats
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_stats();

-- 11. Create missing profiles for existing users (if any)
INSERT INTO profiles (id, username, user_code)
SELECT 
  id,
  COALESCE(
    raw_user_meta_data->>'username',
    split_part(email, '@', 1)
  ) as username,
  'USER_' || substr(id::text, 1, 8) || '_' || extract(epoch from created_at)::text as user_code
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- 12. Create missing user_stats for existing users (if any)
INSERT INTO user_stats (user_id)
SELECT id
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_stats)
ON CONFLICT (user_id) DO NOTHING;

-- 13. Verify the setup
SELECT 'Setup Complete' as status;
SELECT 'Profiles count: ' || count(*) as profiles_count FROM profiles;
SELECT 'User stats count: ' || count(*) as user_stats_count FROM user_stats;

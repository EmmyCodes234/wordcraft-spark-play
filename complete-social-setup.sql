-- Complete Social Database Setup (All-in-One)
-- This creates ALL necessary tables and relationships for social features

-- 1. Profiles Table (Essential - must exist first)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add user_code column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'user_code') THEN
    ALTER TABLE profiles ADD COLUMN user_code TEXT UNIQUE;
  END IF;
END $$;

-- 2. Social Posts Table (Basic version first)
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('achievement', 'word_discovery', 'quiz_result', 'streak', 'challenge_complete', 'user_post', 'shared_post')),
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Post Likes Table
CREATE TABLE IF NOT EXISTS post_likes (
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- 4. Friendships Table
CREATE TABLE IF NOT EXISTS friendships (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'accepted' CHECK (status IN ('accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- 5. Friend Requests Table
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (from_user_id != to_user_id)
);

-- 6. Community Events Table
CREATE TABLE IF NOT EXISTS community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'special')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  target INTEGER NOT NULL DEFAULT 1000,
  rewards JSONB NOT NULL DEFAULT '{"xp": 100}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Event Participants Table
CREATE TABLE IF NOT EXISTS event_participants (
  event_id UUID REFERENCES community_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  rank INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- 8. User Stats Table
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_words INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  achievements_count INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user ON friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from_user ON friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view all social posts" ON social_posts;
DROP POLICY IF EXISTS "Users can create their own social posts" ON social_posts;
DROP POLICY IF EXISTS "Users can update their own social posts" ON social_posts;
DROP POLICY IF EXISTS "Users can delete their own social posts" ON social_posts;

DROP POLICY IF EXISTS "Users can view all post likes" ON post_likes;
DROP POLICY IF EXISTS "Users can create post likes" ON post_likes;
DROP POLICY IF EXISTS "Users can delete their own post likes" ON post_likes;

DROP POLICY IF EXISTS "Users can view all friendships" ON friendships;
DROP POLICY IF EXISTS "Users can create friendships" ON friendships;
DROP POLICY IF EXISTS "Users can update their own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can delete their own friendships" ON friendships;

DROP POLICY IF EXISTS "Users can view all friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can create friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update their own friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can delete their own friend requests" ON friend_requests;

DROP POLICY IF EXISTS "Users can view all community events" ON community_events;
DROP POLICY IF EXISTS "Users can view all event participants" ON event_participants;
DROP POLICY IF EXISTS "Users can create event participants" ON event_participants;
DROP POLICY IF EXISTS "Users can update their own event participants" ON event_participants;

DROP POLICY IF EXISTS "Users can view all user stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update their own user stats" ON user_stats;
DROP POLICY IF EXISTS "Users can create their own user stats" ON user_stats;

-- Profiles Policies
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Social Posts Policies
CREATE POLICY "Users can view all social posts" ON social_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own social posts" ON social_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social posts" ON social_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social posts" ON social_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Post Likes Policies
CREATE POLICY "Users can view all post likes" ON post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create post likes" ON post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own post likes" ON post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Friendships Policies
CREATE POLICY "Users can view all friendships" ON friendships
  FOR SELECT USING (true);

CREATE POLICY "Users can create friendships" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can update their own friendships" ON friendships
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friendships" ON friendships
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Friend Requests Policies
CREATE POLICY "Users can view all friend requests" ON friend_requests
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create friend requests" ON friend_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update their own friend requests" ON friend_requests
  FOR UPDATE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can delete their own friend requests" ON friend_requests
  FOR DELETE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Community Events Policies
CREATE POLICY "Users can view all community events" ON community_events
  FOR SELECT USING (true);

-- Event Participants Policies
CREATE POLICY "Users can view all event participants" ON event_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can create event participants" ON event_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own event participants" ON event_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- User Stats Policies
CREATE POLICY "Users can view all user stats" ON user_stats
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own user stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own user stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create profiles for new users
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create user stats for new users
CREATE OR REPLACE FUNCTION create_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_stats ON auth.users;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

CREATE TRIGGER on_auth_user_created_stats
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_stats();

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_social_posts_updated_at ON social_posts;
DROP TRIGGER IF EXISTS update_friend_requests_updated_at ON friend_requests;
DROP TRIGGER IF EXISTS update_community_events_updated_at ON community_events;
DROP TRIGGER IF EXISTS update_user_stats_updated_at ON user_stats;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON social_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friend_requests_updated_at BEFORE UPDATE ON friend_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_events_updated_at BEFORE UPDATE ON community_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON profiles TO anon, authenticated;
GRANT ALL ON social_posts TO anon, authenticated;
GRANT ALL ON post_likes TO anon, authenticated;
GRANT ALL ON friendships TO anon, authenticated;
GRANT ALL ON friend_requests TO anon, authenticated;
GRANT ALL ON community_events TO anon, authenticated;
GRANT ALL ON event_participants TO anon, authenticated;
GRANT ALL ON user_stats TO anon, authenticated;

-- Success message
SELECT 'Complete social database setup completed successfully!' as message;

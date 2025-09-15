-- WordSmith Social Features Database Setup
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Social Posts Table
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('achievement', 'word_discovery', 'quiz_result', 'streak', 'challenge_complete')),
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Post Likes Table
CREATE TABLE IF NOT EXISTS post_likes (
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- 3. Friendships Table
CREATE TABLE IF NOT EXISTS friendships (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'accepted' CHECK (status IN ('accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- 4. Friend Requests Table
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (from_user_id != to_user_id)
);

-- 5. Community Events Table
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

-- 6. Event Participants Table
CREATE TABLE IF NOT EXISTS event_participants (
  event_id UUID REFERENCES community_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  rank INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- 7. User Stats Table (if not exists)
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

-- 8. Profiles Table (if not exists)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  user_code TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
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
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can create their own post likes" ON post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own post likes" ON post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Friendships Policies
CREATE POLICY "Users can view their own friendships" ON friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can update their own friendships" ON friendships
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friendships" ON friendships
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Friend Requests Policies
CREATE POLICY "Users can view their own friend requests" ON friend_requests
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create friend requests" ON friend_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update friend requests sent to them" ON friend_requests
  FOR UPDATE USING (auth.uid() = to_user_id);

CREATE POLICY "Users can delete their own friend requests" ON friend_requests
  FOR DELETE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Community Events Policies
CREATE POLICY "Users can view all community events" ON community_events
  FOR SELECT USING (true);

CREATE POLICY "Admins can create community events" ON community_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update community events" ON community_events
  FOR UPDATE USING (true);

CREATE POLICY "Admins can delete community events" ON community_events
  FOR DELETE USING (true);

-- Event Participants Policies
CREATE POLICY "Users can view all event participants" ON event_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join events" ON event_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" ON event_participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave events" ON event_participants
  FOR DELETE USING (auth.uid() = user_id);

-- User Stats Policies
CREATE POLICY "Users can view all user stats" ON user_stats
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Profiles Policies
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Functions for automatic updates

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
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

-- Function to handle friend request acceptance
CREATE OR REPLACE FUNCTION accept_friend_request(request_id UUID)
RETURNS VOID AS $$
DECLARE
  request_record friend_requests%ROWTYPE;
BEGIN
  -- Get the friend request
  SELECT * INTO request_record FROM friend_requests WHERE id = request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friend request not found';
  END IF;
  
  -- Update the request status
  UPDATE friend_requests SET status = 'accepted' WHERE id = request_id;
  
  -- Create bidirectional friendship
  INSERT INTO friendships (user_id, friend_id) VALUES 
    (request_record.from_user_id, request_record.to_user_id),
    (request_record.to_user_id, request_record.from_user_id)
  ON CONFLICT (user_id, friend_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's friends
CREATE OR REPLACE FUNCTION get_user_friends(user_uuid UUID)
RETURNS TABLE (
  friend_id UUID,
  username TEXT,
  avatar_url TEXT,
  last_active TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.friend_id,
    p.username,
    p.avatar_url,
    us.last_active
  FROM friendships f
  JOIN profiles p ON p.id = f.friend_id
  LEFT JOIN user_stats us ON us.user_id = f.friend_id
  WHERE f.user_id = user_uuid AND f.status = 'accepted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample data for testing (only if tables are empty)
-- Check if profiles table exists and has data before inserting
DO $$
BEGIN
  -- Only insert demo data if profiles table is empty
  IF NOT EXISTS (SELECT 1 FROM profiles LIMIT 1) THEN
    -- Insert demo profiles with proper user_code format
    INSERT INTO profiles (id, username, user_code) VALUES 
      ('00000000-0000-0000-0000-000000000001', 'DemoUser1', 'WS-0001'),
      ('00000000-0000-0000-0000-000000000002', 'DemoUser2', 'WS-0002'),
      ('00000000-0000-0000-0000-000000000003', 'DemoUser3', 'WS-0003')
    ON CONFLICT (id) DO NOTHING
    ON CONFLICT (user_code) DO NOTHING;
  END IF;
END $$;

-- Insert demo user stats (only if user_stats table is empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_stats LIMIT 1) THEN
    INSERT INTO user_stats (user_id, total_words, streak_days, achievements_count, xp) VALUES 
      ('00000000-0000-0000-0000-000000000001', 150, 7, 5, 2500),
      ('00000000-0000-0000-0000-000000000002', 89, 3, 2, 1200),
      ('00000000-0000-0000-0000-000000000003', 203, 12, 8, 3500)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

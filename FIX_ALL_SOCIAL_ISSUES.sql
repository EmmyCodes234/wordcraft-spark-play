-- COMPLETE SOCIAL DATABASE FIX
-- This fixes ALL issues: profiles relationship, enhanced tables, and basic setup

-- ==============================================
-- PART 1: BASIC TABLES SETUP
-- ==============================================

-- 1. Profiles Table (MUST BE FIRST - establishes user identity)
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

-- 2. Social Posts Table (Basic version)
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

-- ==============================================
-- PART 2: ENHANCED TABLES (Facebook-like features)
-- ==============================================

-- 9. Enhanced Social Posts Columns
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS content_text TEXT;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS shared_from_post_id UUID REFERENCES social_posts(id);
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS privacy TEXT DEFAULT 'public' CHECK (privacy IN ('public', 'friends', 'private'));
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 10. Comments Table
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Post Shares Table
CREATE TABLE IF NOT EXISTS post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  shared_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  share_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Post Reactions Table (Enhanced likes with emoji reactions)
CREATE TABLE IF NOT EXISTS post_reactions (
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- 13. Comment Reactions Table
CREATE TABLE IF NOT EXISTS comment_reactions (
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

-- 14. Media Files Table (for image uploads)
CREATE TABLE IF NOT EXISTS media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- PART 3: INDEXES FOR PERFORMANCE
-- ==============================================

-- Basic indexes
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

-- Enhanced indexes
CREATE INDEX IF NOT EXISTS idx_social_posts_shared_from ON social_posts(shared_from_post_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_privacy ON social_posts(privacy);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_original ON post_shares(original_post_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_shared_by ON post_shares(shared_by_user_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON media_files(user_id);

-- ==============================================
-- PART 4: ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts
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

-- Enhanced policies
DROP POLICY IF EXISTS "Users can view all comments" ON post_comments;
DROP POLICY IF EXISTS "Users can create comments" ON post_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON post_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON post_comments;

DROP POLICY IF EXISTS "Users can view all shares" ON post_shares;
DROP POLICY IF EXISTS "Users can create shares" ON post_shares;
DROP POLICY IF EXISTS "Users can delete their own shares" ON post_shares;

DROP POLICY IF EXISTS "Users can view all reactions" ON post_reactions;
DROP POLICY IF EXISTS "Users can create reactions" ON post_reactions;
DROP POLICY IF EXISTS "Users can update their own reactions" ON post_reactions;
DROP POLICY IF EXISTS "Users can delete their own reactions" ON post_reactions;

DROP POLICY IF EXISTS "Users can view all comment reactions" ON comment_reactions;
DROP POLICY IF EXISTS "Users can create comment reactions" ON comment_reactions;
DROP POLICY IF EXISTS "Users can update their own comment reactions" ON comment_reactions;
DROP POLICY IF EXISTS "Users can delete their own comment reactions" ON comment_reactions;

DROP POLICY IF EXISTS "Users can view all media files" ON media_files;
DROP POLICY IF EXISTS "Users can create media files" ON media_files;
DROP POLICY IF EXISTS "Users can update their own media files" ON media_files;
DROP POLICY IF EXISTS "Users can delete their own media files" ON media_files;

-- Create ALL policies
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

-- Enhanced Policies
-- Post Comments Policies
CREATE POLICY "Users can view all comments" ON post_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON post_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Post Shares Policies
CREATE POLICY "Users can view all shares" ON post_shares
  FOR SELECT USING (true);

CREATE POLICY "Users can create shares" ON post_shares
  FOR INSERT WITH CHECK (auth.uid() = shared_by_user_id);

CREATE POLICY "Users can delete their own shares" ON post_shares
  FOR DELETE USING (auth.uid() = shared_by_user_id);

-- Post Reactions Policies
CREATE POLICY "Users can view all reactions" ON post_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can create reactions" ON post_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions" ON post_reactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" ON post_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Comment Reactions Policies
CREATE POLICY "Users can view all comment reactions" ON comment_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can create comment reactions" ON comment_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comment reactions" ON comment_reactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment reactions" ON comment_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Media Files Policies
CREATE POLICY "Users can view all media files" ON media_files
  FOR SELECT USING (true);

CREATE POLICY "Users can create media files" ON media_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media files" ON media_files
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media files" ON media_files
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================
-- PART 5: FUNCTIONS AND TRIGGERS
-- ==============================================

-- Create update_updated_at_column function
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
DROP TRIGGER IF EXISTS update_post_comments_updated_at ON post_comments;

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

CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- PART 6: ENHANCED FUNCTIONS
-- ==============================================

-- Function to get post with all related data
CREATE OR REPLACE FUNCTION get_post_with_details(post_uuid UUID)
RETURNS TABLE (
  post_id UUID,
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  type TEXT,
  content JSONB,
  content_text TEXT,
  image_url TEXT,
  shared_from_post_id UUID,
  privacy TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  reactions_count INTEGER,
  comments_count INTEGER,
  shares_count INTEGER,
  user_reaction TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.user_id,
    p.username,
    p.avatar_url,
    sp.type,
    sp.content,
    sp.content_text,
    sp.image_url,
    sp.shared_from_post_id,
    sp.privacy,
    sp.tags,
    sp.created_at,
    sp.updated_at,
    COALESCE(reaction_counts.total_reactions, 0)::INTEGER as reactions_count,
    COALESCE(comment_counts.total_comments, 0)::INTEGER as comments_count,
    COALESCE(share_counts.total_shares, 0)::INTEGER as shares_count,
    user_reactions.reaction_type as user_reaction
  FROM social_posts sp
  JOIN profiles p ON p.id = sp.user_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as total_reactions
    FROM post_reactions
    GROUP BY post_id
  ) reaction_counts ON reaction_counts.post_id = sp.id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as total_comments
    FROM post_comments
    GROUP BY post_id
  ) comment_counts ON comment_counts.post_id = sp.id
  LEFT JOIN (
    SELECT original_post_id, COUNT(*) as total_shares
    FROM post_shares
    GROUP BY original_post_id
  ) share_counts ON share_counts.original_post_id = sp.id
  LEFT JOIN post_reactions user_reactions ON user_reactions.post_id = sp.id AND user_reactions.user_id = auth.uid()
  WHERE sp.id = post_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get post comments with reactions
CREATE OR REPLACE FUNCTION get_post_comments_with_details(post_uuid UUID)
RETURNS TABLE (
  comment_id UUID,
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  content TEXT,
  image_url TEXT,
  parent_comment_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  reactions_count INTEGER,
  replies_count INTEGER,
  user_reaction TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.id,
    pc.user_id,
    p.username,
    p.avatar_url,
    pc.content,
    pc.image_url,
    pc.parent_comment_id,
    pc.created_at,
    pc.updated_at,
    COALESCE(reaction_counts.total_reactions, 0)::INTEGER as reactions_count,
    COALESCE(reply_counts.total_replies, 0)::INTEGER as replies_count,
    user_reactions.reaction_type as user_reaction
  FROM post_comments pc
  JOIN profiles p ON p.id = pc.user_id
  LEFT JOIN (
    SELECT comment_id, COUNT(*) as total_reactions
    FROM comment_reactions
    GROUP BY comment_id
  ) reaction_counts ON reaction_counts.comment_id = pc.id
  LEFT JOIN (
    SELECT parent_comment_id, COUNT(*) as total_replies
    FROM post_comments
    WHERE parent_comment_id IS NOT NULL
    GROUP BY parent_comment_id
  ) reply_counts ON reply_counts.parent_comment_id = pc.id
  LEFT JOIN comment_reactions user_reactions ON user_reactions.comment_id = pc.id AND user_reactions.user_id = auth.uid()
  WHERE pc.post_id = post_uuid
  ORDER BY pc.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- PART 7: GRANT PERMISSIONS
-- ==============================================

-- Grant permissions on all tables
GRANT ALL ON profiles TO anon, authenticated;
GRANT ALL ON social_posts TO anon, authenticated;
GRANT ALL ON post_likes TO anon, authenticated;
GRANT ALL ON friendships TO anon, authenticated;
GRANT ALL ON friend_requests TO anon, authenticated;
GRANT ALL ON community_events TO anon, authenticated;
GRANT ALL ON event_participants TO anon, authenticated;
GRANT ALL ON user_stats TO anon, authenticated;
GRANT ALL ON post_comments TO anon, authenticated;
GRANT ALL ON post_shares TO anon, authenticated;
GRANT ALL ON post_reactions TO anon, authenticated;
GRANT ALL ON comment_reactions TO anon, authenticated;
GRANT ALL ON media_files TO anon, authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_post_with_details TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_post_comments_with_details TO anon, authenticated;

-- ==============================================
-- SUCCESS MESSAGE
-- ==============================================

SELECT '🎉 COMPLETE SOCIAL DATABASE SETUP SUCCESSFUL! 🎉' as message,
       'All tables, relationships, policies, and functions created!' as details;

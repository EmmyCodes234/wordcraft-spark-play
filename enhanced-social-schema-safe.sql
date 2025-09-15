-- Enhanced Social Features Database Schema (Facebook-like) - SAFE VERSION
-- Run this AFTER the basic social setup
-- This version handles existing policies and tables gracefully

-- 1. Enhanced Social Posts Table
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS content_text TEXT;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS shared_from_post_id UUID REFERENCES social_posts(id);
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS privacy TEXT DEFAULT 'public' CHECK (privacy IN ('public', 'friends', 'private'));
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 2. Comments Table
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

-- 3. Post Shares Table
CREATE TABLE IF NOT EXISTS post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  shared_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  share_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Post Reactions Table (Likes, Love, Laugh, etc.)
CREATE TABLE IF NOT EXISTS post_reactions (
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- 5. Comment Reactions Table
CREATE TABLE IF NOT EXISTS comment_reactions (
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

-- 6. Media Files Table (for image uploads)
CREATE TABLE IF NOT EXISTS media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
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

-- Row Level Security (RLS) Policies

-- Enable RLS on new tables
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
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

-- Functions for enhanced features

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_post_with_details(UUID);
DROP FUNCTION IF EXISTS get_post_comments_with_details(UUID);

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

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_post_comments_updated_at ON post_comments;
CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON post_comments TO anon, authenticated;
GRANT ALL ON post_shares TO anon, authenticated;
GRANT ALL ON post_reactions TO anon, authenticated;
GRANT ALL ON comment_reactions TO anon, authenticated;
GRANT ALL ON media_files TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_post_with_details TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_post_comments_with_details TO anon, authenticated;

-- Success message
SELECT 'Enhanced social features database setup completed successfully!' as message;

-- Database Migration for Enhanced Word Race Features
-- Run this script in your Supabase SQL editor to create all necessary tables and columns

-- Create races table if it doesn't exist
CREATE TABLE IF NOT EXISTS races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id),
  alphagram TEXT,
  word_length INTEGER,
  duration_seconds INTEGER DEFAULT 180,
  max_participants INTEGER DEFAULT 8,
  status TEXT DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE
);

-- Create race_participants table if it doesn't exist
CREATE TABLE IF NOT EXISTS race_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID REFERENCES races(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  score INTEGER DEFAULT 0,
  words_found INTEGER DEFAULT 0,
  current_round INTEGER DEFAULT 0,
  is_ready BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(race_id, user_id)
);

-- Create race_words table if it doesn't exist
CREATE TABLE IF NOT EXISTS race_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID REFERENCES races(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  round_index INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create race_results table if it doesn't exist
CREATE TABLE IF NOT EXISTS race_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID REFERENCES races(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  final_score INTEGER DEFAULT 0,
  words_found INTEGER DEFAULT 0,
  average_time INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to races table (using individual ALTER statements to avoid conflicts)
DO $$ 
BEGIN
    -- Add columns to races table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'races' AND column_name = 'name') THEN
        ALTER TABLE races ADD COLUMN name TEXT DEFAULT 'Anagram Race';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'races' AND column_name = 'type') THEN
        ALTER TABLE races ADD COLUMN type TEXT DEFAULT 'sprint';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'races' AND column_name = 'difficulty') THEN
        ALTER TABLE races ADD COLUMN difficulty TEXT DEFAULT 'medium';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'races' AND column_name = 'rounds') THEN
        ALTER TABLE races ADD COLUMN rounds INTEGER DEFAULT 10;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'races' AND column_name = 'is_public') THEN
        ALTER TABLE races ADD COLUMN is_public BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'races' AND column_name = 'probability_mode') THEN
        ALTER TABLE races ADD COLUMN probability_mode BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'races' AND column_name = 'min_probability') THEN
        ALTER TABLE races ADD COLUMN min_probability INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'races' AND column_name = 'max_probability') THEN
        ALTER TABLE races ADD COLUMN max_probability INTEGER DEFAULT 100;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'races' AND column_name = 'current_players') THEN
        ALTER TABLE races ADD COLUMN current_players INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add missing columns to race_participants table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'race_participants' AND column_name = 'joined_at') THEN
        ALTER TABLE race_participants ADD COLUMN joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'race_participants' AND column_name = 'finished_at') THEN
        ALTER TABLE race_participants ADD COLUMN finished_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'race_participants' AND column_name = 'current_round') THEN
        ALTER TABLE race_participants ADD COLUMN current_round INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'race_participants' AND column_name = 'is_ready') THEN
        ALTER TABLE race_participants ADD COLUMN is_ready BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'race_participants' AND column_name = 'words_found') THEN
        ALTER TABLE race_participants ADD COLUMN words_found INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'race_participants' AND column_name = 'streak') THEN
        ALTER TABLE race_participants ADD COLUMN streak INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'race_participants' AND column_name = 'average_word_score') THEN
        ALTER TABLE race_participants ADD COLUMN average_word_score INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'race_participants' AND column_name = 'rare_words_found') THEN
        ALTER TABLE race_participants ADD COLUMN rare_words_found INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add unique constraint to prevent duplicate participants
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'race_participants_race_id_user_id_key'
    ) THEN
        ALTER TABLE race_participants ADD CONSTRAINT race_participants_race_id_user_id_key UNIQUE(race_id, user_id);
    END IF;
END $$;

-- Add missing columns to race_words table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'race_words' AND column_name = 'submitted_at') THEN
        ALTER TABLE race_words ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'race_words' AND column_name = 'score') THEN
        ALTER TABLE race_words ADD COLUMN score INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'race_words' AND column_name = 'frequency') THEN
        ALTER TABLE race_words ADD COLUMN frequency INTEGER DEFAULT 50;
    END IF;
END $$;

-- Add missing columns to race_results table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'race_results' AND column_name = 'completed_at') THEN
        ALTER TABLE race_results ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'race_results' AND column_name = 'streak') THEN
        ALTER TABLE race_results ADD COLUMN streak INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'race_results' AND column_name = 'rare_words_found') THEN
        ALTER TABLE race_results ADD COLUMN rare_words_found INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'race_results' AND column_name = 'average_word_score') THEN
        ALTER TABLE race_results ADD COLUMN average_word_score INTEGER DEFAULT 0;
    END IF;
END $$;

-- Update existing records with default values
UPDATE races SET 
  name = COALESCE(name, 'Anagram Race'),
  type = COALESCE(type, 'sprint'),
  difficulty = COALESCE(difficulty, 'medium'),
  rounds = COALESCE(rounds, 10),
  is_public = COALESCE(is_public, true),
  probability_mode = COALESCE(probability_mode, false),
  min_probability = COALESCE(min_probability, 0),
  max_probability = COALESCE(max_probability, 100),
  current_players = COALESCE(current_players, 0);

-- Create indexes for better performance (only if they don't exist)
DO $$ 
BEGIN
    -- Races indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_races_status') THEN
        CREATE INDEX idx_races_status ON races(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_races_created_at') THEN
        CREATE INDEX idx_races_created_at ON races(created_at);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_races_creator_id') THEN
        CREATE INDEX idx_races_creator_id ON races(creator_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_races_is_public') THEN
        CREATE INDEX idx_races_is_public ON races(is_public);
    END IF;
    
    -- Race participants indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_race_participants_race_id') THEN
        CREATE INDEX idx_race_participants_race_id ON race_participants(race_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_race_participants_user_id') THEN
        CREATE INDEX idx_race_participants_user_id ON race_participants(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_race_participants_joined_at') THEN
        CREATE INDEX idx_race_participants_joined_at ON race_participants(joined_at);
    END IF;
    
    -- Race words indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_race_words_race_id') THEN
        CREATE INDEX idx_race_words_race_id ON race_words(race_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_race_words_user_id') THEN
        CREATE INDEX idx_race_words_user_id ON race_words(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_race_words_round_index') THEN
        CREATE INDEX idx_race_words_round_index ON race_words(round_index);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_race_words_submitted_at') THEN
        CREATE INDEX idx_race_words_submitted_at ON race_words(submitted_at);
    END IF;
    
    -- Race results indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_race_results_race_id') THEN
        CREATE INDEX idx_race_results_race_id ON race_results(race_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_race_results_user_id') THEN
        CREATE INDEX idx_race_results_user_id ON race_results(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_race_results_final_score') THEN
        CREATE INDEX idx_race_results_final_score ON race_results(final_score);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_race_results_completed_at') THEN
        CREATE INDEX idx_race_results_completed_at ON race_results(completed_at);
    END IF;
END $$;

-- Enable Row Level Security (RLS) if not already enabled
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Races are viewable by everyone" ON races;
DROP POLICY IF EXISTS "Users can create races" ON races;
DROP POLICY IF EXISTS "Race creators can update their races" ON races;
DROP POLICY IF EXISTS "Race creators can delete their races" ON races;

DROP POLICY IF EXISTS "Participants can view race participants" ON race_participants;
DROP POLICY IF EXISTS "Users can join races" ON race_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON race_participants;
DROP POLICY IF EXISTS "Users can leave races" ON race_participants;

DROP POLICY IF EXISTS "Race words are viewable by participants" ON race_words;
DROP POLICY IF EXISTS "Users can submit words" ON race_words;
DROP POLICY IF EXISTS "Users can update their own words" ON race_words;

DROP POLICY IF EXISTS "Race results are viewable by everyone" ON race_results;
DROP POLICY IF EXISTS "Users can save their results" ON race_results;

-- Create RLS policies for races table
CREATE POLICY "Races are viewable by everyone" ON races
  FOR SELECT USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create races" ON races
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Race creators can update their races" ON races
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Race creators can delete their races" ON races
  FOR DELETE USING (creator_id = auth.uid());

-- Create RLS policies for race_participants table
CREATE POLICY "Participants can view race participants" ON race_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join races" ON race_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation" ON race_participants
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can leave races" ON race_participants
  FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for race_words table
CREATE POLICY "Race words are viewable by participants" ON race_words
  FOR SELECT USING (true);

CREATE POLICY "Users can submit words" ON race_words
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own words" ON race_words
  FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for race_results table
CREATE POLICY "Race results are viewable by everyone" ON race_results
  FOR SELECT USING (true);

CREATE POLICY "Users can save their results" ON race_results
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create functions for common operations
CREATE OR REPLACE FUNCTION update_race_player_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE races 
    SET current_players = current_players + 1 
    WHERE id = NEW.race_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE races 
    SET current_players = GREATEST(current_players - 1, 0) 
    WHERE id = OLD.race_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic player count updates
DROP TRIGGER IF EXISTS update_race_player_count_trigger ON race_participants;
CREATE TRIGGER update_race_player_count_trigger
  AFTER INSERT OR DELETE ON race_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_race_player_count();

-- Grant necessary permissions
GRANT ALL ON races TO authenticated;
GRANT ALL ON race_participants TO authenticated;
GRANT ALL ON race_words TO authenticated;
GRANT ALL ON race_results TO authenticated;

-- Grant usage on sequences if they exist
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated; 
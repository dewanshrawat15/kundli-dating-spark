
-- Drop existing tables and functions to start fresh
DROP TRIGGER IF EXISTS trigger_mutual_like ON profile_interactions;
DROP FUNCTION IF EXISTS handle_mutual_like();
DROP TABLE IF EXISTS profiles_match CASCADE;

-- Recreate chat_rooms table with proper structure
DROP TABLE IF EXISTS chat_rooms CASCADE;
CREATE TABLE chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  -- Ensure unique chat rooms and consistent ordering
  CONSTRAINT unique_chat_room UNIQUE (user1_id, user2_id),
  CONSTRAINT ordered_chat_users CHECK (user1_id < user2_id)
);

-- Create profiles_match table
CREATE TABLE profiles_match (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL DEFAULT 85,
  compatibility_description TEXT DEFAULT 'Mutual interest detected - compatibility analysis pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  
  -- Ensure unique matches and consistent ordering
  CONSTRAINT unique_match_pair UNIQUE (user_a_id, user_b_id),
  CONSTRAINT ordered_user_ids CHECK (user_a_id < user_b_id)
);

-- Create function to handle mutual likes
CREATE OR REPLACE FUNCTION handle_mutual_like()
RETURNS TRIGGER AS $$
DECLARE
  mutual_like_exists BOOLEAN := FALSE;
  match_exists BOOLEAN := FALSE;
  chat_room_exists BOOLEAN := FALSE;
  ordered_user_a UUID;
  ordered_user_b UUID;
  new_match_id UUID;
  new_chat_room_id UUID;
BEGIN
  -- Only process 'liked' interactions
  IF NEW.interaction_type != 'liked' THEN
    RETURN NEW;
  END IF;
  
  -- Check if target user has also liked the current user
  SELECT EXISTS (
    SELECT 1 FROM profile_interactions 
    WHERE user_id = NEW.target_user_id 
      AND target_user_id = NEW.user_id 
      AND interaction_type = 'liked'
  ) INTO mutual_like_exists;
  
  -- If mutual like exists, create match and chat room
  IF mutual_like_exists THEN
    -- Order user IDs consistently (smaller UUID first)
    IF NEW.user_id < NEW.target_user_id THEN
      ordered_user_a := NEW.user_id;
      ordered_user_b := NEW.target_user_id;
    ELSE
      ordered_user_a := NEW.target_user_id;
      ordered_user_b := NEW.user_id;
    END IF;
    
    -- Check if match already exists
    SELECT EXISTS (
      SELECT 1 FROM profiles_match 
      WHERE user_a_id = ordered_user_a AND user_b_id = ordered_user_b
    ) INTO match_exists;
    
    -- Create match if it doesn't exist
    IF NOT match_exists THEN
      INSERT INTO profiles_match (user_a_id, user_b_id)
      VALUES (ordered_user_a, ordered_user_b)
      RETURNING id INTO new_match_id;
      
      RAISE NOTICE 'Created match % for users % and %', new_match_id, ordered_user_a, ordered_user_b;
    END IF;
    
    -- Check if chat room already exists
    SELECT EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE user1_id = ordered_user_a AND user2_id = ordered_user_b
    ) INTO chat_room_exists;
    
    -- Create chat room if it doesn't exist
    IF NOT chat_room_exists THEN
      INSERT INTO chat_rooms (user1_id, user2_id)
      VALUES (ordered_user_a, ordered_user_b)
      RETURNING id INTO new_chat_room_id;
      
      RAISE NOTICE 'Created chat room % for users % and %', new_chat_room_id, ordered_user_a, ordered_user_b;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on profile_interactions
CREATE TRIGGER trigger_mutual_like
  AFTER INSERT ON profile_interactions
  FOR EACH ROW
  EXECUTE FUNCTION handle_mutual_like();

-- Enable RLS on all tables
ALTER TABLE profiles_match ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_interactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own matches" ON profiles_match;
DROP POLICY IF EXISTS "System can insert matches" ON profiles_match;
DROP POLICY IF EXISTS "Users can update their own matches" ON profiles_match;
DROP POLICY IF EXISTS "Users can view their own chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "System can insert chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users can view their own interactions" ON profile_interactions;
DROP POLICY IF EXISTS "Users can insert their own interactions" ON profile_interactions;

-- RLS policies for profiles_match
CREATE POLICY "Users can view their own matches" 
  ON profiles_match 
  FOR SELECT 
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "System can insert matches" 
  ON profiles_match 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update their own matches" 
  ON profiles_match 
  FOR UPDATE 
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- RLS policies for chat_rooms
CREATE POLICY "Users can view their own chat rooms" 
  ON chat_rooms 
  FOR SELECT 
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can insert chat rooms" 
  ON chat_rooms 
  FOR INSERT 
  WITH CHECK (true);

-- RLS policies for profile_interactions
CREATE POLICY "Users can view their own interactions" 
  ON profile_interactions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions" 
  ON profile_interactions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Add performance indexes
CREATE INDEX idx_profiles_match_user_a ON profiles_match(user_a_id);
CREATE INDEX idx_profiles_match_user_b ON profiles_match(user_b_id);
CREATE INDEX idx_profiles_match_both ON profiles_match(user_a_id, user_b_id);
CREATE INDEX idx_chat_rooms_user1 ON chat_rooms(user1_id);
CREATE INDEX idx_chat_rooms_user2 ON chat_rooms(user2_id);
CREATE INDEX idx_chat_rooms_both ON chat_rooms(user1_id, user2_id);
CREATE INDEX idx_profile_interactions_user ON profile_interactions(user_id);
CREATE INDEX idx_profile_interactions_target ON profile_interactions(target_user_id);
CREATE INDEX idx_profile_interactions_type ON profile_interactions(interaction_type);
CREATE INDEX idx_profile_interactions_mutual ON profile_interactions(user_id, target_user_id, interaction_type);

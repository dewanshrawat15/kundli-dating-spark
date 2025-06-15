
-- Drop all existing policies for matches table
DROP POLICY IF EXISTS "Users can view their own matches" ON matches;
DROP POLICY IF EXISTS "Users can insert their own matches" ON matches;
DROP POLICY IF EXISTS "Users can insert matches" ON matches;
DROP POLICY IF EXISTS "Users can update their own matches" ON matches;

-- Drop all existing policies for chat_rooms table
DROP POLICY IF EXISTS "Users can view their own chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users can insert chat rooms" ON chat_rooms;

-- Create RLS policies for matches table that allow the trigger to work
CREATE POLICY "Users can view their own matches" 
  ON matches 
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = target_user_id);

CREATE POLICY "Users can insert matches" 
  ON matches 
  FOR INSERT 
  WITH CHECK (true); -- Allow trigger to insert matches

CREATE POLICY "Users can update their own matches" 
  ON matches 
  FOR UPDATE 
  USING (auth.uid() = user_id OR auth.uid() = target_user_id);

-- Create RLS policies for chat_rooms table that allow the trigger to work
CREATE POLICY "Users can view their own chat rooms" 
  ON chat_rooms 
  FOR SELECT 
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can insert chat rooms" 
  ON chat_rooms 
  FOR INSERT 
  WITH CHECK (true); -- Allow trigger to insert chat rooms

-- Update the trigger function to use 'matched' status
CREATE OR REPLACE FUNCTION handle_mutual_like()
RETURNS TRIGGER AS $$
DECLARE
  match_exists BOOLEAN := FALSE;
  chat_room_id UUID;
BEGIN
  -- Check if this is a 'liked' interaction
  IF NEW.interaction_type = 'liked' THEN
    -- Check if the target user has also liked the current user
    IF EXISTS (
      SELECT 1 FROM profile_interactions 
      WHERE user_id = NEW.target_user_id 
        AND target_user_id = NEW.user_id 
        AND interaction_type = 'liked'
    ) THEN
      -- Check if match already exists to avoid duplicates
      SELECT EXISTS(
        SELECT 1 FROM matches 
        WHERE (user_id = NEW.user_id AND target_user_id = NEW.target_user_id)
           OR (user_id = NEW.target_user_id AND target_user_id = NEW.user_id)
      ) INTO match_exists;
      
      -- Only create matches and chat room if they don't exist
      IF NOT match_exists THEN
        -- Create matches for both users with 'matched' status
        INSERT INTO matches (user_id, target_user_id, status, created_at)
        VALUES (NEW.user_id, NEW.target_user_id, 'matched', NOW());
        
        INSERT INTO matches (user_id, target_user_id, status, created_at)
        VALUES (NEW.target_user_id, NEW.user_id, 'matched', NOW());
        
        -- Create a chat room for the matched users
        INSERT INTO chat_rooms (user1_id, user2_id, created_at)
        VALUES (
          LEAST(NEW.user_id, NEW.target_user_id),
          GREATEST(NEW.user_id, NEW.target_user_id),
          NOW()
        )
        RETURNING id INTO chat_room_id;
        
        -- Log the chat room creation for debugging
        RAISE NOTICE 'Created chat room % for users % and %', chat_room_id, NEW.user_id, NEW.target_user_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

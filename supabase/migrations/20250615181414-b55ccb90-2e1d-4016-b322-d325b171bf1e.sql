
-- Update the function to also create chat rooms when matches are created
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
        -- Create matches for both users
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

-- Enable RLS on chat_rooms table
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_rooms
DROP POLICY IF EXISTS "Users can view their own chat rooms" ON chat_rooms;
CREATE POLICY "Users can view their own chat rooms" 
  ON chat_rooms 
  FOR SELECT 
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can insert chat rooms" ON chat_rooms;
CREATE POLICY "Users can insert chat rooms" 
  ON chat_rooms 
  FOR INSERT 
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Add unique constraint to prevent duplicate chat rooms
ALTER TABLE chat_rooms 
DROP CONSTRAINT IF EXISTS unique_chat_room_users;

ALTER TABLE chat_rooms 
ADD CONSTRAINT unique_chat_room_users 
UNIQUE (user1_id, user2_id);

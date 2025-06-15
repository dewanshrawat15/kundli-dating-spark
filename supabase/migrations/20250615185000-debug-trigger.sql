
-- First, let's add some debugging to the trigger function
CREATE OR REPLACE FUNCTION handle_mutual_like()
RETURNS TRIGGER AS $$
DECLARE
  match_exists BOOLEAN := FALSE;
  chat_room_id UUID;
  mutual_like_exists BOOLEAN := FALSE;
BEGIN
  -- Log the trigger execution
  RAISE NOTICE 'Trigger fired for user % liking user % with interaction type %', 
    NEW.user_id, NEW.target_user_id, NEW.interaction_type;
  
  -- Check if this is a 'liked' interaction
  IF NEW.interaction_type = 'liked' THEN
    -- Check if the target user has also liked the current user
    SELECT EXISTS (
      SELECT 1 FROM profile_interactions 
      WHERE user_id = NEW.target_user_id 
        AND target_user_id = NEW.user_id 
        AND interaction_type = 'liked'
    ) INTO mutual_like_exists;
    
    RAISE NOTICE 'Mutual like exists: %', mutual_like_exists;
    
    IF mutual_like_exists THEN
      -- Check if match already exists to avoid duplicates
      SELECT EXISTS(
        SELECT 1 FROM matches 
        WHERE (user_id = NEW.user_id AND target_user_id = NEW.target_user_id)
           OR (user_id = NEW.target_user_id AND target_user_id = NEW.user_id)
      ) INTO match_exists;
      
      RAISE NOTICE 'Match already exists: %', match_exists;
      
      -- Only create matches and chat room if they don't exist
      IF NOT match_exists THEN
        RAISE NOTICE 'Creating matches and chat room for users % and %', NEW.user_id, NEW.target_user_id;
        
        -- Create matches for both users with 'matched' status
        INSERT INTO matches (user_id, target_user_id, status, created_at)
        VALUES (NEW.user_id, NEW.target_user_id, 'matched', NOW());
        
        INSERT INTO matches (user_id, target_user_id, status, created_at)
        VALUES (NEW.target_user_id, NEW.user_id, 'matched', NOW());
        
        RAISE NOTICE 'Matches created successfully';
        
        -- Create a chat room for the matched users
        INSERT INTO chat_rooms (user1_id, user2_id, created_at)
        VALUES (
          LEAST(NEW.user_id, NEW.target_user_id),
          GREATEST(NEW.user_id, NEW.target_user_id),
          NOW()
        )
        RETURNING id INTO chat_room_id;
        
        RAISE NOTICE 'Created chat room % for users % and %', chat_room_id, NEW.user_id, NEW.target_user_id;
      ELSE
        RAISE NOTICE 'Match already exists, skipping creation';
      END IF;
    ELSE
      RAISE NOTICE 'No mutual like found, skipping match creation';
    END IF;
  ELSE
    RAISE NOTICE 'Not a liked interaction, skipping';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger is attached
DROP TRIGGER IF EXISTS trigger_mutual_like ON profile_interactions;
CREATE TRIGGER trigger_mutual_like
  AFTER INSERT ON profile_interactions
  FOR EACH ROW
  EXECUTE FUNCTION handle_mutual_like();

-- Enable RLS on all tables if not already enabled
ALTER TABLE profile_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;


-- Create a function to handle mutual likes and create matches
CREATE OR REPLACE FUNCTION handle_mutual_like()
RETURNS TRIGGER AS $$
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
      -- Create a match if it doesn't already exist
      INSERT INTO matches (user_id, target_user_id, status, created_at)
      VALUES (NEW.user_id, NEW.target_user_id, 'active', NOW())
      ON CONFLICT DO NOTHING;
      
      -- Also create the reverse match for easier querying
      INSERT INTO matches (user_id, target_user_id, status, created_at)
      VALUES (NEW.target_user_id, NEW.user_id, 'active', NOW())
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_mutual_like ON profile_interactions;
CREATE TRIGGER trigger_mutual_like
  AFTER INSERT ON profile_interactions
  FOR EACH ROW
  EXECUTE FUNCTION handle_mutual_like();

-- Add a unique constraint to prevent duplicate matches
ALTER TABLE matches 
DROP CONSTRAINT IF EXISTS unique_user_target_match;

ALTER TABLE matches 
ADD CONSTRAINT unique_user_target_match 
UNIQUE (user_id, target_user_id);

-- Enable RLS on matches table
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for matches
DROP POLICY IF EXISTS "Users can view their own matches" ON matches;
CREATE POLICY "Users can view their own matches" 
  ON matches 
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = target_user_id);

DROP POLICY IF EXISTS "Users can insert their own matches" ON matches;
CREATE POLICY "Users can insert their own matches" 
  ON matches 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Enable RLS on profile_interactions table  
ALTER TABLE profile_interactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profile_interactions
DROP POLICY IF EXISTS "Users can view their own interactions" ON profile_interactions;
CREATE POLICY "Users can view their own interactions" 
  ON profile_interactions 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own interactions" ON profile_interactions;
CREATE POLICY "Users can insert their own interactions" 
  ON profile_interactions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own interactions" ON profile_interactions;
CREATE POLICY "Users can update their own interactions" 
  ON profile_interactions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

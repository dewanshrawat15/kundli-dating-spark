
-- Create a table to track profile interactions (views, likes, passes)
CREATE TABLE public.profile_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('viewed', 'liked', 'passed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT profile_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE,
  CONSTRAINT profile_interactions_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES profiles (id) ON DELETE CASCADE,
  
  -- Ensure unique combination of user, target, and interaction type
  CONSTRAINT profile_interactions_user_target_type_unique UNIQUE (user_id, target_user_id, interaction_type)
);

-- Create indexes for better performance
CREATE INDEX idx_profile_interactions_user_id ON public.profile_interactions (user_id);
CREATE INDEX idx_profile_interactions_target_user_id ON public.profile_interactions (target_user_id);
CREATE INDEX idx_profile_interactions_user_type ON public.profile_interactions (user_id, interaction_type);

-- Add RLS policies for profile interactions
ALTER TABLE public.profile_interactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own interactions
CREATE POLICY "Users can view their own interactions" 
  ON public.profile_interactions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own interactions
CREATE POLICY "Users can insert their own interactions" 
  ON public.profile_interactions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own interactions
CREATE POLICY "Users can update their own interactions" 
  ON public.profile_interactions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add a column to profiles table to track when a profile was last shown (optional optimization)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_shown_at TIMESTAMP WITH TIME ZONE;

-- Create a function to get unseen profiles for a user
CREATE OR REPLACE FUNCTION get_unseen_profiles(
  requesting_user_id UUID,
  city_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  age INTEGER,
  bio TEXT,
  current_city TEXT,
  sexual_orientation TEXT,
  dating_preference TEXT,
  profile_images TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    EXTRACT(YEAR FROM AGE(p.date_of_birth))::INTEGER as age,
    p.bio,
    p.current_city,
    p.sexual_orientation::TEXT,
    p.dating_preference::TEXT,
    p.profile_images
  FROM profiles p
  WHERE p.id != requesting_user_id
    AND p.is_onboarding_complete = true
    AND (city_filter IS NULL OR p.current_city = city_filter)
    AND p.id NOT IN (
      SELECT pi.target_user_id 
      FROM profile_interactions pi 
      WHERE pi.user_id = requesting_user_id
    )
  ORDER BY p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

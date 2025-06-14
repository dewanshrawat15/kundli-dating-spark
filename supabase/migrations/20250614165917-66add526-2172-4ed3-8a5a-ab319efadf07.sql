
-- Enable RLS on profiles table if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view other users' basic profile information for matching
CREATE POLICY "Users can view other profiles for matching" 
  ON public.profiles 
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND 
    id != auth.uid() AND 
    is_onboarding_complete = true
  );

-- Create policy to allow users to view and update their own profile
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Add current_city column to profiles table for location-based matching
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_city text;

-- Create an index for better performance on location-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles (current_city, is_onboarding_complete);


-- Update the get_unseen_profiles function to include birth data for astrological matching
CREATE OR REPLACE FUNCTION public.get_unseen_profiles(requesting_user_id uuid, city_filter text DEFAULT NULL::text, limit_count integer DEFAULT 20)
 RETURNS TABLE(id uuid, name text, age integer, bio text, current_city text, sexual_orientation text, dating_preference text, profile_images text[], date_of_birth date, time_of_birth time, place_of_birth text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
    p.profile_images,
    p.date_of_birth,
    p.time_of_birth,
    p.place_of_birth
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
$function$

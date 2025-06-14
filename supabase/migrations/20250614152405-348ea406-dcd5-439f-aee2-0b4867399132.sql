
-- Update the handle_new_user function to provide a default name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, name, date_of_birth, place_of_birth, time_of_birth, sexual_orientation, dating_preference)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'User'), -- Default to 'User' if no name provided
    '1990-01-01', -- Default date of birth
    'Unknown', -- Default place of birth
    '12:00:00', -- Default time of birth
    'straight', -- Default sexual orientation
    'everyone' -- Default dating preference
  );
  RETURN NEW;
END;
$function$


-- Insert profiles for users who don't have profiles yet
-- Creates Indian girl profiles with mock data and Delhi as current city
INSERT INTO public.profiles (
  id, 
  email, 
  name, 
  date_of_birth, 
  place_of_birth, 
  time_of_birth, 
  sexual_orientation, 
  dating_preference,
  current_city,
  bio,
  is_onboarding_complete
)
SELECT 
  au.id,
  au.email,
  CASE (random() * 20)::int
    WHEN 0 THEN 'Priya Sharma'
    WHEN 1 THEN 'Ananya Gupta'
    WHEN 2 THEN 'Kavya Patel'
    WHEN 3 THEN 'Isha Verma'
    WHEN 4 THEN 'Riya Singh'
    WHEN 5 THEN 'Meera Agarwal'
    WHEN 6 THEN 'Sanya Joshi'
    WHEN 7 THEN 'Aditi Malhotra'
    WHEN 8 THEN 'Nisha Reddy'
    WHEN 9 THEN 'Pooja Mehta'
    WHEN 10 THEN 'Shreya Kapoor'
    WHEN 11 THEN 'Divya Nair'
    WHEN 12 THEN 'Rhea Khanna'
    WHEN 13 THEN 'Tanya Iyer'
    WHEN 14 THEN 'Sakshi Bhatt'
    WHEN 15 THEN 'Neha Dubey'
    WHEN 16 THEN 'Aarti Saxena'
    WHEN 17 THEN 'Simran Arora'
    WHEN 18 THEN 'Deepika Rao'
    WHEN 19 THEN 'Kritika Bansal'
    ELSE 'Anjali Kumar'
  END as name,
  -- Random birth date between 1995-2002 (ages 22-29)
  ('1995-01-01'::date + (random() * 2555)::int) as date_of_birth,
  CASE (random() * 10)::int
    WHEN 0 THEN 'Mumbai, Maharashtra, India'
    WHEN 1 THEN 'Delhi, India'
    WHEN 2 THEN 'Bangalore, Karnataka, India'
    WHEN 3 THEN 'Chennai, Tamil Nadu, India'
    WHEN 4 THEN 'Kolkata, West Bengal, India'
    WHEN 5 THEN 'Pune, Maharashtra, India'
    WHEN 6 THEN 'Hyderabad, Telangana, India'
    WHEN 7 THEN 'Jaipur, Rajasthan, India'
    WHEN 8 THEN 'Lucknow, Uttar Pradesh, India'
    ELSE 'Ahmedabad, Gujarat, India'
  END as place_of_birth,
  -- Random time between 6 AM and 11 PM
  (TIME '06:00:00' + (random() * INTERVAL '17 hours')) as time_of_birth,
  'straight'::sexual_orientation as sexual_orientation,
  CASE (random() * 3)::int
    WHEN 0 THEN 'men'::dating_preference
    WHEN 1 THEN 'everyone'::dating_preference
    ELSE 'men'::dating_preference
  END as dating_preference,
  'Delhi' as current_city,
  CASE (random() * 15)::int
    WHEN 0 THEN 'Love exploring new cafes and trying different cuisines. Looking for someone who shares my passion for travel and adventure!'
    WHEN 1 THEN 'Software engineer by day, artist by night. I enjoy painting, dancing, and long conversations about life and dreams.'
    WHEN 2 THEN 'Yoga enthusiast and book lover. Seeking a genuine connection with someone who values mindfulness and personal growth.'
    WHEN 3 THEN 'Foodie who loves cooking traditional Indian dishes. Always up for trying new restaurants and exploring local markets.'
    WHEN 4 THEN 'Travel blogger with a passion for discovering hidden gems. Looking for a partner to explore the world with!'
    WHEN 5 THEN 'Classical dancer and music lover. I find joy in the arts and would love to share cultural experiences with someone special.'
    WHEN 6 THEN 'Fitness enthusiast who loves morning runs and weekend hikes. Seeking someone who enjoys an active lifestyle.'
    WHEN 7 THEN 'Creative professional working in fashion design. Love art galleries, weekend markets, and meaningful conversations.'
    WHEN 8 THEN 'Medical student with a love for helping others. Enjoy quiet evenings with good books and stimulating discussions.'
    WHEN 9 THEN 'Marketing professional who loves organizing events and bringing people together. Looking for my adventure partner!'
    WHEN 10 THEN 'Nature lover who enjoys weekend getaways to the mountains. Seeking someone who appreciates simple pleasures in life.'
    WHEN 11 THEN 'Photographer capturing beautiful moments. Love street food, indie music, and exploring the city on weekends.'
    WHEN 12 THEN 'Teacher passionate about education and social causes. Looking for someone who shares my values and zest for life.'
    WHEN 13 THEN 'Interior designer with an eye for beauty. Enjoy home decor, gardening, and creating beautiful spaces.'
    WHEN 14 THEN 'Content writer and social media enthusiast. Love staying updated with trends while cherishing traditional values.'
    ELSE 'Finance professional who loves planning trips and trying new experiences. Seeking a loyal and caring life partner.'
  END as bio,
  true as is_onboarding_complete
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

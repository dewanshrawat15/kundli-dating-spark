
-- Create RLS policies for the existing profile-images bucket (skip if they already exist)

-- Policy to allow users to upload their own profile images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can upload their own profile images'
    ) THEN
        CREATE POLICY "Users can upload their own profile images"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END $$;

-- Policy to allow users to view all profile images (public read)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Anyone can view profile images'
    ) THEN
        CREATE POLICY "Anyone can view profile images"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'profile-images');
    END IF;
END $$;

-- Policy to allow users to update their own profile images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can update their own profile images'
    ) THEN
        CREATE POLICY "Users can update their own profile images"
        ON storage.objects FOR UPDATE
        USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END $$;

-- Policy to allow users to delete their own profile images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can delete their own profile images'
    ) THEN
        CREATE POLICY "Users can delete their own profile images"
        ON storage.objects FOR DELETE
        USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END $$;

/*
# Foliora Social Platform — Storage Bucket for Avatars

Creates a public storage bucket for user avatar uploads.
*/

-- Create avatars bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies before creating
DROP POLICY IF EXISTS "Avatar uploads" ON storage.objects;
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar updates" ON storage.objects;
DROP POLICY IF EXISTS "Avatar deletes" ON storage.objects;

-- Allow authenticated users to upload avatars
CREATE POLICY "Avatar uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow public read access to avatars
CREATE POLICY "Avatar public read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Avatar updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Allow users to delete their own avatars
CREATE POLICY "Avatar deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

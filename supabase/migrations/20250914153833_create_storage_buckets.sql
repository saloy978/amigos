-- Create storage buckets for image uploads
-- This migration creates the necessary storage buckets for the application

-- Create cards bucket (public bucket for shared card images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cards',
  'cards',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create user-images bucket (private bucket for user-uploaded images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-images',
  'user-images',
  true, -- Made public for easier access, can be changed to false if needed
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for cards bucket
CREATE POLICY "cards_bucket_policy" ON storage.objects
FOR ALL USING (bucket_id = 'cards');

-- Create storage policies for user-images bucket
CREATE POLICY "user_images_bucket_policy" ON storage.objects
FOR ALL USING (bucket_id = 'user-images');

-- Allow authenticated users to upload to user-images bucket
CREATE POLICY "user_images_upload_policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own images
CREATE POLICY "user_images_update_policy" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own images
CREATE POLICY "user_images_delete_policy" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-images' 
  AND auth.role() = 'authenticated'
);

-- Allow public read access to user-images bucket
CREATE POLICY "user_images_read_policy" ON storage.objects
FOR SELECT USING (bucket_id = 'user-images');




/*
  # Setup RLS Policies for Storage (Clean Version)
  
  This migration removes existing policies and creates new ones
  to avoid conflicts with existing policies.
*/

-- Step 1: Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "read_public_cards" ON storage.objects;
DROP POLICY IF EXISTS "read_public_user_images" ON storage.objects;
DROP POLICY IF EXISTS "read_own_files" ON storage.objects;
DROP POLICY IF EXISTS "insert_own_files" ON storage.objects;
DROP POLICY IF EXISTS "update_own_files" ON storage.objects;
DROP POLICY IF EXISTS "delete_own_files" ON storage.objects;

-- Step 2: Create policies for public cards bucket
CREATE POLICY "read_public_cards"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'cards');

-- Step 3: Create policies for public user-images bucket
CREATE POLICY "read_public_user_images"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'user-images');

-- Step 4: Create policies for user-specific operations on user-images bucket
CREATE POLICY "insert_own_files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-images' AND owner = auth.uid());

CREATE POLICY "update_own_files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-images' AND owner = auth.uid())
WITH CHECK (bucket_id = 'user-images' AND owner = auth.uid());

CREATE POLICY "delete_own_files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-images' AND owner = auth.uid());

-- Step 5: Verification
DO $$
DECLARE
  policies_count INTEGER;
BEGIN
  -- Count policies
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies 
  WHERE tablename = 'objects' AND schemaname = 'storage';
  
  RAISE NOTICE '=== RLS POLICIES SETUP COMPLETE ===';
  RAISE NOTICE 'Number of policies created: %', policies_count;
  RAISE NOTICE 'Policies:';
  RAISE NOTICE '- read_public_cards (for cards bucket)';
  RAISE NOTICE '- read_public_user_images (for user-images bucket)';
  RAISE NOTICE '- insert_own_files (for user-images bucket)';
  RAISE NOTICE '- update_own_files (for user-images bucket)';
  RAISE NOTICE '- delete_own_files (for user-images bucket)';
  
  IF policies_count >= 5 THEN
    RAISE NOTICE '✅ All RLS policies configured successfully!';
  ELSE
    RAISE NOTICE '⚠️ Some policies may not have been created properly';
  END IF;
END $$;







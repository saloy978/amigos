/*
  # Check Storage Setup Status
  
  This migration verifies that all storage components are properly configured.
*/

-- Step 1: Check if buckets exist and are public
DO $$
DECLARE
  cards_bucket_exists BOOLEAN;
  user_images_bucket_exists BOOLEAN;
  cards_bucket_public BOOLEAN;
  user_images_bucket_public BOOLEAN;
  rls_enabled BOOLEAN;
  policies_count INTEGER;
BEGIN
  -- Check buckets
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'cards') INTO cards_bucket_exists;
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'user-images') INTO user_images_bucket_exists;
  
  -- Check if buckets are public
  SELECT public INTO cards_bucket_public FROM storage.buckets WHERE id = 'cards';
  SELECT public INTO user_images_bucket_public FROM storage.buckets WHERE id = 'user-images';
  
  -- Check RLS status
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class 
  WHERE relname = 'objects' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');
  
  -- Count policies
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies 
  WHERE tablename = 'objects' AND schemaname = 'storage';
  
  RAISE NOTICE '=== STORAGE SETUP STATUS ===';
  RAISE NOTICE 'Cards bucket exists: %', cards_bucket_exists;
  RAISE NOTICE 'User-images bucket exists: %', user_images_bucket_exists;
  RAISE NOTICE 'Cards bucket is public: %', cards_bucket_public;
  RAISE NOTICE 'User-images bucket is public: %', user_images_bucket_public;
  RAISE NOTICE 'RLS enabled on storage.objects: %', rls_enabled;
  RAISE NOTICE 'Number of RLS policies: %', policies_count;
  
  IF cards_bucket_exists AND user_images_bucket_exists AND cards_bucket_public AND user_images_bucket_public THEN
    RAISE NOTICE '✅ Storage buckets are properly configured!';
  ELSE
    RAISE NOTICE '⚠️ Storage buckets need configuration. Check bucket settings in Supabase Dashboard.';
  END IF;
  
  IF rls_enabled AND policies_count >= 5 THEN
    RAISE NOTICE '✅ RLS policies are properly configured!';
  ELSE
    RAISE NOTICE '⚠️ RLS policies need setup. Follow RLS_POLICIES_SETUP_GUIDE.md';
  END IF;
  
  RAISE NOTICE '=== NEXT STEPS ===';
  IF NOT (cards_bucket_exists AND user_images_bucket_exists AND cards_bucket_public AND user_images_bucket_public) THEN
    RAISE NOTICE '1. Configure storage buckets in Supabase Dashboard';
  END IF;
  IF NOT (rls_enabled AND policies_count >= 5) THEN
    RAISE NOTICE '2. Setup RLS policies (see RLS_POLICIES_SETUP_GUIDE.md)';
  END IF;
  
  IF cards_bucket_exists AND user_images_bucket_exists AND cards_bucket_public AND user_images_bucket_public AND rls_enabled AND policies_count >= 5 THEN
    RAISE NOTICE '🎉 Storage system is fully configured and ready to use!';
  END IF;
END $$;







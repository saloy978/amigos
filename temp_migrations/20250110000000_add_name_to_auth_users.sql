/*
  # Use display_name field in auth.users table

  1. Use existing `display_name` field in `auth.users` table
    - `display_name` (text, user's display name)
    - This field already exists in Supabase auth.users table
    - Allows easy access to user name without joining with user_settings

  2. Update existing data
    - Migrate name from user_settings to auth.users.display_name for existing users
    - Set default name for users without name in user_settings

  3. Add constraints and indexes
    - Add constraint to ensure display_name is not empty
    - Add index for better performance on display_name field

  4. Create triggers for automatic synchronization
    - Sync display_name with user_settings.name
    - Auto-populate display_name from raw_user_meta_data
*/

-- Add comment to explain the field usage
COMMENT ON COLUMN auth.users.display_name IS 'User display name stored directly in auth table';

-- Update existing users with name from user_settings to display_name
UPDATE auth.users 
SET display_name = user_settings.name
FROM user_settings 
WHERE auth.users.id = user_settings.user_id 
  AND (auth.users.display_name IS NULL OR auth.users.display_name = '')
  AND user_settings.name IS NOT NULL;

-- Set default name for users without name
UPDATE auth.users 
SET display_name = COALESCE(
  raw_user_meta_data->>'name',
  raw_user_meta_data->>'full_name',
  split_part(email, '@', 1),
  'User'
)
WHERE display_name IS NULL OR display_name = '';

-- Add constraint to ensure display_name is not empty
ALTER TABLE auth.users ADD CONSTRAINT check_display_name_not_empty 
  CHECK (display_name IS NOT NULL AND length(trim(display_name)) > 0);

-- Create index for better performance on display_name field
CREATE INDEX IF NOT EXISTS idx_auth_users_display_name ON auth.users(display_name);

-- Add trigger to automatically update name in user_settings when auth.users.display_name changes
CREATE OR REPLACE FUNCTION sync_display_name_to_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user_settings.name when auth.users.display_name changes
  UPDATE user_settings 
  SET 
    name = NEW.display_name,
    updated_at = NOW()
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for display_name synchronization
DROP TRIGGER IF EXISTS trigger_sync_display_name_to_user_settings ON auth.users;
CREATE TRIGGER trigger_sync_display_name_to_user_settings
  AFTER UPDATE OF display_name ON auth.users
  FOR EACH ROW
  WHEN (OLD.display_name IS DISTINCT FROM NEW.display_name)
  EXECUTE FUNCTION sync_display_name_to_user_settings();

-- Add trigger to automatically populate display_name from raw_user_meta_data
CREATE OR REPLACE FUNCTION populate_display_name_from_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Set display_name from raw_user_meta_data if not already set
  IF NEW.display_name IS NULL OR NEW.display_name = '' THEN
    NEW.display_name := COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1),
      'User'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic display_name population
DROP TRIGGER IF EXISTS trigger_populate_display_name ON auth.users;
CREATE TRIGGER trigger_populate_display_name
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION populate_display_name_from_metadata();

-- Add trigger to automatically create user_settings when new user is created
CREATE OR REPLACE FUNCTION create_user_settings_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user_settings record for new user
  INSERT INTO user_settings (
    user_id,
    name,
    avatar_url,
    level,
    known_language,
    learning_language,
    known_language_code,
    learning_language_code,
    daily_goal,
    notifications_enabled,
    sound_effects_enabled,
    app_language,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.display_name, NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '/assets/Foto.png'),
    COALESCE(NEW.raw_user_meta_data->>'level', 'Beginner'),
    'Русский',
    'Español',
    'ru',
    'es',
    20,
    true,
    true,
    'ru',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic user_settings creation
DROP TRIGGER IF EXISTS trigger_create_user_settings_on_signup ON auth.users;
CREATE TRIGGER trigger_create_user_settings_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_settings_on_signup();

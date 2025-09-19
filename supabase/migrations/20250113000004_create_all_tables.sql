/*
  # Create All Tables - Complete Database Schema
  
  This migration creates all necessary tables from scratch:
  - cards (global card library)
  - user_cards (user progress)
  - reviews (review history)
  - user_settings (user preferences)
  - lesson_progress (lesson completion tracking)
  - user_streak (daily usage tracking)
*/

-- Step 1: Create cards table (global card library)
CREATE TABLE cards (
  id BIGSERIAL PRIMARY KEY,
  language_pair_id TEXT NOT NULL,
  term TEXT NOT NULL,
  translation TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique index to prevent duplicates
CREATE UNIQUE INDEX cards_uniq ON cards(language_pair_id, term, translation);

-- Step 2: Create user_cards table (user progress)
CREATE TABLE user_cards (
  user_id UUID NOT NULL,
  card_id BIGINT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'LEARN',
  progress INT NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  successful_reviews INT NOT NULL DEFAULT 0,
  direction TEXT NOT NULL DEFAULT 'K_TO_L',
  ease_factor NUMERIC NOT NULL DEFAULT 2.5,
  interval_days INT NOT NULL DEFAULT 0,
  due_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, card_id)
);

-- Step 3: Create reviews table (review history)
CREATE TABLE reviews (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  card_id BIGINT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  prev_interval INT,
  next_interval INT,
  prev_ef NUMERIC,
  next_ef NUMERIC
);

-- Step 4: Create user_settings table
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language_pair_id TEXT NOT NULL DEFAULT 'ru-es',
  daily_goal INT NOT NULL DEFAULT 20,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Step 5: Create lesson_progress table
CREATE TABLE lesson_progress (
  user_id UUID NOT NULL,
  lesson_id TEXT NOT NULL,
  progress INT NOT NULL DEFAULT 0,
  theory_completed BOOLEAN NOT NULL DEFAULT false,
  dialogues_completed BOOLEAN NOT NULL DEFAULT false,
  practice_completed BOOLEAN NOT NULL DEFAULT false,
  practice_score INT DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

-- Step 6: Create user_streak table
CREATE TABLE user_streak (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_activity_date DATE,
  total_days_used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Step 7: Add constraints
ALTER TABLE user_cards ADD CONSTRAINT user_cards_state_check 
  CHECK (state IN ('LEARN', 'REVIEW', 'SUSPENDED'));

ALTER TABLE user_cards ADD CONSTRAINT user_cards_direction_check 
  CHECK (direction IN ('K_TO_L', 'L_TO_K'));

ALTER TABLE user_cards ADD CONSTRAINT user_cards_progress_check 
  CHECK (progress >= 0 AND progress <= 100);

ALTER TABLE lesson_progress ADD CONSTRAINT lesson_progress_progress_check 
  CHECK (progress >= 0 AND progress <= 100);

ALTER TABLE lesson_progress ADD CONSTRAINT lesson_progress_practice_score_check 
  CHECK (practice_score >= 0 AND practice_score <= 100);

-- Step 8: Create indexes for performance
CREATE INDEX user_cards_due_idx ON user_cards(user_id, due_at) WHERE state <> 'SUSPENDED';
CREATE INDEX user_cards_user_state_idx ON user_cards(user_id, state);
CREATE INDEX reviews_user_card_idx ON reviews(user_id, card_id, reviewed_at DESC);
CREATE INDEX reviews_user_reviewed_at_idx ON reviews(user_id, reviewed_at DESC);
CREATE INDEX idx_cards_language_pair ON cards(language_pair_id);
CREATE INDEX idx_cards_term ON cards(term);
CREATE INDEX idx_user_cards_user_id ON user_cards(user_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);

-- Step 9: Enable RLS and create policies
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streak ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "cards_read_policy" ON cards FOR SELECT USING (true);
CREATE POLICY "cards_write_policy" ON cards FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "user_cards_owner_policy" ON user_cards FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "reviews_owner_policy" ON reviews FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_settings_owner_policy" ON user_settings FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "lesson_progress_owner_policy" ON lesson_progress FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_streak_owner_policy" ON user_streak FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Step 10: Create views
CREATE OR REPLACE VIEW user_cards_with_content AS
SELECT 
  uc.user_id,
  uc.card_id,
  uc.state,
  uc.progress,
  uc.review_count,
  uc.successful_reviews,
  uc.direction,
  uc.ease_factor,
  uc.interval_days,
  uc.due_at,
  uc.last_reviewed_at,
  uc.created_at,
  uc.updated_at,
  c.language_pair_id,
  c.term,
  c.translation,
  c.image_url
FROM user_cards uc
JOIN cards c ON c.id = uc.card_id;

CREATE OR REPLACE VIEW cards_due_for_review AS
SELECT 
  uc.*,
  c.term,
  c.translation,
  c.image_url
FROM user_cards uc
JOIN cards c ON c.id = uc.card_id
WHERE uc.due_at <= now()
  AND uc.state = 'REVIEW';

-- Step 11: Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_user_cards_updated_at
  BEFORE UPDATE ON user_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_progress_updated_at
  BEFORE UPDATE ON lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_streak_updated_at
  BEFORE UPDATE ON user_streak
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 12: Create helper functions
CREATE OR REPLACE FUNCTION get_or_create_card(
  p_language_pair_id TEXT,
  p_term TEXT,
  p_translation TEXT,
  p_image_url TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  card_id BIGINT;
BEGIN
  -- Try to find existing card
  SELECT id INTO card_id
  FROM cards
  WHERE language_pair_id = p_language_pair_id
    AND term = p_term
    AND translation = p_translation;
  
  -- If not found, create new one
  IF card_id IS NULL THEN
    INSERT INTO cards (language_pair_id, term, translation, image_url)
    VALUES (p_language_pair_id, p_term, p_translation, p_image_url)
    RETURNING id INTO card_id;
  END IF;
  
  RETURN card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_card_to_user(
  p_user_id UUID,
  p_language_pair_id TEXT,
  p_term TEXT,
  p_translation TEXT,
  p_image_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  card_id BIGINT;
BEGIN
  -- Get or create card
  SELECT get_or_create_card(p_language_pair_id, p_term, p_translation, p_image_url) INTO card_id;
  
  -- Add to user_cards if not exists
  INSERT INTO user_cards (user_id, card_id)
  VALUES (p_user_id, card_id)
  ON CONFLICT (user_id, card_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_card_to_user_and_get_id(
  p_user_id UUID,
  p_language_pair_id TEXT,
  p_term TEXT,
  p_translation TEXT,
  p_image_url TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  card_id BIGINT;
  is_new_user_card BOOLEAN;
BEGIN
  -- Get or create card
  SELECT get_or_create_card(p_language_pair_id, p_term, p_translation, p_image_url) INTO card_id;
  
  -- Check if user already has this card
  SELECT EXISTS(
    SELECT 1 FROM user_cards WHERE user_id = p_user_id AND card_id = card_id
  ) INTO is_new_user_card;
  
  -- Add to user_cards if not exists
  INSERT INTO user_cards (user_id, card_id)
  VALUES (p_user_id, card_id)
  ON CONFLICT (user_id, card_id) DO NOTHING;
  
  -- Return result
  RETURN json_build_object(
    'card_id', card_id,
    'is_new_user_card', NOT is_new_user_card
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_or_create_card TO authenticated;
GRANT EXECUTE ON FUNCTION add_card_to_user TO authenticated;
GRANT EXECUTE ON FUNCTION add_card_to_user_and_get_id TO authenticated;

-- Step 13: Final verification
DO $$
DECLARE
  cards_count INTEGER;
  user_cards_count INTEGER;
  reviews_count INTEGER;
  user_settings_count INTEGER;
  lesson_progress_count INTEGER;
  user_streak_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO cards_count FROM cards;
  SELECT COUNT(*) INTO user_cards_count FROM user_cards;
  SELECT COUNT(*) INTO reviews_count FROM reviews;
  SELECT COUNT(*) INTO user_settings_count FROM user_settings;
  SELECT COUNT(*) INTO lesson_progress_count FROM lesson_progress;
  SELECT COUNT(*) INTO user_streak_count FROM user_streak;
  
  RAISE NOTICE '=== DATABASE SCHEMA CREATED SUCCESSFULLY ===';
  RAISE NOTICE 'cards: % rows', cards_count;
  RAISE NOTICE 'user_cards: % rows', user_cards_count;
  RAISE NOTICE 'reviews: % rows', reviews_count;
  RAISE NOTICE 'user_settings: % rows', user_settings_count;
  RAISE NOTICE 'lesson_progress: % rows', lesson_progress_count;
  RAISE NOTICE 'user_streak: % rows', user_streak_count;
  RAISE NOTICE 'All tables, indexes, policies, and functions created successfully!';
END $$;



















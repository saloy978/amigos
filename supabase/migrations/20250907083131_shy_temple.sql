/*
  # Create cards table for spaced repetition

  1. New Tables
    - `cards`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `language_pair_id` (text)
      - `term` (text, the word/phrase to learn)
      - `translation` (text, the translation)
      - `image_url` (text, optional image URL)
      - `progress` (integer, 0-100)
      - `state` (text, LEARN/KNOW/MASTERED)
      - `due_at` (timestamptz, when card is due for review)
      - `review_count` (integer, total reviews)
      - `successful_reviews` (integer, successful reviews)
      - `direction` (text, K_TO_L/L_TO_K)
      - `ease_factor` (decimal, spaced repetition factor)
      - `interval_days` (integer, current interval)
      - `last_reviewed_at` (timestamptz, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `cards` table
    - Add policies for authenticated users to manage their own cards
*/

CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  language_pair_id text NOT NULL,
  term text NOT NULL,
  translation text NOT NULL,
  image_url text,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  state text DEFAULT 'LEARN' CHECK (state IN ('LEARN', 'KNOW', 'MASTERED')),
  due_at timestamptz DEFAULT now(),
  review_count integer DEFAULT 0,
  successful_reviews integer DEFAULT 0,
  direction text DEFAULT 'K_TO_L' CHECK (direction IN ('K_TO_L', 'L_TO_K')),
  ease_factor decimal DEFAULT 2.5,
  interval_days integer DEFAULT 0,
  last_reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own cards"
  ON cards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards"
  ON cards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards"
  ON cards
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards"
  ON cards
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_language_pair ON cards(language_pair_id);
CREATE INDEX IF NOT EXISTS idx_cards_due_at ON cards(due_at);
CREATE INDEX IF NOT EXISTS idx_cards_state ON cards(state);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
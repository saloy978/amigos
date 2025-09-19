-- Seed data for local development
-- This file will be executed when running `npm run db:seed`

-- Insert sample users (for testing)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Test User"}',
  false,
  'authenticated'
);

-- Insert user settings (updated to match new schema)
INSERT INTO user_settings (
  user_id,
  language_pair_id,
  daily_goal,
  notifications_enabled,
  sound_enabled,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ru-es',
  20,
  true,
  true,
  now(),
  now()
);

-- Insert sample cards (global card library - no user_id)
INSERT INTO cards (
  id,
  language_pair_id,
  term,
  translation,
  image_url,
  created_at
) VALUES 
(
  1,
  'ru-es',
  'яблоко',
  'manzana',
  'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?w=400&h=300&fit=crop',
  now() - interval '2 days'
),
(
  2,
  'ru-es',
  'собака',
  'perro',
  'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?w=400&h=300&fit=crop',
  now() - interval '3 days'
),
(
  3,
  'ru-es',
  'дом',
  'casa',
  'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?w=400&h=300&fit=crop',
  now() - interval '5 days'
),
(
  4,
  'ru-es',
  'вода',
  'agua',
  null,
  now() - interval '7 days'
),
(
  5,
  'ru-es',
  'книга',
  'libro',
  'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?w=400&h=300&fit=crop',
  now() - interval '4 days'
);

-- Insert user_cards (user progress tracking)
INSERT INTO user_cards (
  user_id,
  card_id,
  state,
  progress,
  review_count,
  successful_reviews,
  direction,
  ease_factor,
  interval_days,
  due_at,
  last_reviewed_at,
  created_at,
  updated_at
) VALUES 
(
  '00000000-0000-0000-0000-000000000001',
  1,
  'LEARN',
  15,
  2,
  1,
  'K_TO_L',
  2.5,
  0,
  now() - interval '5 minutes',
  now() - interval '10 minutes',
  now() - interval '2 days',
  now() - interval '10 minutes'
),
(
  '00000000-0000-0000-0000-000000000001',
  2,
  'LEARN',
  45,
  4,
  3,
  'K_TO_L',
  2.5,
  0,
  now() + interval '2 minutes',
  now() - interval '30 minutes',
  now() - interval '3 days',
  now() - interval '30 minutes'
),
(
  '00000000-0000-0000-0000-000000000001',
  3,
  'REVIEW',
  75,
  8,
  6,
  'K_TO_L',
  2.5,
  1,
  now() - interval '1 minute',
  now() - interval '45 minutes',
  now() - interval '5 days',
  now() - interval '45 minutes'
),
(
  '00000000-0000-0000-0000-000000000001',
  4,
  'REVIEW',
  95,
  12,
  11,
  'K_TO_L',
  2.8,
  7,
  now() + interval '1 day',
  now() - interval '2 hours',
  now() - interval '7 days',
  now() - interval '2 hours'
),
(
  '00000000-0000-0000-0000-000000000001',
  5,
  'LEARN',
  30,
  3,
  2,
  'K_TO_L',
  2.4,
  0,
  now() - interval '30 minutes',
  now() - interval '35 minutes',
  now() - interval '4 days',
  now() - interval '35 minutes'
);

-- Insert lesson progress
INSERT INTO lesson_progress (
  user_id,
  lesson_id,
  progress,
  theory_completed,
  dialogues_completed,
  practice_completed,
  practice_score,
  last_accessed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'lesson_1_basics',
  75,
  true,
  true,
  false,
  0,
  now() - interval '1 hour',
  now() - interval '2 days',
  now() - interval '1 hour'
),
(
  '00000000-0000-0000-0000-000000000001',
  'lesson_2_greetings',
  100,
  true,
  true,
  true,
  85,
  now() - interval '30 minutes',
  now() - interval '3 days',
  now() - interval '30 minutes'
);

-- Insert user streak
INSERT INTO user_streak (
  user_id,
  current_streak,
  longest_streak,
  last_activity_date,
  total_days_used,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  5,
  12,
  CURRENT_DATE,
  15,
  now() - interval '15 days',
  now() - interval '1 day'
);

-- Insert some review history
INSERT INTO reviews (
  user_id,
  card_id,
  reviewed_at,
  rating,
  prev_interval,
  next_interval,
  prev_ef,
  next_ef
) VALUES 
(
  '00000000-0000-0000-0000-000000000001',
  1,
  now() - interval '10 minutes',
  4,
  0,
  0,
  2.5,
  2.6
),
(
  '00000000-0000-0000-0000-000000000001',
  2,
  now() - interval '30 minutes',
  3,
  0,
  0,
  2.5,
  2.5
),
(
  '00000000-0000-0000-0000-000000000001',
  3,
  now() - interval '45 minutes',
  5,
  0,
  1,
  2.5,
  2.5
),
(
  '00000000-0000-0000-0000-000000000001',
  4,
  now() - interval '2 hours',
  4,
  7,
  7,
  2.8,
  2.8
),
(
  '00000000-0000-0000-0000-000000000001',
  5,
  now() - interval '35 minutes',
  3,
  0,
  0,
  2.4,
  2.4
);

-- Reset sequences to avoid conflicts
SELECT setval('cards_id_seq', (SELECT MAX(id) FROM cards));
SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews));
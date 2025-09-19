-- Создаем таблицу для отслеживания streak пользователей
CREATE TABLE user_streak (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    total_days_active INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Включаем RLS
ALTER TABLE user_streak ENABLE ROW LEVEL SECURITY;

-- Политики безопасности
CREATE POLICY "Users can view their own streak data."
ON user_streak FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak data."
ON user_streak FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak data."
ON user_streak FOR UPDATE
USING (auth.uid() = user_id);

-- Создаем функцию для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для обновления updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON user_streak
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Создаем индексы для оптимизации
CREATE INDEX idx_user_streak_user_id ON user_streak(user_id);
CREATE INDEX idx_user_streak_last_activity ON user_streak(last_activity_date);

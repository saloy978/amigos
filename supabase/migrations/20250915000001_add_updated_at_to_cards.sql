-- Добавляем колонку updated_at в таблицу cards
-- Это необходимо для отслеживания времени последнего обновления карточки

-- Добавляем колонку updated_at
ALTER TABLE cards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Создаем функцию для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создаем триггер для автоматического обновления updated_at при изменении записи
DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;
CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Проверяем, что колонка добавлена
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'cards' 
        AND column_name = 'updated_at'
    ) INTO column_exists;
    
    RAISE NOTICE '=== CARDS UPDATED_AT COLUMN FIX ===';
    
    IF column_exists THEN
        RAISE NOTICE '✅ updated_at column added to cards table successfully!';
    ELSE
        RAISE NOTICE '❌ updated_at column was not added to cards table';
    END IF;
END $$;

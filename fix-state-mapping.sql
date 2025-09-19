-- Исправление маппинга состояний для уже примененной миграции
-- Выполните этот скрипт, если миграция частично выполнилась с ошибкой

-- Проверяем текущее состояние
DO $$
DECLARE
  invalid_states_count INTEGER;
BEGIN
  -- Проверяем есть ли недопустимые состояния
  SELECT COUNT(*) INTO invalid_states_count
  FROM user_cards
  WHERE state NOT IN ('LEARN', 'REVIEW', 'SUSPENDED');
  
  IF invalid_states_count > 0 THEN
    RAISE NOTICE 'Found % records with invalid states, fixing...', invalid_states_count;
    
    -- Исправляем состояния
    UPDATE user_cards 
    SET state = CASE 
      WHEN state = 'KNOW' THEN 'REVIEW'
      WHEN state = 'LEARN' THEN 'LEARN'
      WHEN state = 'REVIEW' THEN 'REVIEW'
      WHEN state = 'SUSPENDED' THEN 'SUSPENDED'
      ELSE 'LEARN'
    END
    WHERE state NOT IN ('LEARN', 'REVIEW', 'SUSPENDED');
    
    RAISE NOTICE 'Fixed % records', invalid_states_count;
  ELSE
    RAISE NOTICE 'No invalid states found - all good!';
  END IF;
END $$;

-- Проверяем результат
SELECT 
  state,
  COUNT(*) as count
FROM user_cards
GROUP BY state
ORDER BY state;



















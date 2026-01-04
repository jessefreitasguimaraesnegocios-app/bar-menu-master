-- ============================================
-- FORÇAR CONVERSÃO DE category PARA VARCHAR
-- ============================================
-- Migration mais robusta para garantir que category seja VARCHAR
-- Execute este arquivo se ainda estiver recebendo erro de ENUM
-- ============================================

-- Primeiro, verificar o estado atual
DO $$
DECLARE
  current_type TEXT;
BEGIN
  SELECT udt_name INTO current_type
  FROM information_schema.columns
  WHERE table_name = 'menu_items'
  AND column_name = 'category';
  
  RAISE NOTICE 'Tipo atual da coluna category: %', current_type;
END $$;

-- IMPORTANTE: Dropar view que depende da coluna category
-- Isso é necessário porque PostgreSQL não permite alterar tipo de coluna
-- que está sendo usado por uma view
DROP VIEW IF EXISTS active_menu_items;

-- Remover constraint NOT NULL temporariamente se existir
ALTER TABLE menu_items ALTER COLUMN category DROP NOT NULL;

-- Remover índice se existir
DROP INDEX IF EXISTS idx_menu_items_category;

-- Converter ENUM para TEXT primeiro (mais seguro)
ALTER TABLE menu_items 
  ALTER COLUMN category TYPE TEXT 
  USING category::text;

-- Agora converter para VARCHAR(255)
ALTER TABLE menu_items 
  ALTER COLUMN category TYPE VARCHAR(255);

-- Restaurar constraint NOT NULL
ALTER TABLE menu_items ALTER COLUMN category SET NOT NULL;

-- Recriar índice
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);

-- Recriar a view active_menu_items
CREATE OR REPLACE VIEW active_menu_items
WITH (security_invoker = true) AS
SELECT 
  id, name, description, price, category, image, ingredients, preparation, abv,
  is_popular, is_new, created_at, updated_at, bar_id
FROM menu_items
WHERE is_active = TRUE
ORDER BY category, is_popular DESC, is_new DESC, name;

-- Verificar resultado
SELECT 
  column_name,
  data_type,
  udt_name,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'menu_items'
AND column_name = 'category';

-- Log final
DO $$
BEGIN
  RAISE NOTICE '✅ Coluna category convertida para VARCHAR(255) com sucesso!';
  RAISE NOTICE 'Agora é possível usar categorias customizadas.';
END $$;


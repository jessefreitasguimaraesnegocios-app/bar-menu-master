-- ============================================
-- MIGRAÇÃO: Alterar category de ENUM para VARCHAR
-- ============================================
-- Execute este arquivo para permitir categorias customizadas
-- ============================================

-- Alterar a coluna category de ENUM para VARCHAR
-- Isso permite categorias customizadas além das padrão
DO $$ 
BEGIN
  -- Verificar se a coluna ainda é do tipo category_type
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'menu_items' 
    AND column_name = 'category'
    AND udt_name = 'category_type'
  ) THEN
    -- Alterar tipo da coluna para VARCHAR
    ALTER TABLE menu_items 
    ALTER COLUMN category TYPE VARCHAR(255) 
    USING category::text;
    
    RAISE NOTICE 'Coluna category alterada de ENUM para VARCHAR com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna category já é VARCHAR ou não existe.';
  END IF;
END $$;

-- Remover o índice antigo se existir (será recriado se necessário)
DROP INDEX IF EXISTS idx_menu_items_category;

-- Recriar índice na nova coluna VARCHAR
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);

-- Verificar o tipo da coluna
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'menu_items'
AND column_name = 'category';


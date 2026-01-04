-- ============================================
-- SCHEMA COMPLETO - Cardápio Cantim
-- ============================================
-- Execute este arquivo PRIMEIRO para criar toda a estrutura do banco
-- ============================================

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM: Categorias do Cardápio
-- ============================================
CREATE TYPE category_type AS ENUM (
  'cocktails',
  'beers',
  'wines',
  'spirits',
  'appetizers',
  'mains'
);

-- ============================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABELA: menu_items
-- ============================================
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  category category_type NOT NULL,
  image TEXT NOT NULL,
  ingredients TEXT[] DEFAULT '{}',
  preparation TEXT,
  abv DECIMAL(5, 2) CHECK (abv >= 0 AND abv <= 100),
  is_popular BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  bar_id UUID, -- Referência para bars (adicionar foreign key após criar tabela bars)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_active ON menu_items(is_active);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_popular ON menu_items(is_popular);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_new ON menu_items(is_new);
CREATE INDEX IF NOT EXISTS idx_menu_items_created_at ON menu_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_menu_items_bar_id ON menu_items(bar_id);

-- Trigger
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Menu items are viewable by everyone" ON menu_items;
DROP POLICY IF EXISTS "Authenticated users can insert menu items" ON menu_items;
DROP POLICY IF EXISTS "Authenticated users can update menu items" ON menu_items;
DROP POLICY IF EXISTS "Authenticated users can delete menu items" ON menu_items;

CREATE POLICY "Menu items are viewable by everyone"
  ON menu_items FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Authenticated users can insert menu items"
  ON menu_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update menu items"
  ON menu_items FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete menu items"
  ON menu_items FOR DELETE
  USING (auth.role() = 'authenticated');

-- Função Soft Delete
CREATE OR REPLACE FUNCTION soft_delete_menu_item(item_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE menu_items
  SET is_active = FALSE, updated_at = NOW()
  WHERE id = item_id AND is_active = TRUE;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- VIEW (SECURITY INVOKER - mais seguro)
CREATE OR REPLACE VIEW active_menu_items
WITH (security_invoker = true) AS
SELECT 
  id, name, description, price, category, image, ingredients, preparation, abv,
  is_popular, is_new, created_at, updated_at, bar_id
FROM menu_items
WHERE is_active = TRUE
ORDER BY category, is_popular DESC, is_new DESC, name;


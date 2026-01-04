-- ============================================
-- MIGRAÇÃO: Adicionar slug e configurações de bar
-- ============================================
-- Execute este arquivo para adicionar suporte a rotas dinâmicas e webhooks
-- ============================================

-- Adicionar campo slug na tabela bars (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bars' AND column_name = 'slug'
  ) THEN
    ALTER TABLE bars ADD COLUMN slug VARCHAR(255) UNIQUE;
    
    -- Gerar slugs para bares existentes
    UPDATE bars 
    SET slug = LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'),
        '\s+', '-', 'g'
      )
    ) || '-' || SUBSTRING(id::TEXT, 1, 8)
    WHERE slug IS NULL;
    
    -- Tornar slug obrigatório
    ALTER TABLE bars ALTER COLUMN slug SET NOT NULL;
    
    -- Criar índice único
    CREATE UNIQUE INDEX IF NOT EXISTS idx_bars_slug ON bars(slug);
  END IF;
END $$;

-- ============================================
-- TABELA: bar_settings (Configurações por bar)
-- ============================================
CREATE TABLE IF NOT EXISTS bar_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bar_id UUID NOT NULL REFERENCES bars(id) ON DELETE CASCADE,
  
  -- Configurações de Webhook
  webhook_kitchen_url TEXT, -- URL para notificar cozinha
  webhook_bartender_url TEXT, -- URL para notificar barman
  webhook_waiter_url TEXT, -- URL para notificar garçom
  webhook_kitchen_enabled BOOLEAN DEFAULT FALSE,
  webhook_bartender_enabled BOOLEAN DEFAULT FALSE,
  webhook_waiter_enabled BOOLEAN DEFAULT FALSE,
  
  -- Configurações de aparência (para futuro)
  primary_color VARCHAR(7) DEFAULT '#d97706', -- Cor primária
  secondary_color VARCHAR(7) DEFAULT '#92400e', -- Cor secundária
  font_family VARCHAR(100) DEFAULT 'Inter', -- Fonte
  logo_url TEXT, -- URL do logo
  
  -- Configurações gerais
  auto_accept_orders BOOLEAN DEFAULT FALSE, -- Aceitar pedidos automaticamente
  min_order_value DECIMAL(10, 2) DEFAULT 0, -- Valor mínimo do pedido
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir um único registro por bar
  UNIQUE(bar_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_bar_settings_bar_id ON bar_settings(bar_id);

-- Trigger para updated_at
CREATE TRIGGER update_bar_settings_updated_at
  BEFORE UPDATE ON bar_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE bar_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bar settings are viewable by bar owners and admins"
  ON bar_settings FOR SELECT
  USING (
    -- Admins podem ver tudo
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
    OR
    -- Owners podem ver apenas suas configurações
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'owner'
      AND (auth.users.raw_user_meta_data->>'bar_id')::UUID = bar_settings.bar_id
    )
  );

CREATE POLICY "Bar settings can be updated by bar owners and admins"
  ON bar_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'owner'
      AND (auth.users.raw_user_meta_data->>'bar_id')::UUID = bar_settings.bar_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'owner'
      AND (auth.users.raw_user_meta_data->>'bar_id')::UUID = bar_settings.bar_id
    )
  );

CREATE POLICY "Bar settings can be inserted by admins"
  ON bar_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Função para criar configurações padrão ao criar um bar
CREATE OR REPLACE FUNCTION create_default_bar_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO bar_settings (bar_id)
  VALUES (NEW.id)
  ON CONFLICT (bar_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar configurações padrão ao criar bar
DROP TRIGGER IF EXISTS trigger_create_default_bar_settings ON bars;
CREATE TRIGGER trigger_create_default_bar_settings
  AFTER INSERT ON bars
  FOR EACH ROW
  EXECUTE FUNCTION create_default_bar_settings();


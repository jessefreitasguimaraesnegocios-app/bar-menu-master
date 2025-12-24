-- ============================================
-- Schema para Imagens de Fundo
-- ============================================

-- Tabela para armazenar configurações de imagens de fundo
CREATE TABLE IF NOT EXISTS background_image_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL UNIQUE, -- 'hero', 'menu', 'featured'
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida por tipo
CREATE INDEX IF NOT EXISTS idx_background_image_configs_type ON background_image_configs(type);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_background_image_configs_updated_at
  BEFORE UPDATE ON background_image_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: Apenas usuários autenticados podem modificar
ALTER TABLE background_image_configs ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer pessoa pode ler
CREATE POLICY "Background images are viewable by everyone"
  ON background_image_configs
  FOR SELECT
  USING (true);

-- Política: Pública para inserir/atualizar (Recomendado para Portal do Dono sem autenticação obrigatória)
-- Use esta política se o portal do dono não usa autenticação
-- NOTA: Se você já tem a política "Authenticated users can manage background images", remova-a primeiro:
-- DROP POLICY IF EXISTS "Authenticated users can manage background images" ON background_image_configs;

CREATE POLICY "Public can manage background images"
  ON background_image_configs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Política Alternativa: Apenas usuários autenticados podem inserir/atualizar
-- Descomente esta política e remova a política pública acima se você quiser usar autenticação
-- CREATE POLICY "Authenticated users can manage background images"
--   ON background_image_configs
--   FOR ALL
--   USING (auth.role() = 'authenticated')
--   WITH CHECK (auth.role() = 'authenticated');

-- Função helper para fazer upsert na tabela background_image_configs
-- Esta função usa ON CONFLICT para fazer update se o tipo já existe
CREATE OR REPLACE FUNCTION upsert_background_image_config(
  p_type VARCHAR(50),
  p_image_url TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO background_image_configs (type, image_url, updated_at)
  VALUES (p_type, p_image_url, NOW())
  ON CONFLICT (type) 
  DO UPDATE SET 
    image_url = EXCLUDED.image_url,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


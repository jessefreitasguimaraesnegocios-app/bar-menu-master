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

-- Política: Apenas usuários autenticados podem inserir/atualizar
CREATE POLICY "Authenticated users can manage background images"
  ON background_image_configs
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


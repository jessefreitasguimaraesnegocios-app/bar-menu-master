-- ============================================
-- SCHEMA: Imagens de Fundo
-- ============================================
-- Execute este arquivo APÓS o 01_schema.sql
-- ============================================

CREATE TABLE IF NOT EXISTS background_image_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_background_image_configs_type ON background_image_configs(type);

CREATE TRIGGER update_background_image_configs_updated_at
  BEFORE UPDATE ON background_image_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE background_image_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Background images are viewable by everyone" ON background_image_configs;
DROP POLICY IF EXISTS "Public can manage background images" ON background_image_configs;
DROP POLICY IF EXISTS "Authenticated users can manage background images" ON background_image_configs;

CREATE POLICY "Background images are viewable by everyone"
  ON background_image_configs FOR SELECT
  USING (true);

CREATE POLICY "Public can manage background images"
  ON background_image_configs FOR ALL
  USING (true) WITH CHECK (true);

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


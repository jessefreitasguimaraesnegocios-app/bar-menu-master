-- ============================================
-- Script para Corrigir Políticas de background_image_configs
-- Execute este script se você está recebendo erro 409 ou 403
-- ============================================

-- Remover política antiga que requer autenticação (se existir)
DROP POLICY IF EXISTS "Authenticated users can manage background images" ON background_image_configs;

-- Criar política pública para permitir inserção/atualização sem autenticação
-- Esta política permite que qualquer pessoa (com anon key) possa inserir/atualizar
CREATE POLICY "Public can manage background images"
  ON background_image_configs
  FOR ALL
  USING (true)
  WITH CHECK (true);


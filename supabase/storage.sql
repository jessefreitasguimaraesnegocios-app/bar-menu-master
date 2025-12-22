-- ============================================
-- Configuração do Storage - Supabase
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- para criar o bucket de imagens do cardápio
-- ============================================

-- Criar bucket para imagens do menu
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas existentes se houver (para evitar conflitos)
DROP POLICY IF EXISTS "Menu images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete menu images" ON storage.objects;

-- Política: Qualquer pessoa pode ler imagens
CREATE POLICY "Menu images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

-- Política: Apenas usuários autenticados podem fazer upload
CREATE POLICY "Authenticated users can upload menu images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'menu-images' 
  AND auth.role() = 'authenticated'
);

-- Política: Apenas usuários autenticados podem atualizar
CREATE POLICY "Authenticated users can update menu images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'menu-images' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'menu-images' 
  AND auth.role() = 'authenticated'
);

-- Política: Apenas usuários autenticados podem deletar
CREATE POLICY "Authenticated users can delete menu images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'menu-images' 
  AND auth.role() = 'authenticated'
);

-- ============================================
-- NOTAS
-- ============================================
-- 1. O bucket 'menu-images' será criado como público
-- 2. Qualquer pessoa pode visualizar as imagens
-- 3. Apenas usuários autenticados podem fazer upload/atualizar/deletar
-- 4. Se você quiser tornar o bucket privado, altere 'public' para false
--    e ajuste as políticas conforme necessário


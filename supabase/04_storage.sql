-- ============================================
-- SCHEMA: Storage Buckets
-- ============================================
-- Execute este arquivo para configurar buckets do Supabase Storage
-- ============================================

-- Bucket para imagens do menu
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket para imagens de fundo
INSERT INTO storage.buckets (id, name, public)
VALUES ('background-images', 'background-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para menu-images
DROP POLICY IF EXISTS "Menu images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete menu images" ON storage.objects;

CREATE POLICY "Menu images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

CREATE POLICY "Authenticated users can upload menu images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'menu-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update menu images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'menu-images' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'menu-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete menu images"
ON storage.objects FOR DELETE
USING (bucket_id = 'menu-images' AND auth.role() = 'authenticated');

-- Políticas para background-images
DROP POLICY IF EXISTS "Background images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can manage background images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage background images" ON storage.objects;

CREATE POLICY "Background images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'background-images');

CREATE POLICY "Public can manage background images"
ON storage.objects FOR ALL
USING (bucket_id = 'background-images')
WITH CHECK (bucket_id = 'background-images');


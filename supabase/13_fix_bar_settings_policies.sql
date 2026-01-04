-- ============================================
-- CORRIGIR POLÍTICAS RLS PARA bar_settings
-- ============================================
-- Corrige as políticas para usar auth.jwt() e permite INSERT por owners
-- ============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Bar settings are viewable by bar owners and admins" ON bar_settings;
DROP POLICY IF EXISTS "Bar settings can be updated by bar owners and admins" ON bar_settings;
DROP POLICY IF EXISTS "Bar settings can be inserted by admins" ON bar_settings;

-- Política para SELECT (admins e owners)
CREATE POLICY "Bar settings are viewable by bar owners and admins"
  ON bar_settings FOR SELECT
  USING (
    -- Admins podem ver tudo
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
    OR
    -- Owners podem ver apenas suas configurações
    (
      (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'owner'
      AND (auth.jwt() -> 'user_metadata' ->> 'bar_id')::UUID = bar_settings.bar_id
    )
  );

-- Política para UPDATE (admins e owners)
CREATE POLICY "Bar settings can be updated by bar owners and admins"
  ON bar_settings FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
    OR
    (
      (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'owner'
      AND (auth.jwt() -> 'user_metadata' ->> 'bar_id')::UUID = bar_settings.bar_id
    )
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
    OR
    (
      (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'owner'
      AND (auth.jwt() -> 'user_metadata' ->> 'bar_id')::UUID = bar_settings.bar_id
    )
  );

-- Política para INSERT (admins e owners)
-- IMPORTANTE: Owners também podem fazer INSERT para permitir UPSERT
CREATE POLICY "Bar settings can be inserted by admins and owners"
  ON bar_settings FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
    OR
    (
      (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'owner'
      AND (auth.jwt() -> 'user_metadata' ->> 'bar_id')::UUID = bar_id
    )
  );

-- Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'bar_settings'
ORDER BY policyname;

-- Log
DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS para bar_settings atualizadas';
  RAISE NOTICE 'Agora admins e owners podem fazer INSERT, UPDATE e SELECT';
END $$;


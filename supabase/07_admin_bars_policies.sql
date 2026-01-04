-- ============================================
-- POLÍTICAS RLS PARA ADMIN GERENCIAR BARS
-- ============================================
-- Execute este arquivo para permitir que admins:
-- - Inserir bares
-- - Atualizar bares (incluindo desativar)
-- - Deletar bares
-- ============================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Bars can be inserted by admins" ON bars;
DROP POLICY IF EXISTS "Bars can be updated by admins" ON bars;
DROP POLICY IF EXISTS "Bars can be deleted by admins" ON bars;
DROP POLICY IF EXISTS "Bars can be inserted by authenticated users" ON bars;
DROP POLICY IF EXISTS "Bars can be updated by authenticated users" ON bars;
DROP POLICY IF EXISTS "Bars can be deleted by authenticated users" ON bars;

-- Política para INSERT (apenas admins)
-- Usando auth.jwt() para verificar role no token JWT
CREATE POLICY "Bars can be inserted by admins"
  ON bars FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  );

-- Política para UPDATE (apenas admins)
-- Permite atualizar qualquer bar, incluindo is_active
-- Usando auth.jwt() para verificar role no token JWT
CREATE POLICY "Bars can be updated by admins"
  ON bars FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  );

-- Política para DELETE (apenas admins)
-- Usando auth.jwt() para verificar role no token JWT
CREATE POLICY "Bars can be deleted by admins"
  ON bars FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  );

-- Verificar se as políticas foram criadas
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
WHERE tablename = 'bars'
ORDER BY policyname;

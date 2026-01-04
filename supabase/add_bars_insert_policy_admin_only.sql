-- ============================================
-- ADICIONAR POLÍTICA DE INSERT PARA bars (APENAS ADMINS)
-- ============================================
-- Execute este script APÓS o 02_orders.sql
-- Permite APENAS usuários com role 'admin' cadastrarem estabelecimentos
-- ============================================

-- Remover políticas antigas se existirem (para evitar duplicatas)
DROP POLICY IF EXISTS "Bars can be inserted by authenticated users" ON bars;
DROP POLICY IF EXISTS "Bars can be inserted by admins" ON bars;

-- Criar política de INSERT APENAS para admins
CREATE POLICY "Bars can be inserted by admins"
  ON bars FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Opcional: Permitir UPDATE também (para editar estabelecimentos)
DROP POLICY IF EXISTS "Bars can be updated by authenticated users" ON bars;
DROP POLICY IF EXISTS "Bars can be updated by admins" ON bars;

CREATE POLICY "Bars can be updated by admins"
  ON bars FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Verificar se a política foi criada
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


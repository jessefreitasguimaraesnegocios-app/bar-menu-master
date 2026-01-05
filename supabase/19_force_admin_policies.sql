-- ============================================
-- FORÇAR APLICAÇÃO DAS POLÍTICAS DE ADMIN
-- ============================================
-- Este script remove TODAS as políticas antigas e cria as corretas
-- Execute este script se INSERT funciona mas DELETE não
-- ============================================

-- 1. Remover TODAS as políticas de bars (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Authenticated users can insert bars" ON bars;
DROP POLICY IF EXISTS "Authenticated users can update bars" ON bars;
DROP POLICY IF EXISTS "Authenticated users can delete bars" ON bars;
DROP POLICY IF EXISTS "Bars can be inserted by admins" ON bars;
DROP POLICY IF EXISTS "Bars can be updated by admins" ON bars;
DROP POLICY IF EXISTS "Bars can be deleted by admins" ON bars;
DROP POLICY IF EXISTS "Admins can insert bars" ON bars;
DROP POLICY IF EXISTS "Admins can update bars" ON bars;
DROP POLICY IF EXISTS "Admins can delete bars" ON bars;
DROP POLICY IF EXISTS "Anyone can delete bars" ON bars;

-- 2. Garantir que a função is_admin existe
-- (Se não existir, será criada pelo user-roles.sql)

-- 3. Criar políticas corretas usando is_admin (que verifica user_roles)
CREATE POLICY "Admins can insert bars"
  ON bars
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update bars"
  ON bars
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete bars"
  ON bars
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 4. Verificar políticas criadas
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'INSERT' THEN 'WITH CHECK: ' || with_check
    WHEN cmd = 'UPDATE' THEN 'USING: ' || qual || ' | WITH CHECK: ' || with_check
    WHEN cmd = 'DELETE' THEN 'USING: ' || qual
  END as policy_definition
FROM pg_policies
WHERE tablename = 'bars'
ORDER BY cmd, policyname;

-- 5. Log
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas de admin aplicadas com sucesso!';
  RAISE NOTICE 'INSERT, UPDATE e DELETE agora usam public.is_admin(auth.uid())';
  RAISE NOTICE 'Certifique-se de que seu usuário tem role admin na tabela user_roles';
END $$;


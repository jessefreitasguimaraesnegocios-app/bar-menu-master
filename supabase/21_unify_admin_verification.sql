-- ============================================
-- UNIFICAR VERIFICAÇÃO DE ADMIN
-- ============================================
-- Este script garante que TODAS as políticas usem
-- a mesma verificação: public.is_admin(auth.uid())
-- que verifica a tabela user_roles
-- ============================================

-- PASSO 1: Remover TODAS as políticas antigas de bars
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

-- PASSO 2: Garantir que a função is_admin existe e funciona
-- (Se não existir, execute user-roles.sql primeiro)

-- PASSO 3: Criar políticas UNIFICADAS usando is_admin
-- Todas usam public.is_admin(auth.uid()) que verifica user_roles

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

-- PASSO 4: Verificar políticas criadas
SELECT 
  'Políticas de bars:' as info,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'INSERT' THEN 'WITH CHECK: ' || COALESCE(with_check, 'NULL')
    WHEN cmd = 'UPDATE' THEN 'USING: ' || COALESCE(qual, 'NULL') || ' | WITH CHECK: ' || COALESCE(with_check, 'NULL')
    WHEN cmd = 'DELETE' THEN 'USING: ' || COALESCE(qual, 'NULL')
  END as policy_definition
FROM pg_policies
WHERE tablename = 'bars'
ORDER BY cmd, policyname;

-- PASSO 5: Verificar se você é admin
-- Execute esta query para ver seu status:
SELECT 
  u.id,
  u.email,
  ur.role as user_roles_role,
  public.is_admin(u.id) as is_admin_function_result,
  CASE 
    WHEN public.is_admin(u.id) THEN '✅ É ADMIN (pode deletar)'
    WHEN ur.role = 'admin' THEN '⚠️ Tem role mas função não funciona - verifique se is_admin() existe'
    ELSE '❌ NÃO É ADMIN - precisa adicionar em user_roles'
  END as status
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id AND ur.role = 'admin'
ORDER BY u.created_at DESC;

-- PASSO 6: Se você não aparecer como admin, adicione:
-- 
-- Opção A: Usar a função helper (mais fácil)
-- SELECT * FROM add_admin_by_email('seu-email@exemplo.com');
--
-- Opção B: Manualmente
-- 1. Encontre seu user_id:
--    SELECT id, email FROM auth.users WHERE email = 'seu-email@exemplo.com';
-- 2. Adicione role (substitua UUID):
--    INSERT INTO public.user_roles (user_id, role)
--    VALUES ('UUID-AQUI', 'admin')
--    ON CONFLICT (user_id, role) DO NOTHING;

-- Log
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas unificadas aplicadas!';
  RAISE NOTICE 'Todas as políticas agora usam: public.is_admin(auth.uid())';
  RAISE NOTICE 'Verifique se você é admin executando a query do PASSO 5';
END $$;


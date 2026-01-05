-- ============================================
-- Corrigir política de DELETE para bars
-- ============================================
-- Garante que apenas admins (via user_roles) possam deletar bars
-- ============================================

-- Remover todas as políticas de DELETE existentes
DROP POLICY IF EXISTS "Bars can be deleted by admins" ON bars;
DROP POLICY IF EXISTS "Admins can delete bars" ON bars;
DROP POLICY IF EXISTS "Bars can be deleted by authenticated users" ON bars;
DROP POLICY IF EXISTS "Authenticated users can delete bars" ON bars;
DROP POLICY IF EXISTS "Anyone can delete bars" ON bars;

-- Criar política correta usando is_admin (que verifica user_roles)
CREATE POLICY "Admins can delete bars"
  ON bars
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Comentário
COMMENT ON POLICY "Admins can delete bars" ON bars IS 
  'Permite que apenas usuários com role admin na tabela user_roles possam deletar bars';


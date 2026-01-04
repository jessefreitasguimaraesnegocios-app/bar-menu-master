-- ============================================
-- CORRIGIR POLÍTICAS DE DELETE USANDO auth.jwt()
-- ============================================
-- Corrige políticas de DELETE para usar auth.jwt() ao invés de auth.users
-- Isso resolve o erro "permission denied for table users"
-- ============================================

-- Remover todas as políticas de DELETE existentes
DROP POLICY IF EXISTS "Bars can be deleted by admins" ON bars;
DROP POLICY IF EXISTS "Admins can delete bars" ON bars;
DROP POLICY IF EXISTS "Bars can be deleted by authenticated users" ON bars;
DROP POLICY IF EXISTS "Anyone can delete bars" ON bars;

-- Criar política de DELETE usando auth.jwt() (não acessa auth.users diretamente)
CREATE POLICY "Bars can be deleted by admins"
  ON bars FOR DELETE
  USING (
    -- Verificar se o usuário está autenticado
    auth.uid() IS NOT NULL
    AND (
      -- Verificar role usando auth.jwt() (mais seguro e não requer acesso a auth.users)
      (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
    )
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
WHERE tablename = 'bars' AND cmd = 'DELETE';

-- Log
DO $$
BEGIN
  RAISE NOTICE '✅ Política de DELETE corrigida para usar auth.jwt()';
  RAISE NOTICE 'Agora não acessa auth.users diretamente, evitando erro de permissão';
  RAISE NOTICE 'Apenas usuários com role="admin" no user_metadata podem deletar bares';
END $$;


-- ============================================
-- GARANTIR POLÍTICAS DE EXCLUSÃO PARA BARS
-- ============================================
-- Verifica e garante que admins podem deletar bares
-- ============================================

-- Remover todas as políticas de DELETE existentes
DROP POLICY IF EXISTS "Bars can be deleted by admins" ON bars;
DROP POLICY IF EXISTS "Admins can delete bars" ON bars;
DROP POLICY IF EXISTS "Bars can be deleted by authenticated users" ON bars;
DROP POLICY IF EXISTS "Anyone can delete bars" ON bars;

-- Criar política permissiva para DELETE (apenas admins)
-- Usando apenas auth.jwt() para evitar erro "permission denied for table users"
CREATE POLICY "Bars can be deleted by admins"
  ON bars FOR DELETE
  USING (
    -- Verificar se o usuário está autenticado
    auth.uid() IS NOT NULL
    AND
    -- Verificar role usando auth.jwt() (não acessa auth.users diretamente)
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
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
  RAISE NOTICE 'Política de DELETE para admins verificada/recriada';
  RAISE NOTICE 'Admins podem agora deletar bares permanentemente';
END $$;


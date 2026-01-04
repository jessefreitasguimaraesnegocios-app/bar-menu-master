-- ============================================
-- ADICIONAR POLÍTICA DE INSERT PARA bars
-- ============================================
-- Execute este script APÓS o 02_orders.sql
-- Permite que usuários autenticados cadastrem estabelecimentos
-- ============================================

-- Remover política antiga se existir (para evitar duplicatas)
DROP POLICY IF EXISTS "Bars can be inserted by authenticated users" ON bars;
DROP POLICY IF EXISTS "Bars can be inserted by admins" ON bars;

-- Criar política de INSERT para usuários autenticados
-- Permite que qualquer usuário autenticado insira (pode ser restringido para apenas admins se necessário)
CREATE POLICY "Bars can be inserted by authenticated users"
  ON bars FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Alternativa: Se quiser restringir apenas para admins, use esta política:
-- CREATE POLICY "Bars can be inserted by admins"
--   ON bars FOR INSERT
--   WITH CHECK (
--     auth.uid() IS NOT NULL AND
--     (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
--   );

-- Opcional: Permitir UPDATE também (para editar estabelecimentos)
DROP POLICY IF EXISTS "Bars can be updated by authenticated users" ON bars;

CREATE POLICY "Bars can be updated by authenticated users"
  ON bars FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);


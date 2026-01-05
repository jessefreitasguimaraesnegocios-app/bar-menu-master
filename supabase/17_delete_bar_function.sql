-- ============================================
-- Função para deletar bar e todos os dados relacionados
-- ============================================
-- Esta função deleta um bar e todos os seus dados relacionados
-- de forma segura, respeitando as constraints do banco

CREATE OR REPLACE FUNCTION delete_bar_complete(bar_id_to_delete UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  is_user_admin BOOLEAN;
BEGIN
  -- Obter o ID do usuário atual
  current_user_id := auth.uid();
  
  -- Verificar se o usuário é admin
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Verificar se é admin usando a função is_admin
  SELECT public.is_admin(current_user_id) INTO is_user_admin;
  
  IF NOT is_user_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem deletar bares. Usuário: %', current_user_id;
  END IF;
  
  -- Verificar se o bar existe
  IF NOT EXISTS (SELECT 1 FROM bars WHERE id = bar_id_to_delete) THEN
    RAISE EXCEPTION 'Bar não encontrado: %', bar_id_to_delete;
  END IF;
  
  -- Deletar em ordem reversa das dependências
  
  -- 1. Deletar payments relacionados aos orders do bar
  DELETE FROM payments
  WHERE order_id IN (
    SELECT id FROM orders WHERE bar_id = bar_id_to_delete
  );
  
  -- 2. Deletar order_items relacionados aos orders do bar
  DELETE FROM order_items
  WHERE order_id IN (
    SELECT id FROM orders WHERE bar_id = bar_id_to_delete
  );
  
  -- 3. Deletar orders do bar
  DELETE FROM orders
  WHERE bar_id = bar_id_to_delete;
  
  -- 4. Deletar menu_items do bar
  DELETE FROM menu_items
  WHERE bar_id = bar_id_to_delete;
  
  -- 5. Deletar bar_settings do bar (se existir)
  DELETE FROM bar_settings
  WHERE bar_id = bar_id_to_delete;
  
  -- 6. Finalmente, deletar o bar
  DELETE FROM bars
  WHERE id = bar_id_to_delete;
  
  -- Se chegou aqui, tudo foi deletado com sucesso
  RAISE NOTICE 'Bar % e todos os dados relacionados foram deletados pelo usuário %', bar_id_to_delete, current_user_id;
END;
$$;

-- Permitir que admins executem esta função
GRANT EXECUTE ON FUNCTION delete_bar_complete(UUID) TO authenticated;

-- Comentário
COMMENT ON FUNCTION delete_bar_complete(UUID) IS 'Deleta um bar e todos os seus dados relacionados de forma segura';


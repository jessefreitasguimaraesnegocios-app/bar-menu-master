-- ============================================
-- TORNAR mp_user_id OPCIONAL (NULL)
-- ============================================
-- Permite criar bares sem mp_user_id inicialmente
-- O mp_user_id será preenchido quando o OAuth for conectado
-- ============================================

-- Remover constraint NOT NULL do mp_user_id
ALTER TABLE bars 
  ALTER COLUMN mp_user_id DROP NOT NULL;

-- Adicionar comentário explicando que é preenchido via OAuth
COMMENT ON COLUMN bars.mp_user_id IS 'ID do usuário no Mercado Pago. Preenchido automaticamente quando o OAuth é conectado. Pode ser NULL até a conexão.';

-- Verificar se a alteração foi aplicada
DO $$
BEGIN
  RAISE NOTICE 'Campo mp_user_id agora é opcional (pode ser NULL)';
  RAISE NOTICE 'Bares podem ser criados sem mp_user_id e conectados via OAuth depois';
END $$;


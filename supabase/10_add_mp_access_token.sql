-- ============================================
-- ADICIONAR CAMPO mp_access_token
-- ============================================
-- Adiciona campo mp_access_token na tabela bars para armazenar
-- o token OAuth do vendedor obtido via autorização Mercado Pago
-- ============================================

-- Adicionar coluna mp_access_token (se ainda não existir)
ALTER TABLE bars 
  ADD COLUMN IF NOT EXISTS mp_access_token TEXT;

-- Criar índice para busca por tokens
CREATE INDEX IF NOT EXISTS idx_bars_mp_access_token ON bars(mp_access_token) WHERE mp_access_token IS NOT NULL;

-- Comentário na coluna
COMMENT ON COLUMN bars.mp_access_token IS 'Access token OAuth do vendedor (bar) obtido via autorização Mercado Pago. Armazenado no backend (Edge Functions), nunca exposto ao client.';

-- Verificar se a coluna foi criada
DO $$
BEGIN
  RAISE NOTICE 'Coluna mp_access_token adicionada com sucesso!';
END $$;


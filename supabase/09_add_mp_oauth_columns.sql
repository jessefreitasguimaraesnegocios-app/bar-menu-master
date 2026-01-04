-- ============================================
-- ADICIONAR COLUNAS PARA OAUTH MERCADO PAGO
-- ============================================
-- Adiciona colunas para armazenar tokens OAuth do Mercado Pago
-- ============================================

-- Adicionar colunas para OAuth
ALTER TABLE bars 
  ADD COLUMN IF NOT EXISTS seller_access_token TEXT,
  ADD COLUMN IF NOT EXISTS mp_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS mp_oauth_connected_at TIMESTAMP WITH TIME ZONE;

-- Criar índice para busca por tokens
CREATE INDEX IF NOT EXISTS idx_bars_seller_access_token ON bars(seller_access_token) WHERE seller_access_token IS NOT NULL;

-- Comentários nas colunas
COMMENT ON COLUMN bars.seller_access_token IS 'Access token OAuth do vendedor (bar) obtido via autorização';
COMMENT ON COLUMN bars.mp_refresh_token IS 'Refresh token OAuth para renovar o access token';
COMMENT ON COLUMN bars.mp_oauth_connected_at IS 'Data/hora da última conexão OAuth bem-sucedida';

-- Verificar se as colunas foram criadas
DO $$
BEGIN
  RAISE NOTICE 'Colunas OAuth adicionadas com sucesso!';
  RAISE NOTICE 'Colunas adicionadas:';
  RAISE NOTICE '  - seller_access_token';
  RAISE NOTICE '  - mp_refresh_token';
  RAISE NOTICE '  - mp_oauth_connected_at';
END $$;


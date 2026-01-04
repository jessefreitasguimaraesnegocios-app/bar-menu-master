-- ============================================
-- MIGRAÇÃO: Adicionar status de preparação para staff
-- ============================================
-- Execute este arquivo para adicionar status 'preparing' e 'ready'
-- ============================================

-- Adicionar novos valores ao enum order_status
DO $$ 
BEGIN
  -- Adicionar 'preparing' se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'preparing' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
  ) THEN
    ALTER TYPE order_status ADD VALUE 'preparing';
  END IF;

  -- Adicionar 'ready' se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'ready' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
  ) THEN
    ALTER TYPE order_status ADD VALUE 'ready';
  END IF;
END $$;

-- Comentário sobre os status
COMMENT ON TYPE order_status IS 'Status do pedido: pending (pendente), approved (aprovado/pago), preparing (preparando), ready (pronto), rejected (rejeitado), cancelled (cancelado), refunded (reembolsado)';


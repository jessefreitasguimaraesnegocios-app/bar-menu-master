-- ============================================
-- Adicionar coluna kitchen_status na tabela orders
-- ============================================
-- Este arquivo adiciona o status de cozinha para
-- gerenciar o fluxo de preparo dos pedidos
-- ============================================

-- Criar enum para status da cozinha
DO $$ BEGIN
  CREATE TYPE kitchen_status AS ENUM ('pending', 'preparing', 'ready', 'delivered');
EXCEPTION
  WHEN duplicate_object THEN 
    -- Adicionar 'delivered' se não existir
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'delivered' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'kitchen_status')
    ) THEN
      ALTER TYPE kitchen_status ADD VALUE 'delivered';
    END IF;
END $$;

-- Adicionar coluna kitchen_status à tabela orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS kitchen_status kitchen_status DEFAULT 'pending';

-- Criar índice para busca rápida por status de cozinha
CREATE INDEX IF NOT EXISTS idx_orders_kitchen_status ON orders(kitchen_status);

-- Habilitar realtime para a tabela orders
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Atualizar REPLICA IDENTITY para capturar dados completos
ALTER TABLE orders REPLICA IDENTITY FULL;

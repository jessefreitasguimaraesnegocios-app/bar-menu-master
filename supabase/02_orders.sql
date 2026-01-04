-- ============================================
-- Schema para Pedidos e Pagamentos
-- ============================================
-- Este arquivo cria as tabelas necessárias para
-- gerenciar pedidos e pagamentos com Mercado Pago
-- ============================================
-- IMPORTANTE: Execute este arquivo APÓS o schema.sql
-- que contém a tabela menu_items e a função update_updated_at_column()
-- ============================================

-- ============================================
-- TABELA: bars (Bares/Restaurantes)
-- ============================================
-- Se a tabela bars já existe, este comando será ignorado
CREATE TABLE IF NOT EXISTS bars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  mp_user_id VARCHAR(255), -- ID do Mercado Pago do bar
  commission_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.05 CHECK (commission_rate >= 0 AND commission_rate <= 1),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_bars_mp_user_id ON bars(mp_user_id);
CREATE INDEX IF NOT EXISTS idx_bars_active ON bars(active);
CREATE INDEX IF NOT EXISTS idx_bars_slug ON bars(slug);

-- ============================================
-- TABELA: platform_settings (Configurações da Plataforma)
-- ============================================
CREATE TABLE IF NOT EXISTS platform_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  commission_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.05 CHECK (commission_rate >= 0 AND commission_rate <= 1),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_bars_updated_at
  BEFORE UPDATE ON bars
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS para bars
ALTER TABLE bars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bars are viewable by everyone"
  ON bars
  FOR SELECT
  USING (active = TRUE);

CREATE POLICY "Authenticated users can insert bars"
  ON bars
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update bars"
  ON bars
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete bars"
  ON bars
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- RLS para platform_settings
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform settings are viewable by everyone"
  ON platform_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can update platform settings"
  ON platform_settings
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- ENUM: Status do Pedido
-- ============================================
CREATE TYPE order_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'refunded'
);

-- ============================================
-- ENUM: Status do Pagamento
-- ============================================
CREATE TYPE payment_status AS ENUM (
  'pending',
  'approved',
  'authorized',
  'in_process',
  'in_mediation',
  'rejected',
  'cancelled',
  'refunded',
  'charged_back'
);

-- ============================================
-- ENUM: Método de Pagamento
-- ============================================
CREATE TYPE payment_method_type AS ENUM (
  'credit_card',
  'debit_card',
  'pix',
  'bank_transfer',
  'ticket',
  'other'
);

-- ============================================
-- TABELA: orders (Pedidos)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bar_id UUID NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  status order_status NOT NULL DEFAULT 'pending',
  payment_method payment_method_type,
  mp_preference_id VARCHAR(255),
  mp_payment_id BIGINT,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: order_items (Itens do Pedido)
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: payments (Pagamentos)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  mp_payment_id BIGINT NOT NULL UNIQUE,
  status payment_status NOT NULL DEFAULT 'pending',
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  fee_amount DECIMAL(10, 2) DEFAULT 0 CHECK (fee_amount >= 0),
  marketplace_fee DECIMAL(10, 2) DEFAULT 0 CHECK (marketplace_fee >= 0),
  bar_amount DECIMAL(10, 2) NOT NULL CHECK (bar_amount >= 0),
  payment_method payment_method_type NOT NULL,
  mp_notification_data JSONB,
  mp_merchant_order_id BIGINT,
  mp_status_detail VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES para Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_bar_id ON orders(bar_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_mp_preference_id ON orders(mp_preference_id);
CREATE INDEX IF NOT EXISTS idx_orders_mp_payment_id ON orders(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_mp_payment_id ON payments(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ============================================
-- Trigger para atualizar updated_at
-- ============================================
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Políticas para orders
CREATE POLICY "Orders are viewable by everyone"
  ON orders
  FOR SELECT
  USING (true);

CREATE POLICY "Orders can be inserted by everyone"
  ON orders
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Orders can be updated by everyone"
  ON orders
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Políticas para order_items
CREATE POLICY "Order items are viewable by everyone"
  ON order_items
  FOR SELECT
  USING (true);

CREATE POLICY "Order items can be inserted by everyone"
  ON order_items
  FOR INSERT
  WITH CHECK (true);

-- Políticas para payments
CREATE POLICY "Payments are viewable by everyone"
  ON payments
  FOR SELECT
  USING (true);

CREATE POLICY "Payments can be inserted by everyone"
  ON payments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Payments can be updated by everyone"
  ON payments
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================
-- FUNÇÃO: Criar pedido completo
-- ============================================
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_bar_id UUID,
  p_total_amount DECIMAL,
  p_items JSONB,
  p_customer_name VARCHAR DEFAULT NULL,
  p_customer_email VARCHAR DEFAULT NULL,
  p_customer_phone VARCHAR DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
BEGIN
  -- Criar pedido
  INSERT INTO orders (
    bar_id,
    total_amount,
    status,
    customer_name,
    customer_email,
    customer_phone,
    notes
  ) VALUES (
    p_bar_id,
    p_total_amount,
    'pending',
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_notes
  ) RETURNING id INTO v_order_id;

  -- Inserir itens do pedido
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id,
      menu_item_id,
      quantity,
      price,
      subtotal
    ) VALUES (
      v_order_id,
      (v_item->>'item_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price')::DECIMAL,
      (v_item->>'subtotal')::DECIMAL
    );
  END LOOP;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEW: Pedidos com resumo
-- ============================================
CREATE OR REPLACE VIEW orders_summary AS
SELECT 
  o.id,
  o.bar_id,
  o.total_amount,
  o.status,
  o.payment_method,
  o.mp_preference_id,
  o.mp_payment_id,
  o.customer_name,
  o.customer_email,
  o.created_at,
  o.updated_at,
  COUNT(oi.id) as items_count,
  COALESCE(p.status, 'pending'::payment_status) as payment_status,
  COALESCE(p.amount, 0) as payment_amount
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN payments p ON p.order_id = o.id
GROUP BY o.id, p.status, p.amount;


-- ============================================
-- Script para criar um bar padrão (exemplo)
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- para criar um bar de exemplo para testes
-- ============================================

-- IMPORTANTE: Substitua os valores abaixo pelos seus dados reais do Mercado Pago

INSERT INTO bars (name, mp_user_id, commission_rate, is_active)
VALUES (
  'Cantim Bar',  -- Nome do seu bar
  'SEU_MP_USER_ID_AQUI',  -- ID do Mercado Pago do bar (obrigatório)
  0.05,  -- Taxa de comissão (5% = 0.05)
  true   -- Bar ativo
)
ON CONFLICT DO NOTHING;  -- Evita duplicar se já existir

-- Para verificar se o bar foi criado:
SELECT id, name, mp_user_id, commission_rate, is_active, created_at 
FROM bars 
WHERE is_active = true;

-- ============================================
-- NOTAS:
-- ============================================
-- 1. mp_user_id: Este é o ID do vendedor no Mercado Pago
--    - Para obter: https://www.mercadopago.com.br/developers/panel/app/{APP_ID}/credentials
--    - Ou consulte a documentação do Mercado Pago Marketplace
--
-- 2. commission_rate: Taxa de comissão da plataforma
--    - 0.05 = 5% para a plataforma, 95% para o bar
--    - 0.10 = 10% para a plataforma, 90% para o bar
--    - Valor entre 0 e 1
--
-- 3. O sistema buscará automaticamente o primeiro bar ativo
--    quando não houver bar_id na URL ou localStorage


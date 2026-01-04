-- ============================================
-- Script de Verificação do Schema
-- ============================================
-- Execute este script para verificar se todas as
-- tabelas, políticas e funções foram criadas corretamente
-- ============================================

-- Verificar se a tabela menu_items existe
SELECT 
  'Tabela menu_items' as verificação,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'menu_items')
    THEN '✓ Existe'
    ELSE '✗ Não existe'
  END as status;

-- Verificar colunas da tabela menu_items
SELECT 
  'Colunas da tabela' as verificação,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'menu_items'
ORDER BY ordinal_position;

-- Verificar tipo da coluna category (deve ser VARCHAR, não ENUM)
SELECT 
  'Tipo da coluna category' as verificação,
  column_name,
  data_type,
  udt_name,
  CASE 
    WHEN data_type = 'character varying' OR data_type = 'varchar'
    THEN '✓ VARCHAR (permite categorias customizadas)'
    WHEN udt_name = 'category_type'
    THEN '⚠ ENUM (execute 08_update_category_to_varchar.sql)'
    ELSE '✗ Tipo desconhecido'
  END as status
FROM information_schema.columns
WHERE table_name = 'menu_items'
AND column_name = 'category';

-- Verificar índices
SELECT 
  'Índices' as verificação,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'menu_items'
ORDER BY indexname;

-- Verificar se RLS está habilitado
SELECT 
  'RLS Habilitado' as verificação,
  CASE 
    WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'menu_items')
    THEN '✓ Habilitado'
    ELSE '✗ Desabilitado'
  END as status;

-- Verificar políticas RLS
SELECT 
  'Políticas RLS' as verificação,
  policyname,
  cmd as operação,
  qual as condição_using,
  with_check as condição_check
FROM pg_policies
WHERE tablename = 'menu_items'
ORDER BY policyname;

-- Verificar triggers
SELECT 
  'Triggers' as verificação,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'menu_items'
ORDER BY trigger_name;

-- Verificar funções
SELECT 
  'Funções' as verificação,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN ('update_updated_at_column', 'soft_delete_menu_item')
ORDER BY routine_name;

-- Verificar view
SELECT 
  'View active_menu_items' as verificação,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.views WHERE table_name = 'active_menu_items')
    THEN '✓ Existe'
    ELSE '✗ Não existe'
  END as status;

-- Contar itens na tabela
SELECT 
  'Total de itens' as verificação,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_active = TRUE) as ativos,
  COUNT(*) FILTER (WHERE is_active = FALSE) as inativos
FROM menu_items;

-- Verificar itens por categoria
SELECT 
  'Itens por categoria' as verificação,
  category,
  COUNT(*) as total
FROM menu_items
WHERE is_active = TRUE
GROUP BY category
ORDER BY category;

-- ============================================
-- Verificar tabela bars
-- ============================================
SELECT 
  'Tabela bars' as verificação,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bars')
    THEN '✓ Existe'
    ELSE '✗ Não existe'
  END as status;

-- Verificar colunas da tabela bars
SELECT 
  'Colunas da tabela bars' as verificação,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'bars'
ORDER BY ordinal_position;

-- Verificar se campo slug existe na tabela bars
SELECT 
  'Campo slug em bars' as verificação,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'bars' AND column_name = 'slug'
    )
    THEN '✓ Existe'
    ELSE '✗ Não existe (execute 06_add_slug_and_settings.sql)'
  END as status;

-- Verificar políticas RLS da tabela bars
SELECT 
  'Políticas RLS - bars' as verificação,
  policyname,
  cmd as operação,
  qual as condição_using,
  with_check as condição_check
FROM pg_policies
WHERE tablename = 'bars'
ORDER BY policyname;

-- ============================================
-- Verificar tabela bar_settings
-- ============================================
SELECT 
  'Tabela bar_settings' as verificação,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bar_settings')
    THEN '✓ Existe'
    ELSE '✗ Não existe (execute 06_add_slug_and_settings.sql)'
  END as status;

-- Verificar colunas da tabela bar_settings
SELECT 
  'Colunas da tabela bar_settings' as verificação,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'bar_settings'
ORDER BY ordinal_position;

-- Verificar políticas RLS da tabela bar_settings
SELECT 
  'Políticas RLS - bar_settings' as verificação,
  policyname,
  cmd as operação,
  qual as condição_using,
  with_check as condição_check
FROM pg_policies
WHERE tablename = 'bar_settings'
ORDER BY policyname;

-- ============================================
-- Verificar tabelas de pedidos (orders)
-- ============================================
SELECT 
  'Tabela orders' as verificação,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders')
    THEN '✓ Existe'
    ELSE '✗ Não existe (execute 02_orders.sql)'
  END as status;

SELECT 
  'Tabela order_items' as verificação,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'order_items')
    THEN '✓ Existe'
    ELSE '✗ Não existe (execute 02_orders.sql)'
  END as status;

SELECT 
  'Tabela payments' as verificação,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payments')
    THEN '✓ Existe'
    ELSE '✗ Não existe (execute 02_orders.sql)'
  END as status;

-- ============================================
-- Verificar foreign keys
-- ============================================
SELECT 
  'Foreign Keys' as verificação,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('menu_items', 'bars', 'bar_settings', 'orders', 'order_items', 'payments')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- Resumo de configurações de bares
-- ============================================
SELECT 
  'Configurações de bares' as verificação,
  COUNT(*) as total_bars,
  COUNT(bs.id) as bars_com_configuracoes,
  COUNT(CASE WHEN bs.webhook_kitchen_enabled THEN 1 END) as webhooks_cozinha_habilitados,
  COUNT(CASE WHEN bs.webhook_bartender_enabled THEN 1 END) as webhooks_barman_habilitados,
  COUNT(CASE WHEN bs.webhook_waiter_enabled THEN 1 END) as webhooks_garcom_habilitados
FROM bars b
LEFT JOIN bar_settings bs ON bs.bar_id = b.id
WHERE b.is_active = TRUE;

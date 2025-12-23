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

-- Verificar se o tipo ENUM category_type existe
SELECT 
  'Tipo ENUM category_type' as verificação,
  CASE 
    WHEN EXISTS (SELECT FROM pg_type WHERE typname = 'category_type')
    THEN '✓ Existe'
    ELSE '✗ Não existe'
  END as status;

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





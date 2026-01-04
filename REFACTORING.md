# Resumo da Refatoração

## Mudanças Implementadas

### 1. Sistema de Rotas Dinâmicas por Bar ✅
- **Novo**: `/bar/:slug` - Página inicial do bar
- **Novo**: `/bar/:slug/menu` - Cardápio específico do bar
- Cada bar agora tem sua própria URL única baseada no slug

### 2. Campo Slug na Tabela Bars ✅
- Migração SQL criada: `supabase/06_add_slug_and_settings.sql`
- Slug gerado automaticamente ao criar bar (baseado no nome)
- Slug único garantido (com sufixo numérico se necessário)

### 3. Modelo Padrão ao Criar Bar ✅
- Ao cadastrar um bar no `/admin`, são criados automaticamente:
  - Slug único
  - Usuário owner no Supabase Auth com `bar_id` no metadata
  - Configurações padrão em `bar_settings` (via trigger)
  - Itens padrão do menu (água, refrigerante)

### 4. Checkout Mercado Pago Completo ✅
- `CartContext` agora tem método `checkout()`
- Cria pedido no banco de dados
- Chama Edge Function `create-payment`
- Redireciona para checkout do Mercado Pago
- Split payment automático baseado em `mp_user_id` e `commission_rate`

### 5. Sistema de Webhooks Configurável ✅
- Nova tabela `bar_settings` com campos para webhooks:
  - `webhook_kitchen_url`, `webhook_kitchen_enabled`
  - `webhook_bartender_url`, `webhook_bartender_enabled`
  - `webhook_waiter_url`, `webhook_waiter_enabled`
- Webhooks serão chamados pela Edge Function `mp-webhook` quando:
  - Pedido é criado (cozinha)
  - Pedido contém bebidas (barman)
  - Pedido está pronto (garçom)

### 6. Novos Hooks e Componentes ✅
- `useBar(slug)`: Busca bar por slug
- `useMenuItemsByBar(barId)`: Busca itens específicos do bar
- `BarIndex.tsx`: Página inicial do bar
- `BarMenu.tsx`: Cardápio do bar

### 7. Atualizações em Componentes Existentes ✅
- `HeroSection`: Aceita `barName` prop
- `FeaturedSection`: Aceita `barSlug` prop
- `CategoryFilter`: Aceita `barId` prop opcional
- `ItemDetailModal`: Aceita `onAddToCart` callback opcional
- `CartDrawer`: Integrado com checkout, detecta barId automaticamente

### 8. Código Legado Removido ✅
- ❌ `src/pages/Cadastro.tsx` removido (funcionalidade movida para `AdminPortal`)

## Como Usar

### Para Administradores

1. **Acessar `/admin`** (requer login como admin)
2. **Cadastrar novo bar**:
   - Preencher nome, email, senha do owner
   - Informar `mp_user_id` do Mercado Pago
   - Definir taxa de comissão
   - Slug será gerado automaticamente
3. **Gerenciar categorias**:
   - Criar categorias customizadas
   - Controlar disponibilidade por bar
4. **Configurar webhooks**:
   - Acessar "Config" no bar
   - Inserir URLs dos webhooks
   - Habilitar/desabilitar cada um

### Para Owners

1. **Fazer login** em `/login`
2. **Acessar `/owner`** para:
   - Gerenciar produtos do seu bar
   - Editar preços e descrições
   - Ver pedidos (futuro)

### Para Clientes

1. **Acessar cardápio do bar**:
   - URL: `/bar/nome-do-bar/menu`
   - O slug pode ser encontrado no AdminPortal
2. **Fazer pedido**:
   - Adicionar itens ao carrinho
   - Finalizar pedido
   - Ser redirecionado para pagamento no Mercado Pago

## Próximos Passos Recomendados

1. **Executar migração SQL**: Execute `supabase/06_add_slug_and_settings.sql` no Supabase
2. **Atualizar bares existentes**: Se já houver bares cadastrados, gere slugs para eles
3. **Configurar webhooks**: Configure URLs de webhook para cada bar no AdminPortal
4. **Testar checkout**: Faça um pedido de teste para verificar split payment

## Migração de Dados Existentes

Se você já tem bares cadastrados, execute este SQL para gerar slugs:

```sql
UPDATE bars 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'),
    '\s+', '-', 'g'
  )
) || '-' || SUBSTRING(id::TEXT, 1, 8)
WHERE slug IS NULL;
```

---

**Refatoração concluída em:** $(date)







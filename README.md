# Sistema de Cardápio Digital Multi-Bar

Sistema completo de gestão de cardápios digitais para múltiplos estabelecimentos (bares/restaurantes), com integração ao Mercado Pago para pagamentos com split automático e webhooks configuráveis.

## 📋 Visão Geral

Este sistema permite que:

1. **Admin** gerencie múltiplos estabelecimentos através do `/admin`
2. **Cada bar** tenha seu próprio portal (`/owner`) para gerenciar produtos, preços e configurações
3. **Clientes** acessem cardápios individuais através de rotas dinâmicas (`/bar/:slug`)
4. **Pagamentos** sejam processados via Mercado Pago com split automático configurável
5. **Webhooks** notifiquem cozinha, barman e garçom quando pedidos são criados/atualizados

## 🏗️ Arquitetura

### Estrutura de Rotas

```
/ (rota padrão - fallback)
/menu (cardápio padrão)

/bar/:slug (página inicial do bar)
/bar/:slug/menu (cardápio do bar)

/login (login para owners)
/admin (portal administrativo - apenas admin)
/owner (portal do dono - apenas owners)

/payment/success (página de sucesso do pagamento)
/payment/failure (página de falha do pagamento)
```

### Banco de Dados (Supabase)

#### Tabelas Principais

- **`bars`**: Informações dos estabelecimentos
  - `id` (UUID)
  - `name` (VARCHAR)
  - `slug` (VARCHAR UNIQUE) - usado nas rotas dinâmicas
  - `mp_user_id` (VARCHAR) - ID do usuário no Mercado Pago para split
  - `commission_rate` (DECIMAL) - taxa de comissão da plataforma
  - `is_active` (BOOLEAN)

- **`menu_items`**: Itens do cardápio
  - `id` (UUID)
  - `bar_id` (UUID FK) - associação com o bar
  - `name`, `description`, `price`, `category`, `image`
  - `ingredients`, `preparation`, `abv`
  - `is_popular`, `is_new`, `is_active`

- **`orders`**: Pedidos dos clientes
  - `id` (UUID)
  - `bar_id` (UUID FK)
  - `total_amount` (DECIMAL)
  - `status` (ENUM: pending, approved, rejected, cancelled, refunded)
  - `customer_name`, `customer_email`, `customer_phone`
  - `mp_preference_id`, `mp_payment_id`

- **`order_items`**: Itens de cada pedido
  - `order_id` (UUID FK)
  - `menu_item_id` (UUID FK)
  - `quantity`, `price`, `subtotal`

- **`payments`**: Registros de pagamento
  - `order_id` (UUID FK)
  - `mp_payment_id` (BIGINT UNIQUE)
  - `status` (ENUM: pending, approved, authorized, etc.)
  - `amount`, `fee_amount`, `marketplace_fee`, `bar_amount`
  - `payment_method`

- **`bar_settings`**: Configurações por bar
  - `bar_id` (UUID FK UNIQUE)
  - **Webhooks:**
    - `webhook_kitchen_url`, `webhook_kitchen_enabled`
    - `webhook_bartender_url`, `webhook_bartender_enabled`
    - `webhook_waiter_url`, `webhook_waiter_enabled`
  - **Aparência:**
    - `primary_color`, `secondary_color`
    - `font_family`, `logo_url`
  - **Gerais:**
    - `auto_accept_orders`, `min_order_value`

### Autenticação

O sistema usa **Supabase Auth** com roles customizadas:

- **`admin`**: Acesso ao `/admin` para gerenciar todos os bares
- **`owner`**: Acesso ao `/owner` para gerenciar apenas seu bar

Os metadados do usuário (`user_metadata`) contêm:
```json
{
  "role": "admin" | "owner",
  "bar_id": "uuid-do-bar" // apenas para owners
}
```

## 🚀 Funcionalidades

### Portal Admin (`/admin`)

O `/admin` é a **página mãe** do sistema, onde o administrador principal:

1. **Cadastra novos bares**:
   - Nome do estabelecimento
   - Email e senha do owner
   - ID do Mercado Pago (`mp_user_id`)
   - Taxa de comissão
   - Cria automaticamente:
     - Slug único para rotas
     - Usuário owner no Supabase Auth
     - Configurações padrão em `bar_settings`
     - Itens padrão do menu

2. **Gerencia categorias**:
   - Visualiza categorias padrão (Coquetéis, Cervejas, Vinhos, etc.)
   - Cria categorias customizadas
   - Controla disponibilidade por bar:
     - **Indisponível**: Não aparece para o bar
     - **Disponível**: Pode ser adicionado ao bar
     - **Em uso**: Aparece no cardápio do bar

3. **Gerenciamento de produtos**:
   - Visualiza todos os produtos de todos os bares
   - Adiciona, edita e remove produtos

4. **Configurações de bares**:
   - Configura webhooks (cozinha, barman, garçom)
   - Personaliza cores e logo
   - Define valor mínimo de pedido

### Portal do Dono (`/owner`)

Cada bar tem acesso ao `/owner` para:

1. **Gerenciar produtos**:
   - Ver apenas produtos do seu bar
   - Adicionar novos produtos
   - Editar preços e descrições
   - Marcar como popular ou novo

2. **Visualizar pedidos** (futuro):
   - Ver pedidos pendentes
   - Atualizar status dos pedidos

### Cardápio Público

#### Rota padrão (`/menu`)
Cardápio genérico (fallback) que mostra todos os produtos quando não há bar específico.

#### Rota dinâmica (`/bar/:slug/menu`)
Cardápio específico do bar:
- Filtra produtos por `bar_id`
- Mostra apenas categorias marcadas como "Em uso" para aquele bar
- Permite adicionar ao carrinho e fazer checkout

### Checkout e Pagamento

1. **Cliente adiciona itens ao carrinho**
2. **Ao finalizar**, o sistema:
   - Cria um pedido no banco (`orders` e `order_items`)
   - Chama a Edge Function `create-payment`
   - A Edge Function cria preferência no Mercado Pago com:
     - Split payment configurado via `mp_user_id` do bar
     - Taxa de comissão aplicada automaticamente
     - Webhooks configurados para notificar mudanças de status
   - Redireciona para o checkout do Mercado Pago

3. **Após pagamento**, o Mercado Pago envia webhook para `mp-webhook`:
   - Atualiza status do pedido
   - Atualiza status do pagamento
   - Calcula split (valor do bar vs comissão)
   - Envia notificações para webhooks configurados (cozinha, barman, garçom)

### Webhooks Configuráveis

Cada bar pode configurar URLs de webhook no AdminPortal:

- **Cozinha**: Notificado quando pedido é criado/aprovado
- **Barman**: Notificado quando há itens de bebidas
- **Garçom**: Notificado quando pedido está pronto para entrega

Os webhooks são enviados apenas se:
1. Estão **habilitados** (`webhook_*_enabled = true`)
2. Têm **URL configurada** (`webhook_*_url`)

## 🛠️ Configuração

### Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

### Edge Functions (Supabase)

Configure as seguintes variáveis de ambiente nas Edge Functions:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
MP_ACCESS_TOKEN_MARKETPLACE=seu-access-token-mercadopago
```

### Banco de Dados

Execute os arquivos SQL na ordem:

1. `supabase/01_schema.sql` - Schema principal
2. `supabase/02_orders.sql` - Schema de pedidos
3. `supabase/03_background-images.sql` - Imagens de fundo (opcional)
4. `supabase/04_storage.sql` - Storage (opcional)
5. `supabase/06_add_slug_and_settings.sql` - Slug e configurações

### Mercado Pago

1. Crie uma conta no Mercado Pago
2. Acesse o Dashboard > Aplicações
3. Crie uma aplicação Marketplace
4. Copie o **Access Token** (production ou test)
5. Configure o webhook na aplicação:
   - URL: `https://seu-projeto.supabase.co/functions/v1/mp-webhook`

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🔐 Segurança

### Row Level Security (RLS)

Todas as tabelas têm RLS habilitado:

- **Bars**: Públicos podem ver apenas bares ativos
- **Menu Items**: Públicos podem ver apenas itens ativos; Owners podem gerenciar apenas seus itens
- **Orders**: Públicos podem criar pedidos; Owners podem ver apenas pedidos do seu bar
- **Bar Settings**: Apenas owners e admins podem ver/editar

### Autenticação

- Login protegido por Supabase Auth
- Roles verificadas em `ProtectedRoute`
- `bar_id` validado antes de permitir acesso a recursos

## 📝 Notas Importantes

1. **Slug único**: Ao cadastrar um bar, um slug é gerado automaticamente do nome. Se já existir, um sufixo numérico é adicionado.

2. **Modelo padrão**: Ao criar um bar, são criados automaticamente:
   - Registro em `bar_settings` com valores padrão
   - Alguns itens básicos do menu (pode ser customizado)

3. **Categorias**: As categorias são gerenciadas no `/admin` e podem ser:
   - Padrão (hardcoded no sistema)
   - Customizadas (criadas pelo admin)

4. **Split Payment**: O Mercado Pago faz o split automaticamente baseado no `mp_user_id` e `commission_rate` do bar.

5. **Webhooks**: As URLs de webhook devem aceitar requisições POST e retornar status 200. O payload enviado contém informações do pedido e status do pagamento.

## 🐛 Troubleshooting

### "Bar não encontrado"
- Verifique se o slug está correto na URL
- Confirme que o bar está `is_active = true`

### "Usuário não associado a um bar"
- Verifique se o `user_metadata.bar_id` está configurado corretamente no Supabase Auth
- Para corrigir: No Supabase Dashboard > Authentication > Users > Editar usuário > Adicionar `bar_id` no User Metadata

### "Erro ao criar pagamento"
- Verifique se `MP_ACCESS_TOKEN_MARKETPLACE` está configurado
- Confirme que o `mp_user_id` do bar está correto
- Verifique os logs da Edge Function `create-payment`

## 📚 Arquivos Principais

```
src/
├── pages/
│   ├── AdminPortal.tsx      # Portal administrativo
│   ├── OwnerPortal.tsx      # Portal do dono
│   ├── BarIndex.tsx         # Página inicial do bar
│   ├── BarMenu.tsx          # Cardápio do bar
│   └── ...
├── components/
│   ├── admin/
│   │   ├── BarFormDialog.tsx
│   │   ├── BarSettingsDialog.tsx
│   │   └── ...
│   └── ...
├── hooks/
│   ├── useBar.ts            # Hook para buscar bar por slug
│   ├── useMenuItemsByBar.ts # Hook para buscar itens por bar
│   └── ...
├── contexts/
│   ├── AuthContext.tsx      # Gerenciamento de autenticação
│   └── CartContext.tsx      # Gerenciamento do carrinho
└── ...

supabase/
├── functions/
│   ├── create-payment/      # Cria preferência no Mercado Pago
│   └── mp-webhook/          # Recebe notificações do Mercado Pago
└── 06_add_slug_and_settings.sql
```

## 🎯 Próximos Passos

- [ ] Dashboard de pedidos no `/owner`
- [ ] Notificações em tempo real (Supabase Realtime)
- [ ] Relatórios de vendas
- [ ] Integração com sistemas de delivery
- [ ] App mobile (React Native)

---

**Desenvolvido com ❤️ usando React, TypeScript, Supabase e Mercado Pago**

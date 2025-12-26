# Configuração de Integração Mercado Pago

## Visão Geral

Este documento descreve como configurar a integração completa do Mercado Pago com split payment (95% para o bar, 5% para a plataforma).

## Pré-requisitos

1. Conta do Mercado Pago configurada
2. Access Token de Produção do Marketplace (plataforma)
3. Supabase configurado e rodando
4. Tabela `bars` criada com os dados dos bares

## Passo 1: Executar Schema SQL

Execute o arquivo `supabase/orders.sql` no SQL Editor do Supabase para criar as tabelas:

- `bars` (se ainda não existir)
- `orders`
- `order_items`
- `payments`

```sql
-- Execute supabase/orders.sql no SQL Editor
```

## Passo 2: Configurar Secrets no Supabase

No Supabase Dashboard, vá em **Settings > Edge Functions > Secrets** e adicione:

1. **MP_ACCESS_TOKEN_MARKETPLACE**: Access Token de produção do Mercado Pago (plataforma)
   - Exemplo: `APP_USR-xxxxx-xxxxxxxxxxxx`

2. **APP_URL**: URL base da aplicação (para back_urls)
   - Exemplo: `https://cardapio-bar.vercel.app`
   - Ou: `http://localhost:8080` (desenvolvimento)

## Passo 3: Deploy das Edge Functions

### Usando Supabase CLI (Recomendado)

```bash
# Instalar Supabase CLI se ainda não tiver
npm install -g supabase

# Login no Supabase
supabase login

# Link do projeto
supabase link --project-ref seu-project-ref

# Deploy das funções
supabase functions deploy create-payment
supabase functions deploy mp-webhook
```

### Usando Dashboard do Supabase

1. Vá em **Edge Functions** no menu lateral
2. Clique em **Create Function**
3. Para cada função:
   - Nome: `create-payment` ou `mp-webhook`
   - Cole o código do arquivo correspondente em `supabase/functions/[nome]/index.ts`
   - Clique em **Deploy**

## Passo 4: Configurar Webhook no Mercado Pago

1. Acesse o [Dashboard do Mercado Pago](https://www.mercadopago.com.br/developers/panel/app)
2. Vá em **Suas integrações > Webhooks**
3. Adicione uma URL de Webhook:
   ```
   https://[seu-projeto].supabase.co/functions/v1/mp-webhook
   ```
4. Selecione os eventos:
   - `payment`
   - `merchant_order` (opcional)

## Passo 5: Configurar Bar no Banco de Dados

**IMPORTANTE**: Você precisa criar pelo menos um bar no banco de dados para que o sistema funcione.

### Opção 1: Usar Script SQL (Recomendado)

Execute o arquivo `supabase/seed-bar.sql` no SQL Editor do Supabase:

1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Cole o conteúdo de `supabase/seed-bar.sql`
5. **Substitua `SEU_MP_USER_ID_AQUI` pelo ID real do Mercado Pago do bar**
6. Execute o script

### Opção 2: Inserir Manualmente

```sql
INSERT INTO bars (name, mp_user_id, commission_rate, is_active)
VALUES (
  'Nome do Seu Bar',
  'SEU_MP_USER_ID_AQUI', -- ID do Mercado Pago do bar (obrigatório)
  0.05, -- 5% de comissão para a plataforma
  true  -- Bar ativo
);
```

**Importante**: 
- O `mp_user_id` deve ser o ID do vendedor (bar) no Mercado Pago, não o ID da aplicação
- Para obter o `mp_user_id`: https://www.mercadopago.com.br/developers/panel/app/{APP_ID}/credentials

### Como o Sistema Busca o Bar

O sistema busca automaticamente o primeiro bar ativo (`is_active = true`) do banco de dados na seguinte ordem:

1. **Prioridade 1**: `bar_id` na URL (`?bar_id=uuid-do-bar`)
2. **Prioridade 2**: `bar_id` salvo no `localStorage`
3. **Prioridade 3**: Primeiro bar ativo do banco de dados (busca automática)

**Nota**: Se não houver nenhum bar cadastrado, você verá o erro "Bar não identificado" ao tentar finalizar um pagamento.

## Passo 6: Configurar Bar ID no Frontend (Opcional)

Se você quiser especificar um bar específico, pode fazer de três formas:

1. **Via URL**: `?bar_id=uuid-do-bar` (tem prioridade máxima)
2. **Via localStorage**: O sistema salva automaticamente quando um bar é usado
3. **Via código**: Use o hook `useBar()` para definir programaticamente

```typescript
import { useBar } from '@/contexts/BarContext';

const { setBarId } = useBar();
setBarId('uuid-do-bar');
```

**Recomendação**: Para a maioria dos casos, apenas crie um bar no banco de dados e deixe o sistema buscar automaticamente.

## Passo 7: Variáveis de Ambiente (Opcional)

Para desenvolvimento local, crie um arquivo `.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-dfd36007-cb2c-4a5e-bc64-1cb50264acbd
```

**Nota**: O Access Token NUNCA deve ser exposto no frontend. Sempre use Edge Functions.

## Fluxo de Pagamento

1. Usuário adiciona itens ao carrinho
2. Clica em "Finalizar Pagamento"
3. Frontend chama Edge Function `create-payment`
4. Edge Function:
   - Busca dados do bar
   - Cria preferência no Mercado Pago com split payment
   - Salva pedido no Supabase (status: pending)
   - Retorna `init_point` (URL do checkout)
5. Frontend redireciona para Mercado Pago
6. Usuário realiza pagamento (PIX/cartão)
7. Mercado Pago notifica webhook `mp-webhook`
8. Webhook atualiza pedido e cria registro de pagamento
9. Usuário retorna para `/payment/success` ou `/payment/failure`
10. Frontend exibe status do pagamento

## Split Payment

O split payment está configurado automaticamente:

- **95%** vai para o bar (`mp_user_id` do bar)
- **5%** vai para a plataforma (marketplace)

Isso é configurado na criação da preferência:

```typescript
{
  marketplace: bar.mp_user_id, // ID do bar
  marketplace_fee: 0.05, // 5% de comissão
  // ...
}
```

## Status dos Pedidos

- `pending`: Aguardando pagamento
- `approved`: Pagamento aprovado
- `rejected`: Pagamento rejeitado
- `cancelled`: Cancelado
- `refunded`: Estornado

## Testes

### Ambiente de Teste (Sandbox)

Para testar, use as credenciais de teste do Mercado Pago:

1. Acesse o [Painel de Desenvolvimento](https://www.mercadopago.com.br/developers/panel/credentials)
2. Use as credenciais de **TESTE**
3. Configure `MP_ACCESS_TOKEN_MARKETPLACE` com o token de teste
4. Use cartões de teste disponíveis na [documentação do MP](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards)

### Cartões de Teste

- **Aprovado**: 5031 4332 1540 6351
- **Rejeitado**: 5031 4332 1540 6351 (CVV incorreto)

## Troubleshooting

### Erro: "Bar não encontrado"
- Verifique se o `bar_id` está correto
- Verifique se o bar está ativo (`is_active = true`)

### Erro: "Credenciais do Mercado Pago não configuradas"
- Verifique se o secret `MP_ACCESS_TOKEN_MARKETPLACE` está configurado
- Verifique se está usando o token correto (produção ou teste)

### Webhook não recebe notificações
- Verifique se a URL do webhook está correta no Mercado Pago
- Verifique os logs da Edge Function no Supabase
- Verifique se o webhook está habilitado no Mercado Pago

### Split payment não funciona
- Verifique se o `mp_user_id` do bar está correto
- Verifique se a conta do bar está configurada para receber pagamentos
- Verifique se o marketplace está configurado corretamente

## Estrutura de Dados

### Tabela `orders`

- `id`: UUID do pedido
- `bar_id`: ID do bar
- `total_amount`: Valor total
- `status`: Status do pedido
- `mp_preference_id`: ID da preferência no Mercado Pago
- `mp_payment_id`: ID do pagamento no Mercado Pago
- `payment_method`: Método de pagamento usado
- `customer_name`, `customer_email`, `customer_phone`: Dados do cliente

### Tabela `payments`

- `id`: UUID do pagamento
- `order_id`: ID do pedido
- `mp_payment_id`: ID do pagamento no Mercado Pago
- `status`: Status do pagamento
- `amount`: Valor total
- `fee_amount`: Taxa cobrada pelo Mercado Pago
- `marketplace_fee`: Taxa da plataforma (5%)
- `bar_amount`: Valor que vai para o bar (95%)
- `payment_method`: Método de pagamento
- `mp_notification_data`: Dados completos da notificação (JSONB)

## Segurança

- ✅ Access Token nunca exposto no frontend
- ✅ Validação de dados no Edge Function
- ✅ RLS (Row Level Security) habilitado nas tabelas
- ✅ Verificação de assinatura do webhook (implementar se necessário)

## Próximos Passos

1. Implementar retry logic para pagamentos pendentes
2. Adicionar notificações por email
3. Criar dashboard de pedidos
4. Implementar estorno de pagamentos
5. Adicionar relatórios e analytics




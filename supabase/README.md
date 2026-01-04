# 📚 Documentação do Banco de Dados - Cardápio Cantim

## 🚀 Primeiros Passos

**👉 Comece aqui:** Leia o [Guia de Configuração do Supabase](CONFIG.md) para configurar tudo no dashboard.

## 📋 Arquivos SQL

Execute os arquivos na seguinte ordem:

### 1. `01_schema.sql`
Schema principal com tabela `menu_items`, ENUMs, funções e views.
- Cria estrutura básica do cardápio
- Configura RLS (Row Level Security)
- Cria views e funções auxiliares

### 2. `02_orders.sql`
Schema de pedidos e pagamentos (Mercado Pago).
- Tabelas: `bars`, `orders`, `order_items`, `payments`
- ENUMs para status
- Adiciona foreign key `bar_id` em `menu_items`
- Funções e views para gestão de pedidos

### 3. `03_background-images.sql`
Schema para imagens de fundo.
- Tabela `background_image_configs`
- Função para upsert de configurações

### 4. `04_storage.sql`
Configuração de buckets do Supabase Storage.
- Bucket `menu-images` (imagens do cardápio)
- Bucket `background-images` (imagens de fundo)
- Políticas de acesso

### 5. `05_seed.sql` (Opcional)
Dados iniciais de exemplo.
- Popula o banco com itens de exemplo
- Execute apenas se desejar dados de teste

### 6. `add_bars_insert_policy.sql` (Opcional, mas recomendado)
Política RLS para cadastro de estabelecimentos.
- Permite que usuários autenticados cadastrem novos estabelecimentos
- Necessário para usar a página `/cadastro`
- Execute após o `02_orders.sql`

### 7. `fix_security_definer_views.sql` (Recomendado)
Corrige problemas de segurança nas views.
- Converte views de SECURITY DEFINER para SECURITY INVOKER
- Resolve alertas do Security Advisor do Supabase
- Execute após os scripts principais

### 8. `check-schema.sql` (Opcional)
Script de verificação.
- Verifica se todas as tabelas, políticas e funções foram criadas corretamente
- Útil para debugging

## 🚀 Como Executar

1. Acesse o **Supabase Dashboard** → **SQL Editor**
2. Execute os arquivos na ordem numérica (01, 02, 03, 04, 05)
3. Execute `add_bars_insert_policy.sql` se quiser usar a página de cadastro
4. Opcionalmente, execute `check-schema.sql` para verificar

## ⚙️ Configuração Necessária

### Variáveis de Ambiente no Supabase

Configure no **Settings** → **Edge Functions** → **Secrets**:

- `MP_ACCESS_TOKEN_MARKETPLACE`: Access Token do Mercado Pago Marketplace

### Tabela bars

Crie um registro na tabela `bars` com:
- `name`: Nome do bar/restaurante
- `mp_user_id`: ID do usuário no Mercado Pago (para split automático)
- `commission_rate`: Taxa de comissão (ex: 0.05 para 5%)

Exemplo:
```sql
INSERT INTO bars (name, mp_user_id, commission_rate)
VALUES ('Meu Bar', '000117434618860', 0.05);
```

### Associar menu_items a bars

Após criar um bar, associe os itens do menu:

```sql
UPDATE menu_items
SET bar_id = (SELECT id FROM bars LIMIT 1)
WHERE bar_id IS NULL;
```

## 📁 Estrutura das Tabelas

### menu_items
Itens do cardápio (bebidas, pratos, etc.)

### bars
Bares/restaurantes configurados

### orders
Pedidos dos clientes

### order_items
Itens de cada pedido

### payments
Registros de pagamentos do Mercado Pago

### background_image_configs
Configurações de imagens de fundo (hero, menu, featured)

## 🔒 Segurança (RLS)

- **menu_items**: Público pode ler (apenas ativos), autenticados podem modificar
- **orders/order_items/payments**: Público (pode ser ajustado conforme necessidade)
- **background_image_configs**: Público (pode ler e modificar)
- **bars**: Público pode ler (apenas ativos), autenticados podem inserir/atualizar (se executar `add_bars_insert_policy.sql`)

## 🛠️ Edge Functions

### create-payment
Cria preferência de pagamento no Mercado Pago.

### mp-webhook
Recebe notificações do Mercado Pago e atualiza status dos pedidos.

## 📝 Notas Importantes

- As foreign keys usam `ON DELETE CASCADE` para manter integridade
- Timestamps são atualizados automaticamente via triggers
- Soft delete é usado em `menu_items` (campo `is_active`)
- O split de pagamento é gerenciado pelo Mercado Pago usando `mp_user_id`

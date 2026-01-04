# 🚀 Guia de Setup Completo

## 📋 Pré-requisitos

- Node.js 18+ e npm
- Conta no Supabase
- Conta no Mercado Pago (Marketplace)
- Conta no Vercel (para deploy)

## ⚙️ Configuração Passo a Passo

### 1. Variáveis de Ambiente

Crie `.env` na raiz:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

### 2. Banco de Dados (Supabase)

1. Acesse **Supabase Dashboard** → **SQL Editor**
2. Execute os scripts em ordem:
   - `supabase/01_schema.sql`
   - `supabase/02_orders.sql`
   - `supabase/03_background-images.sql`
   - `supabase/04_storage.sql`
   - `supabase/05_seed.sql` (opcional)

3. Configure Secrets:
   - **Settings** → **Edge Functions** → **Secrets**
   - Adicione: `MP_ACCESS_TOKEN_MARKETPLACE` (Access Token do Mercado Pago)

4. Crie um bar:
   ```sql
   INSERT INTO bars (name, mp_user_id, commission_rate)
   VALUES ('Meu Bar', 'SEU_MP_USER_ID', 0.05);
   ```

5. Associe itens ao bar:
   ```sql
   UPDATE menu_items
   SET bar_id = (SELECT id FROM bars LIMIT 1)
   WHERE bar_id IS NULL;
   ```

### 3. Edge Functions (Supabase)

Deploy das funções:
- `supabase/functions/create-payment/index.ts`
- `supabase/functions/mp-webhook/index.ts`

Via Dashboard: Copie o código e faça deploy.

### 4. Deploy Frontend (Vercel)

```bash
# Build
npm run build

# Deploy via Vercel CLI
vercel

# Ou conecte seu repositório no dashboard da Vercel
```

### 5. Configurar URLs de Retorno

As URLs de pagamento já estão configuradas para:
- `https://cardapio-bar.vercel.app/payment/success`
- `https://cardapio-bar.vercel.app/payment/failure`
- `https://cardapio-bar.vercel.app/payment/pending`

## 🔧 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor
npm run dev

# Build
npm run build
```

## 📝 Verificação

Execute `supabase/check-schema.sql` para verificar se tudo está configurado corretamente.

## 🐛 Troubleshooting

### Erro "Credenciais não configuradas"
- Verifique se `MP_ACCESS_TOKEN_MARKETPLACE` está configurado no Supabase

### Erro "auto_return invalid"
- Certifique-se de que a função `create-payment` está deployada com a versão mais recente

### Erro "Bar não encontrado"
- Verifique se existe um registro na tabela `bars`
- Verifique se `menu_items` têm `bar_id` associado


# 🔧 Guia de Configuração do Supabase

Este guia explica como configurar tudo no **Supabase Dashboard** passo a passo.

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com)
- Projeto criado no Supabase

## 🚀 Passo a Passo

### 1. Criar o Banco de Dados

1. Acesse o **SQL Editor** no menu lateral
2. Execute os scripts SQL **na ordem**:

   ```
    01_schema.sql        → Schema principal (menu_items)
    02_orders.sql        → Pedidos e pagamentos
    03_background-images.sql → Imagens de fundo
    04_storage.sql       → Buckets do Storage
    05_seed.sql          → Dados de exemplo (opcional)
    add_bars_insert_policy.sql → Permite cadastro de estabelecimentos (recomendado)
    ```

3. **Como executar:**
   - Clique em "New Query"
   - Cole o conteúdo do arquivo SQL
   - Clique em "Run" (ou Ctrl+Enter)
   - Aguarde a mensagem "Success"

4. **Política de Cadastro (Opcional):** Execute `add_bars_insert_policy.sql` se quiser usar a página `/cadastro` para cadastrar estabelecimentos

5. **Verificar:** Execute `check-schema.sql` para confirmar que tudo foi criado corretamente

### 2. Configurar Política de Cadastro (Opcional)

1. Execute o script `add_bars_insert_policy.sql` no SQL Editor
2. Isso permite que usuários autenticados cadastrem novos estabelecimentos
3. Necessário apenas se você quiser usar a página `/cadastro`

### 3. Configurar Storage Buckets

1. Vá em **Storage** no menu lateral
2. Os buckets serão criados automaticamente pelo script `04_storage.sql`
3. **Verificar se existem:**
   - `menu-images` (público)
   - `background-images` (público)
4. Se não existirem, execute novamente `04_storage.sql`

### 4. Configurar Edge Functions

#### 3.1. Criar a função `create-payment`

1. Vá em **Edge Functions** no menu lateral
2. Clique em "Create a new function"
3. Nome: `create-payment`
4. Cole o código de `functions/create-payment/index.ts`
5. Clique em "Deploy"

#### 3.2. Criar a função `mp-webhook`

1. Novamente, clique em "Create a new function"
2. Nome: `mp-webhook`
3. Cole o código de `functions/mp-webhook/index.ts`
4. Clique em "Deploy"

### 5. Configurar Secrets (Variáveis de Ambiente)

1. Vá em **Settings** → **Edge Functions** → **Secrets**
2. Clique em "Add a new secret"
3. Adicione:

   **Nome:** `MP_ACCESS_TOKEN_MARKETPLACE`
   
   **Valor:** Seu Access Token do Mercado Pago Marketplace
   
   - Encontre em: [Mercado Pago Dashboard](https://www.mercadopago.com.br/developers/panel/app)
   - Selecione sua aplicação
   - Copie o **Access Token** (começa com `APP_USR-...` para produção)

4. Clique em "Save"

### 6. Criar um Bar (Primeiro Registro)

**Alternativa:** Use a página `/cadastro` após fazer login (se executou `add_bars_insert_policy.sql`)

1. Vá em **Table Editor** no menu lateral
2. Selecione a tabela `bars`
3. Clique em "Insert row"
4. Preencha:

   ```json
   {
     "name": "Meu Bar",
     "mp_user_id": "000117434618860",
     "commission_rate": 0.05,
     "is_active": true
   }
   ```

   **Importante:**
   - `mp_user_id`: ID do usuário no Mercado Pago (para split automático)
   - `commission_rate`: Taxa de comissão (0.05 = 5%)

5. Clique em "Save"

### 7. Associar Itens do Menu ao Bar

1. Ainda no **Table Editor**, vá para a tabela `menu_items`
2. Execute uma query SQL (use o SQL Editor):

   ```sql
   -- Atualizar todos os itens sem bar_id para o primeiro bar
   UPDATE menu_items
   SET bar_id = (SELECT id FROM bars LIMIT 1)
   WHERE bar_id IS NULL;
   ```

3. Ou manualmente: Edite cada item e selecione o `bar_id` correto

### 8. Configurar URLs de Webhook (Mercado Pago)

1. No **Mercado Pago Dashboard**, vá em sua aplicação
2. Configure a URL de webhook:

   ```
   https://seu-projeto.supabase.co/functions/v1/mp-webhook
   ```

   Substitua `seu-projeto` pelo ID do seu projeto Supabase.

3. Encontre a URL do projeto em: **Settings** → **API** → **Project URL**

### 9. Verificar Configuração

Execute o script `check-schema.sql` no SQL Editor para verificar:

- ✅ Todas as tabelas foram criadas
- ✅ Todas as políticas RLS estão ativas
- ✅ Todos os índices foram criados
- ✅ Todas as funções existem

## 🔍 Encontrar Credenciais

### URL do Projeto

1. **Settings** → **API**
2. Copie **Project URL**: `https://xxxxx.supabase.co`

### Anon Key (para o frontend)

1. **Settings** → **API**
2. Copie **anon public** key (começa com `eyJhbGci...`)

### Service Role Key (não usar no frontend!)

1. **Settings** → **API**
2. Copie **service_role** key (mantenha secreta!)

## 📝 Checklist de Configuração

- [ ] Scripts SQL executados (01-05)
- [ ] `add_bars_insert_policy.sql` executado (se quiser usar `/cadastro`)
- [ ] Buckets criados (`menu-images`, `background-images`)
- [ ] Edge Functions deployadas (`create-payment`, `mp-webhook`)
- [ ] Secret `MP_ACCESS_TOKEN_MARKETPLACE` configurado
- [ ] Tabela `bars` tem pelo menos um registro (ou use `/cadastro`)
- [ ] Itens em `menu_items` têm `bar_id` associado
- [ ] Webhook do Mercado Pago configurado
- [ ] Variáveis de ambiente no frontend (`.env`)

## 🐛 Troubleshooting

### Erro: "relation does not exist"
- **Causa:** Scripts SQL não foram executados
- **Solução:** Execute os scripts na ordem (01 → 05)

### Erro: "Bucket not found"
- **Causa:** Buckets não foram criados
- **Solução:** Execute `04_storage.sql` novamente

### Erro: "Credenciais não configuradas"
- **Causa:** Secret `MP_ACCESS_TOKEN_MARKETPLACE` não foi configurado
- **Solução:** Adicione o secret em Settings → Edge Functions → Secrets

### Erro: "Function not found"
- **Causa:** Edge Functions não foram deployadas
- **Solução:** Deploy as funções em Edge Functions

### Erro: "Bar not found"
- **Causa:** Nenhum registro na tabela `bars`
- **Solução:** Crie um registro na tabela `bars`

## 📚 Recursos Adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)


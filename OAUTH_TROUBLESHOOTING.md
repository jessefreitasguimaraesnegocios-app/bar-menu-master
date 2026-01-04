# 🔧 Troubleshooting - Erro 401 no OAuth do Mercado Pago

## ❌ Erro: `{"code": 401, "message": "Missing authorization header"}`

Este erro ocorre quando a Edge Function `mp-oauth-callback` não consegue processar o callback do Mercado Pago.

**⚠️ IMPORTANTE:** Se você ver este erro **antes mesmo** de ver logs da função (como "🚀 Edge Function mp-oauth-callback invocada"), significa que o Supabase está bloqueando a requisição antes de chegar ao seu código. Isso geralmente indica:

1. **A Edge Function não foi deployada** - Faça o deploy novamente
2. **Os secrets não estão configurados** - Configure todos os secrets necessários
3. **A Edge Function precisa ser recriada** - Tente fazer um redeploy completo

## 🔍 Causas Possíveis

### 1. Secrets não configurados no Supabase

A Edge Function precisa dos seguintes secrets configurados:

```bash
# Obrigatórios
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
MP_CLIENT_ID=seu-client-id
MP_CLIENT_SECRET=seu-client-secret

# Opcionais
MP_REDIRECT_URI=https://seu-projeto.supabase.co/functions/v1/mp-oauth-callback
FRONTEND_URL=https://seu-site.com
```

### 2. Verificar Secrets Configurados

**Via Dashboard:**
1. Acesse: Supabase Dashboard > Edge Functions > Secrets
2. Verifique se todos os secrets acima estão configurados
3. Certifique-se de que não há espaços extras ou caracteres inválidos

**Via CLI:**
```bash
# Listar todos os secrets
supabase secrets list

# Verificar um secret específico (não mostra o valor, apenas confirma se existe)
supabase secrets list | grep MP_CLIENT_ID
```

### 3. Deploy da Edge Function

Após configurar os secrets, é necessário fazer o deploy novamente:

```bash
supabase functions deploy mp-oauth-callback
```

**⚠️ IMPORTANTE:** Edge Functions só têm acesso aos secrets após o deploy!

### 4. Verificar Logs da Edge Function

Para ver os logs em tempo real:

```bash
supabase functions logs mp-oauth-callback --follow
```

Ou via Dashboard:
- Supabase Dashboard > Edge Functions > mp-oauth-callback > Logs

**Diagnóstico do Erro 401:**

1. **Se você NÃO vê logs** (como "🚀 Edge Function mp-oauth-callback invocada"):
   - A função não está sendo executada
   - O Supabase está bloqueando a requisição antes de chegar ao código
   - **Solução:** Verifique se a função foi deployada e se está ativa no dashboard

2. **Se você VÊ logs mas ainda recebe 401**:
   - Os secrets podem não estar disponíveis
   - **Solução:** Verifique os logs para mensagens de erro específicas sobre secrets faltando

3. **Verificar se a função está deployada:**
   ```bash
   supabase functions list
   ```
   Você deve ver `mp-oauth-callback` na lista

4. **Fazer redeploy completo:**
   ```bash
   # Remover a função (se necessário)
   supabase functions delete mp-oauth-callback
   
   # Fazer deploy novamente
   supabase functions deploy mp-oauth-callback
   ```

## ✅ Checklist de Verificação

- [ ] `SUPABASE_URL` está configurado como secret
- [ ] `SUPABASE_SERVICE_ROLE_KEY` está configurado como secret
- [ ] `MP_CLIENT_ID` está configurado como secret
- [ ] `MP_CLIENT_SECRET` está configurado como secret
- [ ] `MP_REDIRECT_URI` está configurado corretamente (ou será gerado automaticamente)
- [ ] Edge Function foi deployada **APÓS** configurar os secrets
- [ ] `MP_REDIRECT_URI` no Mercado Pago Dashboard corresponde à URL da Edge Function

## 🔄 Fluxo Correto do OAuth

1. **Admin clica em "Conectar Mercado Pago"** no Admin Portal
2. **Frontend redireciona** para Mercado Pago com:
   - `client_id`: do secret `MP_CLIENT_ID`
   - `redirect_uri`: URL da Edge Function `mp-oauth-callback`
   - `state`: ID do bar (para identificar qual bar está conectando)
3. **Usuário autoriza** no Mercado Pago
4. **Mercado Pago redireciona** para a Edge Function com:
   - `code`: código de autorização
   - `state`: ID do bar
5. **Edge Function troca o código** por tokens usando:
   - `MP_CLIENT_ID`
   - `MP_CLIENT_SECRET`
   - `code` recebido
   - `redirect_uri` (deve ser exatamente o mesmo usado no passo 2)
6. **Edge Function salva** no banco:
   - `mp_user_id`: ID do usuário no Mercado Pago
   - `mp_access_token`: Token OAuth do bar (NUNCA exposto ao frontend)
   - `mp_refresh_token`: Token para renovar o access token
   - `mp_oauth_connected_at`: Data/hora da conexão
7. **Edge Function redireciona** para o frontend com status de sucesso/erro

## 🚨 Erros Comuns e Soluções

### Erro: "Configuração OAuth não encontrada"
- **Causa:** `MP_CLIENT_ID` ou `MP_CLIENT_SECRET` não configurados
- **Solução:** Configure os secrets e faça deploy novamente

### Erro: "Variáveis de ambiente do Supabase não configuradas"
- **Causa:** `SUPABASE_URL` ou `SUPABASE_SERVICE_ROLE_KEY` não configurados
- **Solução:** Configure os secrets e faça deploy novamente

### Erro: "Erro ao obter tokens do Mercado Pago"
- **Causa:** Credenciais OAuth inválidas ou `redirect_uri` não corresponde
- **Solução:** 
  1. Verifique se `MP_CLIENT_ID` e `MP_CLIENT_SECRET` estão corretos
  2. Verifique se `MP_REDIRECT_URI` no Supabase corresponde ao configurado no Mercado Pago Dashboard
  3. Verifique se a URL de redirecionamento está configurada no Mercado Pago Dashboard

### Erro: "Erro ao salvar tokens no banco de dados"
- **Causa:** `SUPABASE_SERVICE_ROLE_KEY` inválida ou sem permissões
- **Solução:** 
  1. Verifique se a service role key está correta
  2. Verifique se a tabela `bars` existe e tem as colunas necessárias
  3. Verifique os logs da Edge Function para mais detalhes

### Erro 401: "Missing authorization header" (sem logs da função)
- **Causa:** A requisição está sendo bloqueada antes de chegar ao código da função
- **Solução:**
  1. Verifique se a função está deployada: `supabase functions list`
  2. Verifique se os secrets estão configurados: `supabase secrets list`
  3. Faça um redeploy completo da função:
     ```bash
     supabase functions deploy mp-oauth-callback --no-verify-jwt
     ```
  4. Verifique no Dashboard do Supabase se a função aparece como "Active"
  5. Tente acessar a função diretamente via browser (deve retornar um redirect, não 401)

## 📝 Como Configurar os Secrets

### Via Dashboard (Recomendado)

1. Acesse: **Supabase Dashboard > Edge Functions > Secrets**
2. Clique em **"Add secret"**
3. Adicione cada variável:
   - Nome: `SUPABASE_URL`
   - Valor: `https://seu-projeto.supabase.co`
   - Repita para cada secret necessário

### Via CLI

```bash
# Login no Supabase
supabase login

# Link do projeto
supabase link --project-ref seu-project-ref

# Configurar secrets
supabase secrets set SUPABASE_URL=https://seu-projeto.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
supabase secrets set MP_CLIENT_ID=seu-client-id
supabase secrets set MP_CLIENT_SECRET=seu-client-secret
supabase secrets set MP_REDIRECT_URI=https://seu-projeto.supabase.co/functions/v1/mp-oauth-callback
supabase secrets set FRONTEND_URL=https://seu-site.com

# Fazer deploy após configurar
supabase functions deploy mp-oauth-callback
```

## 🔐 Onde Obter as Credenciais

### Supabase
- **SUPABASE_URL**: Dashboard > Settings > API > Project URL
- **SUPABASE_SERVICE_ROLE_KEY**: Dashboard > Settings > API > Project API keys > `service_role` `secret`

### Mercado Pago
- **MP_CLIENT_ID**: Dashboard > Aplicações > Sua App > Credenciais
- **MP_CLIENT_SECRET**: Dashboard > Aplicações > Sua App > Credenciais
- **MP_REDIRECT_URI**: Configure no Mercado Pago Dashboard > Aplicações > Sua App > URLs de redirecionamento
  - Valor: `https://seu-projeto.supabase.co/functions/v1/mp-oauth-callback`

## 🧪 Testar o OAuth

1. Acesse o Admin Portal
2. Edite um bar
3. Clique em "Conectar Mercado Pago"
4. Autorize no Mercado Pago
5. Verifique se foi redirecionado para `/admin?oauth=success`
6. Verifique se o bar mostra "OAuth Conectado" no Admin Portal
7. Verifique os logs da Edge Function para confirmar que tudo funcionou

## 📊 Verificar se Funcionou

Após conectar com sucesso, verifique no banco de dados:

```sql
SELECT id, name, mp_user_id, mp_oauth_connected_at 
FROM bars 
WHERE mp_access_token IS NOT NULL;
```

Você deve ver:
- `mp_user_id`: ID numérico do Mercado Pago
- `mp_oauth_connected_at`: Data/hora da conexão

---

**Última atualização:** Dezembro 2024


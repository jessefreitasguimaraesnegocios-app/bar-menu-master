# 🔍 Verificar Variáveis de Ambiente

## ⚠️ Problema

As variáveis estão configuradas no Supabase, mas a função ainda não consegue acessá-las.

## 🔍 Possíveis Causas

### 1. Variáveis como "Secrets" vs "Environment Variables"

No Supabase há duas formas de configurar variáveis:

**A) Secrets (Global)**
- Dashboard → Edge Functions → Secrets
- São globais para todas as funções
- ✅ Você já configurou aqui

**B) Environment Variables (por função)**
- Dashboard → Edge Functions → [nome-da-função] → Settings → Environment Variables
- São específicas para cada função
- ⚠️ Pode ser necessário configurar aqui também

### 2. Verificar se as Variáveis Estão Disponíveis

1. Acesse: https://supabase.com/dashboard/project/xzrqorkqrzkhxzfbbfjf/functions/mp-oauth-callback
2. Clique em **"Settings"**
3. Verifique se há uma seção **"Environment Variables"**
4. Se não houver, as variáveis devem estar sendo lidas dos **Secrets** (global)

### 3. Verificar os Logs

Após tentar conectar novamente:

1. Acesse: https://supabase.com/dashboard/project/xzrqorkqrzkhxzfbbfjf/functions/mp-oauth-callback
2. Clique na aba **"Logs"**
3. Procure por: `🔍 Verificando variáveis de ambiente:`
4. Isso mostrará quais variáveis estão presentes

## ✅ Solução

### Opção 1: Verificar se Secrets estão sendo lidos

Os Secrets devem estar disponíveis automaticamente. Se não estiverem:

1. Verifique se os Secrets estão configurados corretamente:
   - `MP_CLIENT_ID` ✅ (você já tem)
   - `MP_CLIENT_SECRET` ✅ (você já tem)
   - `SUPABASE_URL` ✅ (você já tem)
   - `SUPABASE_SERVICE_ROLE_KEY` ✅ (você já tem)
   - `FRONTEND_URL` ✅ (você já tem)

2. Faça o redeploy novamente (já feito):
   ```bash
   npx supabase@latest functions deploy mp-oauth-callback --no-verify-jwt
   ```

### Opção 2: Adicionar como Environment Variables da Função

Se os Secrets não estiverem funcionando:

1. Acesse: https://supabase.com/dashboard/project/xzrqorkqrzkhxzfbbfjf/functions/mp-oauth-callback/settings
2. Na seção **"Environment Variables"**, adicione as mesmas variáveis
3. Faça redeploy novamente

## 🧪 Testar Agora

1. Tente conectar o bar ao Mercado Pago novamente
2. Se ainda der erro, verifique os logs no Dashboard
3. Os logs agora mostrarão exatamente quais variáveis estão faltando

## 📋 Checklist

- [ ] Secrets configurados no Dashboard ✅ (já feito)
- [ ] Função redeployada ✅ (já feito)
- [ ] Logs verificados (após tentar conectar)
- [ ] Variáveis aparecem nos logs como `hasMP_CLIENT_ID: true`



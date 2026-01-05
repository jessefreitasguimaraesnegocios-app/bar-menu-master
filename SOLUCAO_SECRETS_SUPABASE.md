# 🔧 Solução: Secrets não Acessíveis nas Edge Functions

## ❌ Problema

Os Secrets estão configurados no Dashboard, mas a função não consegue acessá-los via `Deno.env.get()`.

## ✅ Soluções Possíveis

### Solução 1: Verificar se Secrets Estão Vinculados à Função

No Supabase, os Secrets podem precisar ser explicitamente vinculados à função:

1. Acesse: https://supabase.com/dashboard/project/xzrqorkqrzkhxzfbbfjf/functions/mp-oauth-callback
2. Clique em **"Settings"** ou **"Details"**
3. Procure por uma seção **"Secrets"** ou **"Environment Variables"**
4. Se houver, verifique se os Secrets estão listados e vinculados

### Solução 2: Usar Supabase CLI para Configurar

Às vezes, configurar via CLI funciona melhor:

```bash
# Configurar cada Secret
npx supabase@latest secrets set MP_CLIENT_ID="seu-client-id"
npx supabase@latest secrets set MP_CLIENT_SECRET="seu-client-secret"
npx supabase@latest secrets set SUPABASE_URL="https://xzrqorkqrzkhxzfbbfjf.supabase.co"
npx supabase@latest secrets set SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"
npx supabase@latest secrets set FRONTEND_URL="http://localhost:8080"

# Redeploy da função
npx supabase@latest functions deploy mp-oauth-callback --no-verify-jwt
```

### Solução 3: Verificar se Há Problema de Sincronização

1. Delete e recrie os Secrets problemáticos:
   - Delete `MP_CLIENT_ID`
   - Recrie com o mesmo valor
   - Repita para `MP_CLIENT_SECRET` se necessário
2. Faça redeploy da função

### Solução 4: Verificar os Logs Detalhados

Após tentar conectar, verifique os logs:

1. Acesse: https://supabase.com/dashboard/project/xzrqorkqrzkhxzfbbfjf/functions/mp-oauth-callback/logs
2. Procure por: `🔍 Verificando variáveis de ambiente:`
3. Verifique o campo `availableEnvKeys` - isso mostrará quais variáveis estão disponíveis
4. Se `availableEnvKeys` estiver vazio, os Secrets não estão sendo expostos

## 🔍 Debug

Os logs agora mostram:
- `availableEnvKeys`: Lista de variáveis disponíveis
- `totalAvailable`: Quantidade de variáveis disponíveis
- Todas as variáveis de ambiente (filtradas) se `Deno.env.toObject()` estiver disponível

## ⚠️ Importante

Se nenhuma das soluções funcionar, pode ser um bug do Supabase. Nesse caso:
1. Tente usar a API do Supabase para buscar os Secrets (mais complexo)
2. Entre em contato com o suporte do Supabase
3. Considere usar variáveis hardcoded temporariamente (não recomendado para produção)

## 📋 Próximos Passos

1. ✅ Tente conectar o bar novamente
2. ✅ Verifique os logs para ver `availableEnvKeys`
3. ✅ Se estiver vazio, tente a Solução 2 (CLI)
4. ✅ Se ainda não funcionar, tente a Solução 3 (recriar Secrets)



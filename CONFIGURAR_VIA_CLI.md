# 🔧 Configurar Secrets via CLI

## Por que usar CLI?

Às vezes, configurar Secrets via CLI funciona melhor do que pelo Dashboard, especialmente se há problemas de sincronização.

## ⚠️ IMPORTANTE: Você precisa dos valores

Antes de executar, você precisa ter os valores dos Secrets. Se não tiver, pegue do Dashboard:
1. Acesse: https://supabase.com/dashboard/project/xzrqorkqrzkhxzfbbfjf/functions/secrets
2. Clique nos três pontos (⋯) ao lado de cada Secret
3. Copie o valor (ou veja se está preenchido)

## 📝 Comandos

Execute estes comandos no terminal (substitua os valores):

```bash
# 1. Login no Supabase (se ainda não estiver logado)
npx supabase@latest login

# 2. Configurar cada Secret
npx supabase@latest secrets set MP_CLIENT_ID="SEU_CLIENT_ID_AQUI"
npx supabase@latest secrets set MP_CLIENT_SECRET="SEU_CLIENT_SECRET_AQUI"
npx supabase@latest secrets set SUPABASE_URL="https://xzrqorkqrzkhxzfbbfjf.supabase.co"
npx supabase@latest secrets set SUPABASE_SERVICE_ROLE_KEY="SUA_SERVICE_ROLE_KEY_AQUI"
npx supabase@latest secrets set FRONTEND_URL="http://localhost:8080"
npx supabase@latest secrets set MP_REDIRECT_URI="https://xzrqorkqrzkhxzfbbfjf.supabase.co/functions/v1/mp-oauth-callback"

# 3. Redeploy da função
npx supabase@latest functions deploy mp-oauth-callback --no-verify-jwt
```

## ✅ Após Executar

1. Tente conectar o bar ao Mercado Pago novamente
2. Verifique os logs para ver se `availableEnvKeys` agora mostra as variáveis

## 🔍 Se Não Funcionar

Se ainda não funcionar após configurar via CLI, pode ser necessário:
1. Verificar se há uma forma de vincular Secrets à função específica
2. Usar uma abordagem alternativa (API do Supabase)
3. Contatar suporte do Supabase



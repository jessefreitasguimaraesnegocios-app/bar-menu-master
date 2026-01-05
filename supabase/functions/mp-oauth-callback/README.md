# Mercado Pago OAuth Callback

Edge Function pública para processar o callback OAuth do Mercado Pago.

## ⚠️ IMPORTANTE: Deploy Sem JWT

Esta função **DEVE** ser deployada **SEM** verificação de JWT porque o redirect do Mercado Pago não envia `Authorization` header.

### Deploy Obrigatório (Use NPX - Recomendado)

**Método Recomendado - NPX (sem instalar nada):**

```bash
# 1. Login (abre o navegador)
npx supabase@latest login

# 2. Deploy sem JWT
npx supabase@latest functions deploy mp-oauth-callback --no-verify-jwt
```

**Sem o flag `--no-verify-jwt`, a função sempre retornará 401.**

💡 **NPX é a forma mais simples e funciona no Windows sem precisar instalar nada!**

## Arquitetura

```
mp-oauth-callback/
├── index.ts          # Handler principal (público, sem JWT)
├── oauthService.ts   # Orquestração do fluxo OAuth
├── mpClient.ts       # Cliente para API do Mercado Pago
├── barRepository.ts  # Persistência no Supabase
├── config.ts         # Configuração e env vars
└── types.ts          # TypeScript types
```

## Fluxo

1. **Mercado Pago** redireciona para esta função com `code` e `state`
2. **OAuthService** valida parâmetros e bar
3. **MercadoPagoClient** troca `code` por `access_token`
4. **BarRepository** salva tokens no banco
5. Redireciona para frontend com status

## Secrets Necessários

Configure no Supabase Dashboard ou via CLI:

```bash
supabase secrets set MP_CLIENT_ID=seu_client_id
supabase secrets set MP_CLIENT_SECRET=seu_client_secret
supabase secrets set MP_REDIRECT_URI=https://seu-projeto.supabase.co/functions/v1/mp-oauth-callback
supabase secrets set FRONTEND_URL=https://seu-frontend.com
supabase secrets set SUPABASE_URL=https://seu-projeto.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

## Validações

- ✅ Code OAuth válido
- ✅ State (bar_id) presente
- ✅ Bar existe no banco
- ✅ Tokens recebidos do MP
- ✅ Tokens salvos com sucesso

## Tratamento de Erros

Todos os erros são capturados e redirecionados para o frontend com mensagem clara:

```
/admin?oauth=error&message=...
```

Sucesso:

```
/admin?oauth=success&bar_id=...
```


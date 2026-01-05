# 🔍 Debug: Erro 401 no OAuth Callback

## 📊 Análise do Log

Do log que você compartilhou, vejo:
- ✅ A função foi **executada** (execution_time_ms: 1811)
- ✅ O **code** foi recebido: `TG-6954952d6cfe6d0001cee3af-200800906`
- ✅ O **state** (bar_id) foi recebido: `c05a3c7f-06f7-437e-9faa-02143b31e6cf`
- ❌ Status da resposta: **401**
- ❌ Content-Type: **application/json**
- ❌ Content-Length: **73 bytes**

## 🎯 O Que Isso Significa

O 401 está sendo retornado, mas **precisamos ver os logs detalhados** da execução para saber exatamente onde está o problema.

## 📋 Como Ver os Logs Detalhados

### Opção 1: Via Dashboard (Recomendado)

1. **No Dashboard do Supabase**, clique no ID da invocação:
   - `c09f938a-e11e-429c-8edd-246af5899178`
   - Ou: `ded24d47-ee0c-4de7-be29-546e4920a263`

2. **Procure pela aba "Logs" ou "Details"** dentro da invocação

3. **Procure por estas mensagens:**
   ```
   🚀 Edge Function mp-oauth-callback invocada
   🔐 Parâmetros recebidos: { hasCode: true, ... }
   🔐 Verificando credenciais OAuth: ...
   🔄 Trocando código OAuth por tokens...
   ❌ ERRO 401 - Credenciais OAuth inválidas
   ```

### Opção 2: Via CLI

```bash
# Ver logs das últimas execuções
supabase functions logs mp-oauth-callback --limit 10

# Ver logs em tempo real (faça um novo teste)
supabase functions logs mp-oauth-callback --follow
```

## 🔍 Possíveis Causas do 401

Com base no código, o 401 pode estar vindo de:

### 1. ❌ Mercado Pago Rejeitou as Credenciais OAuth

Quando a função tenta trocar o `code` por tokens:
```typescript
POST https://api.mercadopago.com/oauth/token
```

**Possíveis problemas:**
- `MP_CLIENT_ID` incorreto nos secrets
- `MP_CLIENT_SECRET` incorreto nos secrets
- `redirect_uri` não corresponde ao configurado no MP Dashboard
- Code expirado (improvável, já que foi gerado recentemente)
- Code já foi usado anteriormente

### 2. ❌ Secrets Não Estão Disponíveis

Se os secrets não estiverem configurados ou acessíveis:
- `MP_CLIENT_ID`
- `MP_CLIENT_SECRET`
- `MP_REDIRECT_URI`

## ✅ Checklist de Verificação

Antes de testar novamente, verifique:

### Secrets no Supabase
```bash
supabase secrets list
```

Deve ter:
- [ ] `MP_CLIENT_ID` - deve ser o Client ID da sua aplicação no Mercado Pago
- [ ] `MP_CLIENT_SECRET` - deve ser o Client Secret da sua aplicação
- [ ] `MP_REDIRECT_URI` - deve ser EXATAMENTE: `https://xzrqorkqrzkhxzfbbfjf.supabase.co/functions/v1/mp-oauth-callback`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

### Mercado Pago Dashboard

1. **Acesse:** [Mercado Pago Dashboard > Aplicações > Sua App](https://www.mercadopago.com.br/developers/panel/app)

2. **Verifique Credenciais:**
   - Client ID deve ser igual ao `MP_CLIENT_ID` nos secrets
   - Client Secret deve ser igual ao `MP_CLIENT_SECRET` nos secrets

3. **Verifique URLs de Redirecionamento:**
   - Deve ter EXATAMENTE: `https://xzrqorkqrzkhxzfbbfjf.supabase.co/functions/v1/mp-oauth-callback`
   - ⚠️ Deve ser IDÊNTICO ao `MP_REDIRECT_URI` nos secrets
   - Não pode ter espaços extras ou diferenças de maiúsculas/minúsculas

## 🧪 Próximos Passos

1. **Faça o deploy da função atualizada:**
   ```bash
   supabase functions deploy mp-oauth-callback
   ```

2. **Monitore os logs em tempo real:**
   ```bash
   supabase functions logs mp-oauth-callback --follow
   ```

3. **Teste o fluxo novamente:**
   - Acesse o Admin Portal
   - Edite um bar
   - Clique em "Conectar Mercado Pago"
   - Complete o fluxo OAuth
   - Observe os logs em tempo real

4. **Compartilhe os logs detalhados:**
   - Se possível, compartilhe os `console.log` completos da execução
   - Especialmente as mensagens que começam com 🔐, 🔄, ❌

## 📝 O Que Esperar nos Logs

Se estiver funcionando:
```
🚀 Edge Function mp-oauth-callback invocada
🔐 Parâmetros recebidos: { hasCode: true, hasState: true, ... }
🔐 Verificando credenciais OAuth: { hasClientId: true, hasClientSecret: true, ... }
🔄 Trocando código OAuth por tokens...
✅ Tokens recebidos do Mercado Pago: { hasAccessToken: true, userId: ... }
💾 Salvando tokens no banco...
✅ OAuth conectado com sucesso
```

Se houver erro:
```
🚀 Edge Function mp-oauth-callback invocada
🔐 Parâmetros recebidos: { hasCode: true, ... }
🔐 Verificando credenciais OAuth: ...
🔄 Trocando código OAuth por tokens...
❌ ERRO 401 - Credenciais OAuth inválidas do Mercado Pago
❌ Resposta do Mercado Pago: { "message": "...", ... }
```

## 🎯 Ação Imediata

**Compartilhe os logs detalhados** da invocação `c09f938a-e11e-429c-8edd-246af5899178` para que eu possa identificar exatamente onde está o problema!








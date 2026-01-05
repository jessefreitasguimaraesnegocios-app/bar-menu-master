# 🚀 Deploy da Função OAuth - Correção do Erro 401

## ⚠️ Problema Atual

Você está recebendo o erro:
```json
{"code":401,"message":"Missing authorization header"}
```

Isso acontece porque a função Edge Function `mp-oauth-callback` ainda está exigindo JWT, mas o Mercado Pago não envia header de autorização no redirect OAuth.

## ✅ SOLUÇÃO: Deploy via CLI (OBRIGATÓRIO)

O arquivo `supabase.functions.config.json` **NÃO é lido** quando você faz deploy pelo dashboard do Supabase. Você **DEVE** usar o Supabase CLI com o flag `--no-verify-jwt`.

### 📋 Passos para Corrigir

**1. Abra o PowerShell (terminal do Windows)**

**2. Navegue até a pasta do projeto:**
```powershell
cd C:\Users\jesse\Desktop\Cardapio
```

**3. Faça login no Supabase (isso vai abrir o navegador):**
```powershell
npx supabase@latest login
```
- Isso vai abrir seu navegador
- Faça login na sua conta do Supabase
- Volte ao terminal (deve aparecer "Logged in as ...")

**4. Faça o deploy da função SEM JWT (OBRIGATÓRIO):**
```powershell
npx supabase@latest functions deploy mp-oauth-callback --no-verify-jwt
```

⚠️ **IMPORTANTE:** O flag `--no-verify-jwt` é **OBRIGATÓRIO**! Sem ele, a função continuará retornando 401.

**5. Verifique se funcionou:**

Após o deploy, teste acessando a URL diretamente no navegador:
```
https://xzrqorkqrzkhxzfbbfjf.supabase.co/functions/v1/mp-oauth-callback?code=test&state=test
```

Se retornar um erro de validação (não 401), significa que a função está pública e funcionando! ✅

---

## 🔍 Se Ainda Der Erro 401

Se mesmo após o deploy ainda der erro 401:

1. **Verifique se o deploy foi bem-sucedido:**
   - O comando deve mostrar "Deployed Function mp-oauth-callback"
   - Não deve mostrar erros

2. **Verifique se você usou o flag `--no-verify-jwt`:**
   - O comando deve ser: `npx supabase@latest functions deploy mp-oauth-callback --no-verify-jwt`
   - Sem o flag `--no-verify-jwt`, a função continuará exigindo JWT

3. **Espere alguns segundos:**
   - O deploy pode levar alguns segundos para propagar
   - Tente novamente após 10-15 segundos

4. **Verifique no dashboard do Supabase:**
   - Dashboard → Edge Functions → `mp-oauth-callback`
   - Verifique se a função está listada e se foi atualizada recentemente

---

## 📝 Notas Importantes

- A função **DEVE** ser pública (sem JWT) porque o Mercado Pago não envia Authorization header
- A segurança é garantida pela validação do `state` (bar_id) e do `code` OAuth
- Apenas bares válidos podem conectar suas contas
- Depois de fazer o deploy via CLI com `--no-verify-jwt`, a função ficará pública permanentemente
- Você não precisará fazer isso novamente, a menos que delete e recrie a função

---

## 🆘 Precisa de Ajuda?

Se ainda tiver problemas:
1. Verifique os logs no dashboard: Edge Functions → `mp-oauth-callback` → Logs
2. Verifique se você está usando as credenciais corretas (Client ID e Secret de PRODUÇÃO)
3. Verifique se o `redirect_uri` está configurado corretamente no Mercado Pago Dashboard




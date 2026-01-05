# 🚨 SOLUÇÃO DEFINITIVA: Erro 401 OAuth Mercado Pago

## ⚠️ Problema Atual

Você está recebendo:
```json
{"code":401,"message":"Missing authorization header"}
```

A função `mp-oauth-callback` está exigindo JWT, mas o Mercado Pago **não envia** header de autorização.

---

## ✅ SOLUÇÃO 1: Deploy via CLI (RECOMENDADO - MAIS RÁPIDO)

### 📋 Passo a Passo Detalhado

**1. Abra o PowerShell no VS Code**
   - Clique no terminal na parte inferior
   - Ou pressione `` Ctrl + ` ``

**2. Navegue até a pasta do projeto (se ainda não estiver):**
```powershell
cd C:\Users\jesse\Desktop\Cardapio
```

**3. Faça login no Supabase:**
```powershell
npx supabase@latest login
```

O que vai acontecer:
- ✅ Abre o navegador automaticamente
- ✅ Você faz login na sua conta do Supabase
- ✅ Volta ao terminal e mostra "Logged in as [seu email]"

**4. Faça o deploy SEM JWT (ESTE É O COMANDO CRÍTICO):**
```powershell
npx supabase@latest functions deploy mp-oauth-callback --no-verify-jwt
```

⚠️ **ATENÇÃO:** O flag `--no-verify-jwt` é **OBRIGATÓRIO**! Copie e cole o comando completo.

O que vai acontecer:
- ✅ Faz o upload da função
- ✅ Configura para **NÃO exigir JWT**
- ✅ Mostra "Deployed Function mp-oauth-callback"

**5. Aguarde 5-10 segundos** para o deploy propagar

**6. Teste novamente no navegador:**
```
https://xzrqorkqrzkhxzfbbfjf.supabase.co/functions/v1/mp-oauth-callback?code=test&state=test
```

✅ **Sucesso:** Se aparecer um erro de validação (não 401), está funcionando!
❌ **Ainda 401:** Veja "Se ainda não funcionar" abaixo

---

## ✅ SOLUÇÃO 2: Usar config.toml (Alternativa)

Se a Solução 1 não funcionar, tente esta:

**1. Crie o arquivo `supabase/config.toml`:**
```toml
[functions.mp-oauth-callback]
verify_jwt = false
```

**2. Faça o deploy:**
```powershell
npx supabase@latest functions deploy mp-oauth-callback
```

**Nota:** Esta abordagem pode não funcionar se você não tem o projeto inicializado localmente com Supabase CLI.

---

## 🔍 Se Ainda Não Funcionar

### Verificações:

**1. Verifique se você está logado:**
```powershell
npx supabase@latest projects list
```
Se pedir login novamente, faça o login primeiro.

**2. Verifique se o deploy foi bem-sucedido:**
- O comando deve mostrar: `✅ Deployed Function mp-oauth-callback`
- Se aparecer erro, copie e cole a mensagem de erro

**3. Verifique no Dashboard do Supabase:**
- Acesse: https://supabase.com/dashboard
- Vá em: Edge Functions → `mp-oauth-callback`
- Veja a data/hora da última atualização
- Verifique se há logs de erro

**4. Limpe o cache do navegador:**
- Pressione `Ctrl + Shift + R` para recarregar forçado
- Ou use uma aba anônima (Ctrl + Shift + N)

**5. Espere mais tempo:**
- Às vezes o deploy pode levar até 30 segundos para propagar
- Tente novamente após 30 segundos

---

## 📝 Comandos Úteis para Debug

**Ver versão do CLI:**
```powershell
npx supabase@latest --version
```

**Ver lista de projetos:**
```powershell
npx supabase@latest projects list
```

**Ver logs da função:**
- Acesse: Dashboard → Edge Functions → `mp-oauth-callback` → Logs

---

## ⚡ Comando Rápido (Copiar e Colar)

Se você já está logado, execute apenas:

```powershell
npx supabase@latest functions deploy mp-oauth-callback --no-verify-jwt
```

---

## 🆘 Precisa de Ajuda?

Se nada funcionar:
1. Copie a mensagem de erro completa do terminal
2. Verifique os logs no Dashboard do Supabase
3. Verifique se as variáveis de ambiente estão configuradas corretamente

---

## 📚 Referências

- [Documentação Supabase - Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase CLI - Deploy Functions](https://supabase.com/docs/reference/cli/supabase-functions-deploy)




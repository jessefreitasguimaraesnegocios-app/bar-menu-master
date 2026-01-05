# Instruções de Deploy - mp-oauth-callback

## ⚠️ PROBLEMA: Erro 401 "Missing authorization header"

Este erro acontece porque a função está configurada para exigir JWT, mas o Mercado Pago não envia header de autorização no redirect OAuth.

## ✅ SOLUÇÃO: Deploy via NPX (RECOMENDADO - SEM INSTALAR NADA)

**IMPORTANTE:** O arquivo `supabase.functions.config.json` **NÃO é lido** quando você faz deploy pelo dashboard do Supabase. Você **DEVE** usar o Supabase CLI (via NPX) com o flag `--no-verify-jwt`.

### ⚡ Solução Rápida: Use NPX (Mais Simples!)

**1. Fazer Login:**
```powershell
npx supabase@latest login
```
Isso vai abrir o navegador para você fazer login.

**2. Deploy SEM JWT (OBRIGATÓRIO):**
```powershell
npx supabase@latest functions deploy mp-oauth-callback --no-verify-jwt
```

**O flag `--no-verify-jwt` é OBRIGATÓRIO!** Sem ele, a função sempre retornará 401.

💡 **NPX funciona no Windows sem precisar instalar nada!**

### 📋 Ver Instruções Detalhadas

Veja o arquivo `FIX_401_ERROR.md` para instruções completas passo a passo e alternativas.

### Opção 3: Configurar via SQL (Alternativa)

Se as opções acima não funcionarem, você pode criar uma política RLS que permite acesso público à função, mas isso é mais complexo.

## 🔍 Como Verificar se Está Funcionando

Após o deploy, teste acessando a URL diretamente:

```
https://seu-projeto.supabase.co/functions/v1/mp-oauth-callback?code=test&state=test
```

Se retornar um erro de validação (não 401), significa que a função está pública e funcionando.

## 📝 Nota Importante

- A função **DEVE** ser pública (sem JWT) porque o Mercado Pago não envia Authorization header
- A segurança é garantida pela validação do `state` (bar_id) e do `code` OAuth
- Apenas bares válidos podem conectar suas contas


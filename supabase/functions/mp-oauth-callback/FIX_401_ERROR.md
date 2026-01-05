# 🔧 Como Corrigir o Erro 401 - Passo a Passo

## ⚠️ Problema

O erro 401 pode acontecer em **DUAS situações diferentes**:

### 1. Erro 401 do Supabase (Função não configurada)
O erro 401 acontece porque o Supabase está exigindo JWT, mas o Mercado Pago não envia header de autorização no redirect OAuth.

### 2. Erro 401 do Mercado Pago (Troca de code por tokens)
O erro 401 acontece ao tentar trocar o `code` de autorização por `access_token`. Isso indica problema nas credenciais ou no `redirect_uri`.

---

## ✅ SOLUÇÃO 1: Erro 401 do Supabase (Função não pública)

### 👉 Use NPX (RECOMENDADO PELO SUPABASE)

💡 **Funciona no Windows, não precisa instalar CLI global e evita esses erros.**

### 🔧 Passo 1 — Login

No terminal (PowerShell ou terminal do VS Code):

```powershell
npx supabase@latest login
```

Isso vai:
- ✅ Abrir o navegador
- ✅ Você faz login
- ✅ Volta pro terminal autenticado

### 🔧 Passo 2 — Deploy da Edge Function (SEM JWT)

Dentro da pasta do projeto:

```powershell
npx supabase@latest functions deploy mp-oauth-callback --no-verify-jwt
```

**IMPORTANTE:** O flag `--no-verify-jwt` é **OBRIGATÓRIO**! Sem ele, a função continuará retornando 401.

### 🔧 Passo 3 — Verificar

Após o deploy, teste acessando:
```
https://xzrqorkqrzkhxzfbbfjf.supabase.co/functions/v1/mp-oauth-callback?code=test&state=test
```

Se retornar um erro de validação (não 401), está funcionando! ✅

---

## ✅ SOLUÇÃO 2: Erro 401 do Mercado Pago (Credenciais/Redirect URI)

Se você já passou pelo login do bar, CPF validado, QR Code aprovado, e o Mercado Pago gerou o `code`, mas ao tentar trocar o `code` por tokens recebe erro 401, o problema está em:

### 🚨 Motivos REAIS de erro 401 (ordem de probabilidade)

#### 🔴 1. Client ID ou Client Secret ERRADOS (mais comum)

⚠️ **Atenção máxima aqui:**

**OAuth só funciona com credenciais de PRODUÇÃO**

❌ **NÃO pode misturar:**
- Client ID de prod + Secret de sandbox
- Client ID de sandbox + Secret de prod

✅ **USE:**
- Client ID (produção)
- Client Secret (produção)

📍 **Onde pegar:**
Mercado Pago → Suas integrações → Credenciais

#### 🔴 2. redirect_uri diferente do usado na autorização

O `redirect_uri` enviado no `POST /oauth/token` **TEM que ser EXATAMENTE o mesmo usado no link inicial**.

Mesmo 1 caractere diferente = 401.

✅ **USE EXATAMENTE:**
```
https://xzrqorkqrzkhxzfbbfjf.supabase.co/functions/v1/mp-oauth-callback
```

❌ **SEM:**
- Barra no final (`/`)
- Query params
- Espaços
- `http` (tem que ser `https`)

#### 🔴 3. Header errado (Content-Type)

Essa requisição **NÃO é JSON**.

❌ **ERRADO:**
```
Content-Type: application/json
```

✅ **CORRETO:**
```
Content-Type: application/x-www-form-urlencoded
```

---

## 🔍 Debug: Verificar Variáveis de Ambiente

A função agora tem logs detalhados. Para ver os logs:

1. Acesse o Supabase Dashboard
2. Vá em: Edge Functions → `mp-oauth-callback` → Logs
3. Procure por: `📋 Parâmetros enviados:`

Os logs mostrarão:
- `code`: Os primeiros 20 caracteres do code
- `client_id`: Os primeiros 10 caracteres do Client ID
- `redirect_uri`: O redirect_uri usado
- `redirect_uri_length`: O tamanho do redirect_uri

### ✅ Se tudo está correto nos logs mas ainda dá 401:

1. **Verifique se as credenciais são de PRODUÇÃO** (não sandbox)
2. **Verifique se o `redirect_uri` é EXATAMENTE o mesmo** usado no link inicial de autorização
3. **Verifique se o `redirect_uri` está configurado no Dashboard do Mercado Pago**

---

## 📋 Configurar Variáveis de Ambiente no Supabase

1. Acesse: Supabase Dashboard → Project Settings → Edge Functions
2. Adicione/Verifique:

```env
MP_CLIENT_ID=seu-client-id-de-producao
MP_CLIENT_SECRET=seu-client-secret-de-producao
MP_REDIRECT_URI=https://xzrqorkqrzkhxzfbbfjf.supabase.co/functions/v1/mp-oauth-callback
SUPABASE_URL=https://xzrqorkqrzkhxzfbbfjf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=seu-service-role-key
FRONTEND_URL=https://seu-frontend.com
```

⚠️ **IMPORTANTE:**
- `MP_REDIRECT_URI` deve ser **exatamente** igual ao usado no frontend
- Se não configurar `MP_REDIRECT_URI`, será gerado automaticamente: `${SUPABASE_URL}/functions/v1/mp-oauth-callback`
- A função remove automaticamente barra final (`/`) do `redirect_uri`

---

## 📋 Alternativas (Se NPX não funcionar)

### Opção 1: Via Scoop (Instalação Permanente)

Se você quiser instalar o CLI permanentemente:

```powershell
# Instalar Scoop (se não tiver)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Instalar Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Depois fazer login e deploy
supabase login
supabase functions deploy mp-oauth-callback --no-verify-jwt
```

### Opção 2: Via Chocolatey (Se você tem Chocolatey)

```powershell
choco install supabase
supabase login
supabase functions deploy mp-oauth-callback --no-verify-jwt
```

### Opção 3: Download Manual

1. Acesse: https://github.com/supabase/cli/releases
2. Baixe o arquivo `supabase_windows_amd64.zip`
3. Extraia o arquivo `supabase.exe`
4. Adicione ao PATH ou coloque em uma pasta que já está no PATH

---

## 📝 Nota Importante

- O arquivo `supabase.functions.config.json` **NÃO é lido** quando você faz deploy pelo dashboard do Supabase
- Você **DEVE** usar o CLI (via npx ou instalado) com o flag `--no-verify-jwt`
- Depois de fazer o deploy via CLI com `--no-verify-jwt`, a função ficará pública permanentemente
- Você não precisará fazer isso novamente, a menos que delete e recrie a função
- A segurança é garantida pela validação do `state` (bar_id) e do `code` OAuth

---

## 🚨 Por que o Dashboard não funciona?

O dashboard do Supabase não tem opção para desativar JWT ao fazer deploy. Por isso, você **DEVE** usar o CLI com o flag `--no-verify-jwt`.

# 🔧 Configurar Variáveis de Ambiente - OAuth Mercado Pago

## ✅ Progresso Atual

✅ **Erro 401 resolvido!** A função `mp-oauth-callback` agora está pública e funcionando!

❌ **Faltam variáveis de ambiente** no Supabase Dashboard

---

## 📋 Variáveis Necessárias

A função precisa das seguintes variáveis de ambiente no Supabase:

### 🔴 Obrigatórias:

1. **`MP_CLIENT_ID`** - Client ID de PRODUÇÃO do Mercado Pago
2. **`MP_CLIENT_SECRET`** - Client Secret de PRODUÇÃO do Mercado Pago
3. **`SUPABASE_URL`** - URL do seu projeto Supabase
4. **`SUPABASE_SERVICE_ROLE_KEY`** - Service Role Key do Supabase

### 🟡 Opcionais (têm valores padrão):

5. **`MP_REDIRECT_URI`** - URL de callback (será gerado automaticamente se não configurado)
6. **`FRONTEND_URL`** - URL do frontend (padrão: `http://localhost:8080`)

---

## 🚀 Como Configurar no Supabase Dashboard

### Passo 1: Acesse o Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: **"Cantim-bar"** (xzrqorkqrzkhxzfbbfjf)

### Passo 2: Vá para Edge Functions → Settings

1. No menu lateral, clique em **"Edge Functions"**
2. Clique em **"Settings"** (ou "Configurações")

### Passo 3: Adicione as Variáveis de Ambiente

Na seção **"Environment Variables"**, adicione cada variável:

#### 1. MP_CLIENT_ID
```
Nome: MP_CLIENT_ID
Valor: [Seu Client ID de PRODUÇÃO do Mercado Pago]
```
📍 **Onde pegar:** Mercado Pago → Suas integrações → Credenciais → **PRODUÇÃO** → Client ID

#### 2. MP_CLIENT_SECRET
```
Nome: MP_CLIENT_SECRET
Valor: [Seu Client Secret de PRODUÇÃO do Mercado Pago]
```
📍 **Onde pegar:** Mercado Pago → Suas integrações → Credenciais → **PRODUÇÃO** → Client Secret

⚠️ **IMPORTANTE:** Use credenciais de **PRODUÇÃO**, não sandbox!

#### 3. SUPABASE_URL
```
Nome: SUPABASE_URL
Valor: https://xzrqorkqrzkhxzfbbfjf.supabase.co
```

#### 4. SUPABASE_SERVICE_ROLE_KEY
```
Nome: SUPABASE_SERVICE_ROLE_KEY
Valor: [Sua Service Role Key]
```
📍 **Onde pegar:** Dashboard → Project Settings → API → **service_role** key (a chave secreta!)

⚠️ **IMPORTANTE:** Não use a `anon` key! Use a `service_role` key!

#### 5. MP_REDIRECT_URI (Opcional)
```
Nome: MP_REDIRECT_URI
Valor: https://xzrqorkqrzkhxzfbbfjf.supabase.co/functions/v1/mp-oauth-callback
```

#### 6. FRONTEND_URL (Opcional)
```
Nome: FRONTEND_URL
Valor: http://localhost:8080
```
(Para produção, use sua URL real)

---

## 🔍 Como Encontrar as Credenciais do Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers
2. Faça login
3. Vá em: **"Suas integrações"**
4. Selecione sua aplicação
5. Vá em: **"Credenciais"**
6. Escolha: **"PRODUÇÃO"** (não sandbox!)
7. Copie:
   - **Client ID** → use como `MP_CLIENT_ID`
   - **Client Secret** → use como `MP_CLIENT_SECRET`

---

## 🔍 Como Encontrar a Service Role Key do Supabase

1. Acesse: https://supabase.com/dashboard/project/xzrqorkqrzkhxzfbbfjf
2. No menu lateral, clique em **"Settings"** (Configurações)
3. Clique em **"API"**
4. Role até a seção **"Project API keys"**
5. Encontre a chave **"service_role"** (não "anon"!)
6. Clique no ícone de **"eye"** (olho) para revelar
7. Copie a chave completa → use como `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **CUIDADO:** A `service_role` key tem acesso total ao banco de dados! Não compartilhe publicamente!

---

## ✅ Após Configurar

1. **Salve as variáveis** no Dashboard
2. **Aguarde 5-10 segundos** para propagar
3. **Teste novamente:**
   - Tente conectar um bar ao Mercado Pago pelo portal admin
   - Ou teste a URL: `https://xzrqorkqrzkhxzfbbfjf.supabase.co/functions/v1/mp-oauth-callback?code=test&state=test`

---

## 🔄 Se Precisar Redeplear a Função

Se você alterar as variáveis de ambiente, a função usará automaticamente as novas variáveis. Não precisa redeplear, mas se quiser garantir:

```powershell
npx supabase@latest functions deploy mp-oauth-callback --no-verify-jwt
```

---

## 📝 Checklist Rápido

- [ ] `MP_CLIENT_ID` configurado (PRODUÇÃO)
- [ ] `MP_CLIENT_SECRET` configurado (PRODUÇÃO)
- [ ] `SUPABASE_URL` configurado
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado (service_role, não anon!)
- [ ] `MP_REDIRECT_URI` configurado (opcional)
- [ ] `FRONTEND_URL` configurado (opcional)

---

## 🆘 Problemas Comuns

### "MP_CLIENT_ID e MP_CLIENT_SECRET são obrigatórios"
✅ Configure essas variáveis no Dashboard

### "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios"
✅ Configure essas variáveis no Dashboard

### Erro 401 ao trocar code por tokens
- Verifique se está usando credenciais de **PRODUÇÃO** (não sandbox)
- Verifique se o `redirect_uri` está configurado corretamente no Mercado Pago Dashboard

### "Invalid credentials"
- Verifique se copiou as credenciais corretamente (sem espaços extras)
- Verifique se está usando as credenciais de **PRODUÇÃO**


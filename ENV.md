# 📝 Variáveis de Ambiente - Guia Completo

Este documento lista todas as variáveis de ambiente necessárias para o funcionamento completo do sistema.

## 🎯 Índice

- [Variáveis do Frontend (.env)](#variáveis-do-frontend-env)
- [Secrets das Edge Functions (Supabase)](#secrets-das-edge-functions-supabase)
- [Onde Configurar](#onde-configurar)

---

## 🖥️ Variáveis do Frontend (.env)

Crie um arquivo `.env` na raiz do projeto (mesmo nível do `package.json`) com as seguintes variáveis:

```env
# ============================================
# SUPABASE - Obrigatório
# ============================================
# URL do seu projeto Supabase
# Encontre em: Supabase Dashboard > Settings > API > Project URL
VITE_SUPABASE_URL=https://seu-projeto.supabase.co

# Chave pública (anon key) do Supabase
# Encontre em: Supabase Dashboard > Settings > API > Project API keys > anon public
# ⚠️ Esta chave é pública e segura para uso no frontend
VITE_SUPABASE_ANON_KEY=sua-chave-anon-key-aqui

# ============================================
# MERCADO PAGO OAuth - Obrigatório para OAuth
# ============================================
# Client ID da sua aplicação Mercado Pago
# Encontre em: Mercado Pago Dashboard > Aplicações > Sua App > Credenciais
# Necessário apenas se você quiser usar a integração OAuth para conectar contas de vendedores
VITE_MP_CLIENT_ID=seu-client-id-mercadopago

# URL de redirecionamento OAuth (opcional - padrão será gerado automaticamente)
# Deve ser EXATAMENTE o mesmo configurado no Mercado Pago Dashboard
# Formato: https://seu-projeto.supabase.co/functions/v1/mp-oauth-callback
VITE_MP_REDIRECT_URI=https://seu-projeto.supabase.co/functions/v1/mp-oauth-callback

# URL base de autorização OAuth do Mercado Pago (opcional)
# Padrão: https://auth.mercadopago.com/authorization (redireciona automaticamente)
# Para Brasil: https://auth.mercadopago.com.br/authorization
# Para Argentina: https://auth.mercadopago.com.ar/authorization
VITE_MP_AUTH_URL=https://auth.mercadopago.com/authorization
```

### 📋 Exemplo de Arquivo .env

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODA5MjgwMCwiZXhwIjoxOTUzNjY4ODAwfQ.exemplo
VITE_MP_CLIENT_ID=1234567890123456
```

---

## ⚙️ Secrets das Edge Functions (Supabase)

As Edge Functions do Supabase usam **Secrets** configurados no dashboard do Supabase. **Não** use um arquivo `.env` para essas variáveis.

### 🔐 Configuração via Dashboard

1. Acesse: **Supabase Dashboard > Edge Functions > Secrets**
2. Ou via CLI: `supabase secrets set NOME_VARIAVEL=valor`

### 📝 Lista de Secrets Necessárias

```bash
# ============================================
# SUPABASE - Obrigatório
# ============================================
# URL do seu projeto Supabase (mesma do frontend)
SUPABASE_URL=https://seu-projeto.supabase.co

# Service Role Key do Supabase
# ⚠️ CUIDADO: Esta chave tem acesso total ao banco de dados!
# Encontre em: Supabase Dashboard > Settings > API > Project API keys > service_role
# Use apenas nas Edge Functions, NUNCA no frontend!
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui

# ============================================
# MERCADO PAGO - Obrigatório
# ============================================
# Access Token da sua aplicação Marketplace do Mercado Pago
# Encontre em: Mercado Pago Dashboard > Aplicações > Sua App > Credenciais
# Use o token de PRODUÇÃO ou TESTE conforme necessário
# Alternativa: MERCADO_PAGO_ACCESS_TOKEN (aceita ambos os nomes)
MP_ACCESS_TOKEN_MARKETPLACE=APP_USR-1234567890-123456-abcdefghijklmnopqrstuvwxyz-123456789

# OU (alternativa)
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-1234567890-123456-abcdefghijklmnopqrstuvwxyz-123456789

# ============================================
# MERCADO PAGO OAuth - Obrigatório para OAuth
# ============================================
# Client ID da aplicação Mercado Pago (usado na função mp-oauth-callback)
MP_CLIENT_ID=1234567890123456

# Client Secret da aplicação Mercado Pago (usado na função mp-oauth-callback)
MP_CLIENT_SECRET=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

# URL de redirecionamento OAuth (opcional - padrão será gerado automaticamente)
# Formato: https://seu-projeto.supabase.co/functions/v1/mp-oauth-callback
MP_REDIRECT_URI=https://seu-projeto.supabase.co/functions/v1/mp-oauth-callback

# ============================================
# FRONTEND URL - Opcional
# ============================================
# URL do frontend para redirecionamentos após OAuth
# Se não configurado, usa: http://localhost:8080
FRONTEND_URL=https://seu-site.com
# OU para desenvolvimento:
FRONTEND_URL=http://localhost:8080
```

---

## 📍 Onde Configurar

### Frontend (.env)

**Localização:** Raiz do projeto (`/Cardapio/.env`)

⚠️ **IMPORTANTE:** 
- O arquivo `.env` deve estar na raiz do projeto
- Não commite o arquivo `.env` no Git (já deve estar no `.gitignore`)
- Após alterar o `.env`, reinicie o servidor de desenvolvimento (`npm run dev`)

### Edge Functions (Supabase Secrets)

**Método 1: Via Dashboard (Recomendado)**
1. Acesse: https://supabase.com/dashboard/project/[seu-projeto]/settings/api
2. Vá para: **Edge Functions > Secrets**
3. Adicione cada variável clicando em "Add secret"

**Método 2: Via CLI**
```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Login no Supabase
supabase login

# Link do projeto
supabase link --project-ref seu-project-ref

# Configurar secrets
supabase secrets set SUPABASE_URL=https://seu-projeto.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
supabase secrets set MP_ACCESS_TOKEN_MARKETPLACE=seu-access-token
supabase secrets set MP_CLIENT_ID=seu-client-id
supabase secrets set MP_CLIENT_SECRET=seu-client-secret
supabase secrets set MP_REDIRECT_URI=https://seu-projeto.supabase.co/functions/v1/mp-oauth-callback
supabase secrets set FRONTEND_URL=https://seu-site.com
```

**Método 3: Via Arquivo (Desenvolvimento Local)**
Para desenvolvimento local das Edge Functions, crie: `supabase/.env.local`
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
MP_ACCESS_TOKEN_MARKETPLACE=seu-access-token
# ... outras variáveis
```

---

## 🔍 Onde Obter Cada Credencial

### Supabase

1. **VITE_SUPABASE_URL** e **SUPABASE_URL**
   - Dashboard > Settings > API > Project URL
   - Exemplo: `https://abcdefghijklmnop.supabase.co`

2. **VITE_SUPABASE_ANON_KEY**
   - Dashboard > Settings > API > Project API keys > `anon` `public`
   - Seguro para uso no frontend

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Dashboard > Settings > API > Project API keys > `service_role` `secret`
   - ⚠️ **NUNCA exponha no frontend!** Use apenas nas Edge Functions

### Mercado Pago

1. **MP_ACCESS_TOKEN_MARKETPLACE** / **MERCADO_PAGO_ACCESS_TOKEN**
   - Dashboard > Aplicações > Sua App Marketplace > Credenciais
   - Escolha entre token de **Produção** ou **Teste**

2. **VITE_MP_CLIENT_ID** e **MP_CLIENT_ID**
   - Dashboard > Aplicações > Sua App > Credenciais
   - Mesmo valor para ambas as variáveis (frontend e Edge Functions)

3. **MP_CLIENT_SECRET**
   - Dashboard > Aplicações > Sua App > Credenciais
   - ⚠️ **NUNCA exponha no frontend!** Use apenas nas Edge Functions

4. **MP_REDIRECT_URI**
   - Formato: `https://seu-projeto.supabase.co/functions/v1/mp-oauth-callback`
   - Configure este mesmo valor no Dashboard do Mercado Pago:
     - Dashboard > Aplicações > Sua App > URLs de redirecionamento

---

## ✅ Checklist de Configuração

### Frontend
- [ ] Criar arquivo `.env` na raiz do projeto
- [ ] Configurar `VITE_SUPABASE_URL`
- [ ] Configurar `VITE_SUPABASE_ANON_KEY`
- [ ] Configurar `VITE_MP_CLIENT_ID` (se usar OAuth)
- [ ] Reiniciar servidor de desenvolvimento

### Edge Functions
- [ ] Configurar `SUPABASE_URL` como secret
- [ ] Configurar `SUPABASE_SERVICE_ROLE_KEY` como secret
- [ ] Configurar `MP_ACCESS_TOKEN_MARKETPLACE` como secret
- [ ] Configurar `MP_CLIENT_ID` como secret (se usar OAuth)
- [ ] Configurar `MP_CLIENT_SECRET` como secret (se usar OAuth)
- [ ] Configurar `MP_REDIRECT_URI` como secret (se usar OAuth, opcional)
- [ ] Configurar `FRONTEND_URL` como secret (opcional)
- [ ] Fazer deploy das Edge Functions:
  ```bash
  supabase functions deploy create-payment
  supabase functions deploy mp-webhook
  supabase functions deploy mp-oauth-callback
  ```

### Mercado Pago
- [ ] Criar aplicação Marketplace no Mercado Pago
- [ ] Obter Access Token (Produção ou Teste)
- [ ] Configurar Webhook URL: `https://seu-projeto.supabase.co/functions/v1/mp-webhook`
- [ ] Se usar OAuth:
  - [ ] Obter Client ID e Client Secret
  - [ ] Configurar URL de redirecionamento: `https://seu-projeto.supabase.co/functions/v1/mp-oauth-callback`

---

## 🚨 Problemas Comuns

### "Credenciais do Mercado Pago não configuradas"
- ✅ Verifique se `MP_ACCESS_TOKEN_MARKETPLACE` está configurado como secret no Supabase
- ✅ Verifique se o secret está escrito corretamente (sem espaços extras)

### "Configurações OAuth não encontradas"
- ✅ Verifique se `VITE_MP_CLIENT_ID` está no arquivo `.env` do frontend
- ✅ Reinicie o servidor de desenvolvimento após adicionar a variável

### "Cannot read property 'SUPABASE_URL'"
- ✅ Verifique se todas as secrets estão configuradas no Supabase Dashboard
- ✅ Verifique se você fez o deploy das Edge Functions após configurar os secrets

### Variáveis não são reconhecidas no frontend
- ✅ Certifique-se de que as variáveis começam com `VITE_`
- ✅ Reinicie o servidor de desenvolvimento (`npm run dev`)
- ✅ Limpe o cache do navegador

---

## 📚 Recursos Adicionais

- [Documentação Supabase - Environment Variables](https://supabase.com/docs/guides/functions/secrets)
- [Documentação Vite - Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Documentação Mercado Pago - Credenciais](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/credentials)
- [Documentação Mercado Pago - OAuth](https://www.mercadopago.com.br/developers/pt/docs/security/oauth)

---

**Última atualização:** Dezembro 2024




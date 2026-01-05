# 🔧 Configuração do Mercado Pago - Resolver Erro MP_CLIENT_ID

Este guia explica como configurar as variáveis de ambiente necessárias para a integração com Mercado Pago.

## ❌ Erro Atual

```
Erro ao conectar Mercado Pago
Variáveis de ambiente obrigatórias não configuradas: MP_CLIENT_ID
```

## ✅ Solução: Configurar Variáveis de Ambiente no Supabase

### Passo 1: Acessar o Supabase Dashboard

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, vá em **Edge Functions**
4. Clique em **Settings** (ou **Configurações**)
5. Vá na aba **Environment Variables** (ou **Variáveis de Ambiente**)

### Passo 2: Adicionar Variáveis Obrigatórias

Adicione as seguintes variáveis de ambiente:

#### 🔴 Obrigatórias (devem ser configuradas):

1. **`MP_CLIENT_ID`**
   - Onde obter: Mercado Pago Dashboard → Aplicações → Sua Aplicação → Credenciais
   - Valor: Seu Client ID do Mercado Pago (formato: número)

2. **`MP_CLIENT_SECRET`**
   - Onde obter: Mercado Pago Dashboard → Aplicações → Sua Aplicação → Credenciais
   - Valor: Seu Client Secret do Mercado Pago

3. **`SUPABASE_URL`**
   - Onde obter: Supabase Dashboard → Settings → API → Project URL
   - Valor: `https://seu-projeto.supabase.co`

4. **`SUPABASE_SERVICE_ROLE_KEY`**
   - Onde obter: Supabase Dashboard → Settings → API → service_role key
   - ⚠️ **ATENÇÃO**: Use a **service_role** key (não a anon key!)
   - Esta chave tem permissões administrativas completas

#### 🟡 Opcionais (podem ser configuradas ou usar valores padrão):

5. **`MP_REDIRECT_URI`** (opcional)
   - Se não configurado, será gerado automaticamente como: `{SUPABASE_URL}/functions/v1/mp-oauth-callback`
   - Se configurar manualmente, deve ser: `https://seu-projeto.supabase.co/functions/v1/mp-oauth-callback`
   - ⚠️ **IMPORTANTE**: Este URI deve ser **exatamente** o mesmo configurado no Mercado Pago Dashboard

6. **`FRONTEND_URL`** (opcional)
   - Valor padrão: `http://localhost:8080`
   - Para produção: `https://seu-dominio.com`
   - URL do seu frontend onde os usuários serão redirecionados após OAuth

### Passo 3: Obter Credenciais do Mercado Pago

#### Como obter MP_CLIENT_ID e MP_CLIENT_SECRET:

1. Acesse [https://www.mercadopago.com.br/developers](https://www.mercadopago.com.br/developers)
2. Faça login na sua conta
3. Vá em **Suas integrações** → **Aplicações**
4. Selecione sua aplicação (ou crie uma nova)
5. Vá na aba **Credenciais**
6. Copie:
   - **Client ID** → use como `MP_CLIENT_ID`
   - **Client Secret** → use como `MP_CLIENT_SECRET`

#### ⚠️ Importante sobre o Redirect URI no Mercado Pago:

No Mercado Pago Dashboard, você também precisa configurar o **Redirect URI**:

1. Na mesma página de credenciais, procure por **"URLs de redirecionamento"** ou **"Redirect URIs"**
2. Adicione: `https://seu-projeto.supabase.co/functions/v1/mp-oauth-callback`
3. ⚠️ **CRÍTICO**: Este URI deve ser **exatamente igual** ao configurado em `MP_REDIRECT_URI` (ou o padrão gerado)

### Passo 4: Redeploy da Edge Function

Após configurar as variáveis de ambiente, você **DEVE** fazer o redeploy da função:

```bash
# 1. Login no Supabase (se ainda não estiver logado)
npx supabase@latest login

# 2. Deploy da função (OBRIGATÓRIO usar --no-verify-jwt)
npx supabase@latest functions deploy mp-oauth-callback --no-verify-jwt
```

⚠️ **O flag `--no-verify-jwt` é OBRIGATÓRIO** porque o callback do Mercado Pago não envia token de autenticação.

### Passo 5: Verificar Configuração

Após o deploy, teste a conexão:

1. Acesse o Admin Portal: `http://localhost:8080/admin`
2. Vá na aba **Bares**
3. Clique em **Config** em um bar
4. Tente conectar ao Mercado Pago
5. Se tudo estiver correto, você será redirecionado para autorizar no Mercado Pago

## 📋 Checklist de Configuração

- [ ] `MP_CLIENT_ID` configurado no Supabase
- [ ] `MP_CLIENT_SECRET` configurado no Supabase
- [ ] `SUPABASE_URL` configurado no Supabase
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado no Supabase
- [ ] `MP_REDIRECT_URI` configurado (ou deixar padrão)
- [ ] `FRONTEND_URL` configurado (ou deixar padrão)
- [ ] Redirect URI configurado no Mercado Pago Dashboard
- [ ] Edge Function redeployada com `--no-verify-jwt`
- [ ] Teste de conexão realizado

## 🔍 Troubleshooting

### Erro persiste após configurar variáveis

1. **Verifique se as variáveis foram salvas corretamente:**
   - No Supabase Dashboard, confirme que todas as variáveis aparecem na lista
   - Verifique se não há espaços extras ou caracteres especiais

2. **Verifique se fez o redeploy:**
   - As variáveis de ambiente só são aplicadas após o redeploy
   - Execute: `npx supabase@latest functions deploy mp-oauth-callback --no-verify-jwt`

3. **Verifique os logs da Edge Function:**
   - No Supabase Dashboard → Edge Functions → mp-oauth-callback → Logs
   - Procure por mensagens de erro relacionadas a variáveis de ambiente

### Erro 401 ao conectar OAuth

- Verifique se o Redirect URI no Mercado Pago é **exatamente igual** ao configurado
- Verifique se está usando credenciais de **PRODUÇÃO** (não sandbox/test)
- Confirme que o Client ID e Secret estão corretos

### Erro "redirect_uri diferente"

- O `redirect_uri` usado na troca do código OAuth deve ser **idêntico** ao usado na autorização inicial
- Verifique se não há diferenças de:
  - Protocolo (http vs https)
  - Barra final (`/` no final ou não)
  - Query parameters
  - Espaços ou caracteres especiais

## 📚 Referências

- [Documentação da Edge Function](supabase/functions/mp-oauth-callback/README.md)
- [Mercado Pago OAuth](https://www.mercadopago.com.br/developers/pt/docs/security/oauth)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)


# 🔧 Corrigir Erro OAuth - Variáveis de Ambiente

## ❌ Erro Atual

```
{"code":"NOT_FOUND", "message": "Requested function was not found"}
```

**Causa:** Variáveis de ambiente não configuradas no Supabase.

## ✅ Solução

### Passo 1: Configurar Variáveis de Ambiente

1. Acesse: https://supabase.com/dashboard/project/xzrqorkqrzkhxzfbbfjf
2. Vá em: **Edge Functions** → **Settings**
3. Na seção **"Environment Variables"**, adicione:

#### Variáveis Obrigatórias:

```
MP_CLIENT_ID = [Seu Client ID de PRODUÇÃO do Mercado Pago]
MP_CLIENT_SECRET = [Seu Client Secret de PRODUÇÃO do Mercado Pago]
SUPABASE_URL = https://xzrqorkqrzkhxzfbbfjf.supabase.co
SUPABASE_SERVICE_ROLE_KEY = [Sua service_role key]
```

#### Variável Opcional (mas recomendada):

```
FRONTEND_URL = [URL do seu frontend, ex: http://localhost:8080 ou https://seu-dominio.com]
```

**Onde encontrar:**
- **MP_CLIENT_ID e MP_CLIENT_SECRET**: Mercado Pago Dashboard → Suas integrações → Credenciais
- **SUPABASE_URL**: Já está no seu projeto
- **SUPABASE_SERVICE_ROLE_KEY**: Supabase Dashboard → Settings → API → service_role (secret)

### Passo 2: Fazer Redeploy da Função

Após configurar as variáveis, faça o redeploy:

```bash
npx supabase@latest functions deploy mp-oauth-callback --no-verify-jwt
```

### Passo 3: Testar Novamente

1. Acesse o Admin Portal
2. Clique em "Conectar Mercado Pago" no bar desejado
3. Complete o fluxo OAuth

## 🔍 Verificar se Está Configurado

Você pode verificar se as variáveis estão configuradas:

1. Supabase Dashboard → Edge Functions → `mp-oauth-callback` → Settings
2. Verifique se todas as variáveis aparecem na lista

## ⚠️ Importante

- Use credenciais de **PRODUÇÃO** do Mercado Pago (não sandbox)
- O `FRONTEND_URL` deve ser a URL exata do seu frontend (sem barra final)
- Se não configurar `FRONTEND_URL`, será usado `http://localhost:8080` como padrão

## 📋 Checklist

- [ ] `MP_CLIENT_ID` configurado
- [ ] `MP_CLIENT_SECRET` configurado
- [ ] `SUPABASE_URL` configurado
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado
- [ ] `FRONTEND_URL` configurado (opcional)
- [ ] Função redeployada com `--no-verify-jwt`
- [ ] Testado o fluxo OAuth



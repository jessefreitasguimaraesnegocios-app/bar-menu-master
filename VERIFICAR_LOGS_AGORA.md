# 🚨 AÇÃO IMEDIATA: Verificar Logs do Erro 500

## ⚡ Passo a Passo Rápido

### 1. Acesse os Logs Agora:

1. Abra: https://supabase.com/dashboard/project/xzrqorkqrzkhxzfbbfjf/functions
2. Clique em **"mp-oauth-callback"**
3. Clique na aba **"Logs"**
4. Procure pelos erros mais recentes (últimos 5 minutos)

### 2. O Que Procurar:

Procure por mensagens que começam com:
- ❌ **Erro:** (erros)
- 🔐 **OAuth callback recebido:** (confirma que a função foi chamada)
- 📥 **Parâmetros recebidos:** (mostra o que foi recebido)

### 3. Causas Mais Prováveis:

#### A) Variáveis de Ambiente Faltando
**Mensagem esperada:**
```
MP_CLIENT_ID e MP_CLIENT_SECRET são obrigatórios
```
ou
```
SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios
```

**Solução:** Configure no Dashboard → Edge Functions → Settings → Environment Variables

#### B) Erro ao Trocar Code por Tokens
**Mensagem esperada:**
```
❌ Erro ao obter tokens: [detalhes]
```

**Solução:** Verifique credenciais do Mercado Pago (PRODUÇÃO)

#### C) Bar Não Encontrado
**Mensagem esperada:**
```
Bar com ID [id] não encontrado
```

**Solução:** O `state` precisa ser um ID de bar válido

---

## 📋 Checklist Rápido

- [ ] Acessei os logs no Dashboard
- [ ] Copiei a mensagem de erro completa
- [ ] Verifiquei se as variáveis de ambiente estão configuradas

---

## 🔧 Se For Variáveis de Ambiente:

Configure estas 4 variáveis no Dashboard:

1. **MP_CLIENT_ID** - Client ID de PRODUÇÃO do Mercado Pago
2. **MP_CLIENT_SECRET** - Client Secret de PRODUÇÃO do Mercado Pago  
3. **SUPABASE_URL** - `https://xzrqorkqrzkhxzfbbfjf.supabase.co`
4. **SUPABASE_SERVICE_ROLE_KEY** - Service Role Key (Settings → API → service_role)

Veja o arquivo `CONFIGURAR_VARIAVEIS_AMBIENTE.md` para instruções detalhadas.

---

## 💬 Próximo Passo:

**Copie e cole aqui a mensagem de erro completa dos logs** para eu poder ajudar a resolver!




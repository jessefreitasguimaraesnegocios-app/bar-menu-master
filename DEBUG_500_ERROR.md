# 🔍 Debug: Erro 500 Internal Server Error

## ✅ Progresso

✅ **Erro 401 resolvido!** A função está pública e funcionando
❌ **Novo erro:** 500 Internal Server Error

Isso significa que a função está sendo executada, mas há um erro interno.

---

## 🔍 Como Ver os Logs Detalhados

### Passo 1: Acesse os Logs no Dashboard

1. Acesse: https://supabase.com/dashboard/project/xzrqorkqrzkhxzfbbfjf
2. No menu lateral, clique em **"Edge Functions"**
3. Clique em **"mp-oauth-callback"**
4. Clique na aba **"Logs"**

### Passo 2: Procure por Erros Recentes

Os logs mostrarão:
- ✅ Mensagens de sucesso (console.log)
- ❌ Erros detalhados (com stack trace)
- 📋 Parâmetros recebidos
- 🔄 Requisições ao Mercado Pago

---

## 🚨 Causas Comuns de Erro 500

### 1. Variáveis de Ambiente Faltando

**Erro esperado nos logs:**
```
MP_CLIENT_ID e MP_CLIENT_SECRET são obrigatórios
```
ou
```
SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios
```

**Solução:** Configure as variáveis no Dashboard (veja `CONFIGURAR_VARIAVEIS_AMBIENTE.md`)

### 2. Credenciais do Mercado Pago Inválidas

**Erro esperado nos logs:**
```
Falha ao obter tokens: [mensagem de erro do MP]
```

**Solução:** 
- Verifique se está usando credenciais de **PRODUÇÃO**
- Verifique se o `redirect_uri` está configurado corretamente no Mercado Pago Dashboard

### 3. Bar Não Encontrado no Banco

**Erro esperado nos logs:**
```
Bar com ID [id] não encontrado no banco de dados
```

**Solução:** Verifique se o `state` (bar_id) é válido

### 4. Erro ao Atualizar Banco de Dados

**Erro esperado nos logs:**
```
Falha ao atualizar bar no banco: [status] [erro]
```

**Solução:** Verifique se a `SUPABASE_SERVICE_ROLE_KEY` está correta

---

## 🔧 Verificar Variáveis de Ambiente

### No Dashboard do Supabase:

1. Vá em: **Edge Functions** → **Settings**
2. Verifique se TODAS estas variáveis estão configuradas:

```
✅ MP_CLIENT_ID
✅ MP_CLIENT_SECRET
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY
```

### Valores Esperados:

- **SUPABASE_URL:** `https://xzrqorkqrzkhxzfbbfjf.supabase.co`
- **MP_CLIENT_ID:** [Seu Client ID de PRODUÇÃO]
- **MP_CLIENT_SECRET:** [Seu Client Secret de PRODUÇÃO]
- **SUPABASE_SERVICE_ROLE_KEY:** [Sua service_role key]

---

## 📋 Checklist de Debug

- [ ] Verifiquei os logs no Dashboard
- [ ] Copiei a mensagem de erro completa dos logs
- [ ] Verifiquei se todas as variáveis de ambiente estão configuradas
- [ ] Verifiquei se as credenciais do Mercado Pago são de PRODUÇÃO
- [ ] Verifiquei se o `redirect_uri` está configurado no Mercado Pago Dashboard

---

## 🆘 Próximos Passos

1. **Acesse os logs** no Dashboard do Supabase
2. **Copie a mensagem de erro completa** (incluindo stack trace)
3. **Verifique as variáveis de ambiente** (veja `CONFIGURAR_VARIAVEIS_AMBIENTE.md`)
4. **Compartilhe o erro** para que eu possa ajudar a resolver

---

## 💡 Dica

A função tem logs detalhados. Procure por:
- `🔄` - Início de operações
- `✅` - Sucessos
- `❌` - Erros
- `📋` - Parâmetros enviados

Isso ajudará a identificar exatamente onde está falhando.




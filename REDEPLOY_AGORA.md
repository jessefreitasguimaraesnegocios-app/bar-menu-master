# 🚀 Redeploy da Edge Function - Resolver Erro MP_CLIENT_ID

## ⚠️ Problema

As variáveis de ambiente estão configuradas no Supabase Dashboard, mas a Edge Function ainda não consegue acessá-las porque **não foi redeployada** após a configuração.

## ✅ Solução: Redeploy Obrigatório

Após configurar variáveis de ambiente no Supabase, você **SEMPRE** precisa fazer o redeploy da função para que ela tenha acesso às novas variáveis.

### Passo 1: Verificar se está logado

```bash
npx supabase@latest login
```

Se já estiver logado, este comando apenas confirma.

### Passo 2: Redeploy da Função

```bash
npx supabase@latest functions deploy mp-oauth-callback --no-verify-jwt
```

⚠️ **IMPORTANTE**: O flag `--no-verify-jwt` é **OBRIGATÓRIO** porque o callback do Mercado Pago não envia token de autenticação.

### Passo 3: Verificar o Deploy

Você deve ver uma mensagem de sucesso como:

```
✅ Deployed Function mp-oauth-callback
```

### Passo 4: Testar a Conexão

1. Acesse: `http://localhost:8080/admin`
2. Vá na aba **Bares**
3. Clique em **Config** em um bar
4. Clique em **Conectar Mercado Pago**
5. Se tudo estiver correto, você será redirecionado para autorizar no Mercado Pago

## 🔍 Verificar Logs (Opcional)

Se ainda houver problemas, verifique os logs:

1. Acesse: https://supabase.com/dashboard/project/xzrqorkqrzkhxzfbbfjf/functions/mp-oauth-callback/logs
2. Procure por mensagens de erro relacionadas a variáveis de ambiente
3. Você deve ver logs como:
   ```
   🔍 Verificando variáveis de ambiente: {
     hasMP_CLIENT_ID: true,
     hasMP_CLIENT_SECRET: true,
     ...
   }
   ```

## 📋 Checklist

- [ ] Variáveis configuradas no Supabase Dashboard (Secrets)
- [ ] Redeploy executado com `--no-verify-jwt`
- [ ] Mensagem de sucesso no deploy
- [ ] Teste de conexão realizado
- [ ] Logs verificados (se necessário)

## ⚡ Comando Rápido

```bash
npx supabase@latest functions deploy mp-oauth-callback --no-verify-jwt
```

**Isso é tudo que você precisa fazer!** 🎉


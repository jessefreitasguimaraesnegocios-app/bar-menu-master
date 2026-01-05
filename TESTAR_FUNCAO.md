
# 🧪 Testar a Função mp-oauth-callback

## Verificar se as Variáveis Estão Acessíveis

Após o redeploy, você pode testar se a função está acessando as variáveis corretamente:

### Opção 1: Testar via URL Direta

Acesse esta URL no navegador (substitua pelos valores corretos):

```
https://xzrqorkqrzkhxzfbbfjf.supabase.co/functions/v1/mp-oauth-callback?code=test&state=test-bar-id
```

**O que esperar:**
- Se as variáveis estiverem configuradas: A função tentará processar o OAuth e redirecionar (mesmo com code inválido, você verá um erro diferente, não o de variáveis faltando)
- Se as variáveis NÃO estiverem configuradas: Você verá o erro de `MP_CLIENT_ID` não configurado

### Opção 2: Verificar Logs Recentes

1. Acesse: https://supabase.com/dashboard/project/xzrqorkqrzkhxzfbbfjf/functions/mp-oauth-callback/logs
2. Procure por logs **APÓS** o redeploy (após 15:55)
3. Procure por esta mensagem:
   ```
   🔍 Verificando variáveis de ambiente: {
     hasMP_CLIENT_ID: true,  // ← Deve ser TRUE agora
     hasMP_CLIENT_SECRET: true,
     ...
   }
   ```

### Opção 3: Testar Conexão OAuth Completa

1. Acesse: `http://localhost:8081/admin`
2. Vá na aba **Bares**
3. Clique em **Config** em um bar
4. Clique em **Conectar Mercado Pago**
5. Se tudo estiver correto:
   - Você será redirecionado para o Mercado Pago
   - Após autorizar, será redirecionado de volta
   - Verá uma mensagem de sucesso

## ⚠️ Se o Erro Persistir

Se mesmo após o redeploy você ainda ver o erro de `MP_CLIENT_ID` não configurado:

1. **Verifique se os secrets estão realmente configurados:**
   ```bash
   npx supabase@latest secrets list
   ```
   Deve mostrar `MP_CLIENT_ID` e `MP_CLIENT_SECRET` na lista

2. **Verifique se o nome está correto:**
   - Deve ser exatamente: `MP_CLIENT_ID` (maiúsculas, com underscore)
   - Não pode ter espaços ou caracteres especiais

3. **Aguarde alguns minutos:**
   - Às vezes o Supabase leva alguns minutos para propagar os secrets
   - Tente novamente após 2-3 minutos

4. **Tente configurar via CLI:**
   ```bash
   npx supabase@latest secrets set MP_CLIENT_ID=3614962432426934
   npx supabase@latest secrets set MP_CLIENT_SECRET=1fZ0EVyt9aAIVniPadWcBoWGuC8d1nwZ
   npx supabase@latest functions deploy mp-oauth-callback --no-verify-jwt
   ```

## 📊 Verificar Logs em Tempo Real

Para ver os logs mais recentes:

1. Acesse: https://supabase.com/dashboard/project/xzrqorkqrzkhxzfbbfjf/functions/mp-oauth-callback/logs
2. Filtre por "INFO" ou "ERROR"
3. Procure por logs com timestamp recente (após o redeploy)
4. Verifique se `hasMP_CLIENT_ID: true` aparece nos logs


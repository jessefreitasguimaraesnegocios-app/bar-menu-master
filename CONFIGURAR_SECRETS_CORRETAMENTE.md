# 🔧 Configurar Secrets Corretamente no Supabase

## ❌ Problema

Os Secrets estão configurados, mas a função não consegue acessá-los via `Deno.env.get()`.

## ✅ Solução: Verificar e Reconfigurar

### Passo 1: Verificar os Secrets Atuais

1. Acesse: https://supabase.com/dashboard/project/xzrqorkqrzkhxzfbbfjf/functions/secrets
2. Verifique se estas variáveis existem:
   - ✅ `MP_CLIENT_ID`
   - ✅ `MP_CLIENT_SECRET`
   - ✅ `SUPABASE_URL`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ✅ `FRONTEND_URL`

### Passo 2: Verificar se os Valores Estão Preenchidos

⚠️ **IMPORTANTE**: Verifique se os valores não estão vazios!

1. Clique nos três pontos (⋯) ao lado de cada Secret
2. Verifique se o valor está preenchido (não vazio)
3. Se estiver vazio, edite e adicione o valor correto

### Passo 3: Verificar Environment Variables da Função

Além dos Secrets globais, pode ser necessário configurar na função específica:

1. Acesse: https://supabase.com/dashboard/project/xzrqorkqrzkhxzfbbfjf/functions/mp-oauth-callback
2. Clique em **"Settings"**
3. Procure por uma seção **"Environment Variables"** ou **"Secrets"**
4. Se houver, adicione as mesmas variáveis lá

### Passo 4: Tentar Reconfigurar os Secrets

Às vezes, deletar e recriar os Secrets resolve problemas de sincronização:

1. **NÃO DELETE TODOS DE UMA VEZ** - faça um por vez
2. Anote os valores antes de deletar
3. Delete o Secret `MP_CLIENT_ID`
4. Recrie com o mesmo nome e valor
5. Repita para `MP_CLIENT_SECRET` se necessário

### Passo 5: Redeploy da Função

Após reconfigurar, faça redeploy:

```bash
npx supabase@latest functions deploy mp-oauth-callback --no-verify-jwt
```

### Passo 6: Verificar os Logs Novamente

1. Tente conectar o bar novamente
2. Verifique os logs: https://supabase.com/dashboard/project/xzrqorkqrzkhxzfbbfjf/functions/mp-oauth-callback/logs
3. Procure por: `availableEnvKeys` - isso mostrará quais variáveis estão disponíveis

## 🔍 Debug Adicional

Se ainda não funcionar, os logs agora mostrarão:
- `availableEnvKeys`: Lista de variáveis que estão disponíveis
- `totalAvailable`: Quantidade de variáveis disponíveis

Isso ajudará a identificar se:
- As variáveis não estão sendo expostas
- Os nomes estão diferentes
- Há algum problema de sincronização

## ⚠️ Possível Solução Alternativa

Se os Secrets não funcionarem, você pode tentar usar a API do Supabase para buscar os valores, mas isso é mais complexo. Primeiro, tente as soluções acima.

## 📋 Checklist

- [ ] Secrets configurados no Dashboard
- [ ] Valores dos Secrets não estão vazios
- [ ] Secrets recriados (se necessário)
- [ ] Função redeployada
- [ ] Logs verificados após tentar conectar
- [ ] `availableEnvKeys` mostra as variáveis nos logs


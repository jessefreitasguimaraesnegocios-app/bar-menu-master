# 🧪 Guia de Testes - Fluxo OAuth Mercado Pago

## ⚠️ IMPORTANTE: Como NÃO Testar

**NUNCA acesse a URL do callback diretamente no navegador:**
```
❌ https://seu-projeto.supabase.co/functions/v1/mp-oauth-callback?code=XYZ&state=BAR_ID
```

**Por quê?**
- O `code` é um código temporário que expira rapidamente (alguns minutos)
- Ele só é válido após completar o fluxo OAuth completo
- Acessar diretamente resultará em erro 401 ou código expirado

## ✅ Como Testar Corretamente

### Passo 1: Preparar Ambiente

1. **Verificar Secrets no Supabase:**
   ```bash
   supabase secrets list
   ```
   
   Deve ter:
   - `MP_CLIENT_ID`
   - `MP_CLIENT_SECRET`
   - `MP_REDIRECT_URI`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **Verificar Variáveis no Frontend (.env):**
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_MP_CLIENT_ID=seu-client-id
   VITE_MP_REDIRECT_URI=https://seu-projeto.supabase.co/functions/v1/mp-oauth-callback
   ```

3. **Verificar Configuração no Mercado Pago Dashboard:**
   - Dashboard > Aplicações > Sua App > URLs de redirecionamento
   - Deve ter exatamente: `https://seu-projeto.supabase.co/functions/v1/mp-oauth-callback`
   - ⚠️ Deve ser IDÊNTICO ao `MP_REDIRECT_URI` configurado

### Passo 2: Fazer Deploy das Edge Functions

```bash
supabase functions deploy mp-oauth-callback
```

### Passo 3: Monitorar Logs

Em um terminal separado, monitore os logs:

```bash
supabase functions logs mp-oauth-callback --follow
```

### Passo 4: Testar o Fluxo Completo

1. **Acesse o Admin Portal:**
   ```
   http://localhost:8080/admin
   ```

2. **Edite um bar existente:**
   - Clique em "Editar" em um bar
   - Ou crie um novo bar primeiro

3. **Clique em "Conectar Mercado Pago":**
   - O botão deve estar visível se o bar não estiver conectado
   - Se já estiver conectado, aparecerá "Reautorizar Mercado Pago"

4. **Você será redirecionado para o Mercado Pago:**
   - URL será algo como: `https://auth.mercadopago.com/authorization?...`
   - Você deve ver a tela de login do Mercado Pago

5. **Faça login no Mercado Pago:**
   - Use uma conta de vendedor/teste do Mercado Pago
   - ⚠️ Use conta de TESTE (sandbox) se estiver em desenvolvimento

6. **Autorize a aplicação:**
   - Após login, o Mercado Pago pedirá autorização
   - Clique em "Autorizar" ou "Permitir"

7. **Aguarde o redirecionamento:**
   - O Mercado Pago redirecionará automaticamente para o Admin Portal
   - Você deve ver uma mensagem de sucesso: "Mercado Pago conectado!"

8. **Verifique o status:**
   - No Admin Portal, o bar deve mostrar "Conectado"
   - Deve aparecer o `mp_user_id`
   - Deve mostrar a data/hora da conexão

### Passo 5: Verificar nos Logs

Nos logs da Edge Function, você deve ver:

```
🚀 Edge Function mp-oauth-callback invocada
🔐 OAuth callback recebido - Método: GET
🔐 Parâmetros recebidos: { hasCode: true, hasState: true, ... }
🔄 Trocando código OAuth por tokens do Mercado Pago...
✅ Tokens recebidos do Mercado Pago: { hasAccessToken: true, userId: ... }
💾 Salvando tokens no banco de dados para bar: BAR_ID
✅ Bar atualizado com sucesso
✅ OAuth conectado com sucesso para bar: BAR_ID
```

### Passo 6: Verificar no Banco de Dados

```sql
SELECT 
  id, 
  name, 
  mp_user_id, 
  mp_oauth_connected_at,
  CASE 
    WHEN mp_access_token IS NOT NULL THEN 'Token presente'
    ELSE 'Token ausente'
  END as token_status
FROM bars
WHERE id = 'SEU_BAR_ID';
```

Você deve ver:
- `mp_user_id`: ID numérico do Mercado Pago
- `mp_oauth_connected_at`: Data/hora da conexão
- `token_status`: "Token presente"

## 🐛 Troubleshooting

### Erro: "Code de autorização não encontrado"

**Causa:** Você tentou acessar a URL do callback diretamente.

**Solução:** Sempre inicie o fluxo pelo Admin Portal, clicando em "Conectar Mercado Pago".

### Erro 401: "Missing authorization header"

**Possíveis causas:**
1. **Credenciais OAuth inválidas:**
   - Verifique `MP_CLIENT_ID` e `MP_CLIENT_SECRET` nos secrets
   - Certifique-se de que são as credenciais corretas do Mercado Pago

2. **Redirect URI não corresponde:**
   - O `MP_REDIRECT_URI` nos secrets deve ser EXATAMENTE igual ao configurado no Mercado Pago Dashboard
   - Verifique se não há espaços extras ou diferenças

3. **Code expirado:**
   - Os codes do Mercado Pago expiram rapidamente
   - Tente o fluxo novamente do início

4. **Aplicação não autorizada:**
   - Verifique se a aplicação está autorizada no Mercado Pago Dashboard
   - Verifique se está usando as credenciais corretas (teste vs produção)

### Erro: "Tokens incompletos do Mercado Pago"

**Causa:** A resposta do Mercado Pago não contém `access_token` ou `user_id`.

**Solução:**
1. Verifique os logs para ver a resposta completa
2. Certifique-se de que o `scope` inclui `offline_access read write`
3. Verifique se a conta do Mercado Pago está ativa

### O fluxo funciona, mas o bar não aparece como conectado

**Causa:** Erro ao salvar no banco de dados.

**Solução:**
1. Verifique os logs da Edge Function para erros do Supabase
2. Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurado corretamente
3. Verifique se a tabela `bars` existe e tem as colunas necessárias

## 📋 Checklist de Teste

- [ ] Secrets configurados no Supabase
- [ ] Variáveis configuradas no frontend (.env)
- [ ] URL de redirecionamento configurada no Mercado Pago Dashboard
- [ ] Edge Function deployada
- [ ] Logs sendo monitorados
- [ ] Bar criado no sistema
- [ ] Clique em "Conectar Mercado Pago" redireciona para o Mercado Pago
- [ ] Login no Mercado Pago funciona
- [ ] Autorização funciona
- [ ] Redirecionamento de volta funciona
- [ ] Mensagem de sucesso aparece
- [ ] Bar aparece como "Conectado" no Admin Portal
- [ ] `mp_user_id` é exibido
- [ ] Tokens foram salvos no banco de dados

## 🔍 Verificações Adicionais

### Testar Split Payment Após OAuth

Após conectar o OAuth, teste criar um pagamento para verificar se o split funciona:

1. Vá para o menu do bar
2. Adicione itens ao carrinho
3. Finalize o pedido
4. Verifique se o pagamento é criado com split payment
5. Verifique nos logs se o `mp_access_token` do bar está sendo usado

### Testar Reautorização

Se o token expirar, teste a reautorização:

1. Clique em "Reautorizar Mercado Pago" no bar
2. Complete o fluxo OAuth novamente
3. Verifique se os tokens são atualizados no banco

## 📚 Recursos

- [Documentação Mercado Pago OAuth](https://www.mercadopago.com.br/developers/pt/docs/security/oauth)
- [Mercado Pago Dashboard](https://www.mercadopago.com.br/developers/panel)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)

---

**Última atualização:** Dezembro 2024








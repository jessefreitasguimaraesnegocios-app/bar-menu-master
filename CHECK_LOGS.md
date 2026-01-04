# 📊 Como Verificar Logs da Edge Function no Supabase Dashboard

## Passo a Passo para Ver Logs Detalhados

### 1. No Dashboard do Supabase

1. **Acesse a Edge Function:**
   - Clique em `mp-oauth-callback` na lista de funções

2. **Vá para a aba "Logs":**
   - Clique na aba "Logs" no topo
   - Você verá uma lista de invocações recentes

3. **Clique em uma invocação específica:**
   - Clique em um dos IDs das invocações (ex: `c09f938a-e11e-429c-8edd-246af5899178`)
   - Isso mostrará os logs detalhados dessa execução

### 2. O que Procurar nos Logs

Procure por estas mensagens de log que adicionamos:

#### ✅ Se funcionou corretamente:
```
🚀 Edge Function mp-oauth-callback invocada
🔐 OAuth callback recebido - Método: GET
🔐 Parâmetros recebidos: { hasCode: true, hasState: true, ... }
🔐 Bar ID extraído do state: BAR_ID
🔐 Verificando credenciais OAuth: { hasClientId: true, hasClientSecret: true, ... }
🔄 Trocando código OAuth por tokens do Mercado Pago...
✅ Tokens recebidos do Mercado Pago: { hasAccessToken: true, userId: ... }
💾 Salvando tokens no banco de dados para bar: BAR_ID
✅ Bar atualizado com sucesso
✅ OAuth conectado com sucesso para bar: BAR_ID
```

#### ❌ Se der erro:
```
❌ Code de autorização não fornecido!
❌ ERRO 401 - Credenciais OAuth inválidas
❌ Erro ao trocar código por tokens
❌ Erro ao atualizar bar no banco de dados
```

### 3. Analisar Erros Específicos

#### Erro: "Code de autorização não fornecido"
- **Significa:** A URL foi acessada sem o parâmetro `code`
- **Causa:** Acesso direto à URL ou code expirado
- **Solução:** Iniciar o fluxo pelo Admin Portal

#### Erro: "ERRO 401 - Credenciais OAuth inválidas"
- **Significa:** O Mercado Pago rejeitou as credenciais
- **Possíveis causas:**
  - `MP_CLIENT_ID` ou `MP_CLIENT_SECRET` incorretos
  - `redirect_uri` não corresponde ao configurado no MP Dashboard
  - Code expirado ou inválido
- **Solução:** Verificar secrets e configurações

#### Erro: "Erro ao atualizar bar no banco de dados"
- **Significa:** Problema ao salvar tokens no Supabase
- **Possíveis causas:**
  - `SUPABASE_SERVICE_ROLE_KEY` incorreto
  - Permissões insuficientes
  - Bar ID inválido
- **Solução:** Verificar service role key e permissões

## 4. Via CLI (Recomendado para logs em tempo real)

Para ver os logs em tempo real enquanto testa:

```bash
supabase functions logs mp-oauth-callback --follow
```

Isso mostrará todos os logs conforme eles acontecem.

## 5. Filtrar Logs por Tipo

No Dashboard, você pode filtrar por:
- **Status:** Success, Error, etc.
- **Método:** GET, POST, etc.
- **Período:** Última hora, dia, semana, etc.

## Exemplo de Análise

Se você ver nos logs:

```
🚀 Edge Function mp-oauth-callback invocada
🔐 OAuth callback recebido - Método: GET
🔐 Parâmetros recebidos: { hasCode: false, hasState: false }
❌ Code de autorização não fornecido!
```

**Isso indica:** A função foi acessada diretamente sem o fluxo OAuth completo.

**Ação:** Testar o fluxo completo pelo Admin Portal.

---

Se você compartilhar os logs específicos de uma invocação, posso ajudar a diagnosticar o problema exato!




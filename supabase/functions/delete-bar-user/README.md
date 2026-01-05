# Delete Bar User Edge Function

Edge Function para deletar o usuário associado a um bar quando o bar é deletado.

## Funcionalidade

Esta função:
1. Verifica se o usuário que chama é admin
2. Busca o usuário associado ao bar (através de `user_metadata.bar_id`)
3. Deleta o usuário usando a API Admin do Supabase

## Deploy

Use NPX (recomendado):

```bash
# 1. Login
npx supabase@latest login

# 2. Deploy
npx supabase@latest functions deploy delete-bar-user
```

## Secrets Necessários

A função usa automaticamente os secrets do Supabase:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Uso

Chamada da função:

```typescript
const response = await fetch(`${supabaseUrl}/functions/v1/delete-bar-user`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  },
  body: JSON.stringify({ bar_id: 'bar-uuid' }),
});
```

## Resposta

**Sucesso (usuário deletado):**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "deleted": true,
  "user_id": "uuid",
  "email": "user@example.com"
}
```

**Sucesso (nenhum usuário encontrado):**
```json
{
  "success": true,
  "message": "No user found for this bar",
  "deleted": false
}
```

**Erro:**
```json
{
  "error": "Error message",
  "details": "Error details"
}
```

## Segurança

- ✅ Verifica autenticação (Authorization header obrigatório)
- ✅ Verifica role de admin (`user_metadata.role === 'admin'`)
- ✅ Usa service role apenas no servidor (nunca exposto ao cliente)





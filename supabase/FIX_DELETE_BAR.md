# 🔧 Correção: Deletar Bar do Banco de Dados

## Problema
O bar não estava sendo deletado do banco de dados Supabase, mesmo aparecendo que foi deletado no app.

## Causa Raiz
1. **Verificação de Admin Incorreta**: O código estava verificando `user_metadata.role`, mas o sistema usa a tabela `user_roles`
2. **Políticas RLS Incorretas**: As políticas podem estar usando `auth.jwt()` ao invés de `public.is_admin()`
3. **Função SQL sem Verificação**: A função `delete_bar_complete` não verificava se o usuário é admin

## Correções Aplicadas

### 1. ✅ Código JavaScript (`src/pages/AdminPortal.tsx`)
- Atualizado para verificar admin usando a tabela `user_roles` ao invés de `user_metadata.role`
- Adicionados logs detalhados para debug
- Verificação dupla de admin antes de deletar

### 2. ✅ Função SQL (`supabase/17_delete_bar_function.sql`)
- Adicionada verificação de admin usando `public.is_admin(auth.uid())`
- Adicionada verificação se o bar existe antes de deletar
- Melhor tratamento de erros

### 3. ✅ Política RLS (`supabase/18_fix_bar_delete_policy.sql`)
- Nova política que usa `public.is_admin(auth.uid())` para verificar admin
- Remove políticas antigas que podem estar conflitando

## 📋 Passos para Aplicar as Correções

### Passo 1: Executar o SQL de Correção de Política

No Supabase SQL Editor, execute:

```sql
-- Arquivo: supabase/18_fix_bar_delete_policy.sql
```

Isso vai:
- Remover políticas antigas de DELETE
- Criar política correta usando `public.is_admin()`

### Passo 2: Atualizar a Função SQL

Execute no Supabase SQL Editor:

```sql
-- Arquivo: supabase/17_delete_bar_function.sql
```

Isso vai:
- Atualizar a função `delete_bar_complete` para verificar admin
- Garantir que apenas admins possam executar a função

### Passo 3: Verificar se Você é Admin

Execute este SQL para verificar se seu usuário tem role de admin:

```sql
-- Substitua 'SEU-USER-ID-AQUI' pelo seu user_id
SELECT 
  u.id,
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'seu-email@exemplo.com';
```

Se não tiver role de admin, adicione:

```sql
-- Substitua 'SEU-USER-ID-AQUI' pelo seu user_id real
INSERT INTO public.user_roles (user_id, role)
VALUES ('SEU-USER-ID-AQUI', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

### Passo 4: Testar a Deleção

1. Abra o app e vá para o Admin Portal
2. Tente deletar um bar
3. Verifique o console do navegador para ver os logs detalhados
4. Verifique no Supabase Table Editor se o bar foi realmente deletado

## 🔍 Debug

Se ainda não funcionar, verifique:

1. **Console do Navegador**: Procure por logs começando com `🗑️`, `✅`, ou `❌`
2. **Supabase Logs**: Vá em Edge Functions > Logs para ver erros da função
3. **Políticas RLS**: Execute este SQL para ver as políticas ativas:

```sql
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'bars' AND cmd = 'DELETE';
```

4. **Verificar Admin**: Execute:

```sql
SELECT public.is_admin(auth.uid()) as is_admin;
```

## ✅ Checklist

- [ ] Executei `18_fix_bar_delete_policy.sql`
- [ ] Executei `17_delete_bar_function.sql` atualizado
- [ ] Verifiquei que sou admin na tabela `user_roles`
- [ ] Testei deletar um bar
- [ ] Verifiquei no Supabase que o bar foi deletado
- [ ] Verifiquei que o usuário associado foi deletado (se aplicável)

## 📝 Notas Importantes

- A função `delete_bar_complete` usa `SECURITY DEFINER`, então ela executa com permissões elevadas
- A política RLS usa `public.is_admin(auth.uid())` que verifica a tabela `user_roles`
- O código JavaScript agora verifica admin usando a tabela `user_roles` antes de tentar deletar
- Logs detalhados foram adicionados para facilitar o debug



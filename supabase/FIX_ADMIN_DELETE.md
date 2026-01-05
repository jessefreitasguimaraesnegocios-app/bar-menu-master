# 🔧 Corrigir: Admin consegue adicionar mas não deletar

## Problema
Você está logado como admin, consegue **adicionar** bares, mas **não consegue deletar**.

## Causa
As políticas RLS estão usando métodos diferentes:
- **INSERT** pode estar usando `user_metadata.role` (que funciona)
- **DELETE** está usando `public.is_admin()` que verifica a tabela `user_roles` (e você não tem entrada lá)

## ✅ Solução Rápida (2 passos)

### Passo 1: Executar SQL de Unificação

No **Supabase SQL Editor**, execute este arquivo:

```
supabase/21_unify_admin_verification.sql
```

Isso vai:
- ✅ Remover todas as políticas antigas
- ✅ Criar políticas unificadas usando `public.is_admin()`
- ✅ Mostrar se você é admin ou não

### Passo 2: Adicionar Você como Admin na Tabela user_roles

Depois de executar o SQL acima, você verá uma query que mostra seu status.

**Se você NÃO aparecer como admin**, execute:

```sql
-- 1. Encontre seu user_id (substitua pelo seu email)
SELECT id, email FROM auth.users WHERE email = 'seu-email@exemplo.com';

-- 2. Adicione role de admin (substitua UUID pelo seu user_id do passo 1)
INSERT INTO public.user_roles (user_id, role)
VALUES ('UUID-DO-SEU-USUARIO-AQUI', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Verifique se foi adicionado
SELECT * FROM public.user_roles WHERE user_id = 'UUID-DO-SEU-USUARIO-AQUI';
```

**OU use a função helper (mais fácil):**

```sql
-- Substitua pelo seu email
SELECT * FROM add_admin_by_email('seu-email@exemplo.com');
```

## 🔍 Verificar se Funcionou

Execute esta query para verificar:

```sql
SELECT 
  u.email,
  public.is_admin(u.id) as is_admin,
  CASE 
    WHEN public.is_admin(u.id) THEN '✅ PODE DELETAR'
    ELSE '❌ NÃO PODE DELETAR'
  END as status
FROM auth.users u
WHERE u.email = 'seu-email@exemplo.com';
```

Se aparecer `✅ PODE DELETAR`, está funcionando!

## 📋 Checklist

- [ ] Executei `21_unify_admin_verification.sql`
- [ ] Verifiquei meu status na query do PASSO 5
- [ ] Adicionei role de admin na tabela `user_roles` (se necessário)
- [ ] Verifiquei que `public.is_admin()` retorna `true` para meu usuário
- [ ] Testei deletar um bar no app

## ⚠️ Importante

- O sistema agora usa **APENAS** a tabela `user_roles` para verificar admin
- `user_metadata.role` não é mais usado pelas políticas RLS
- Você precisa ter uma entrada em `user_roles` com `role = 'admin'`

## 🆘 Se Ainda Não Funcionar

1. **Verifique as políticas ativas:**
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'bars';
```

2. **Teste a função is_admin diretamente:**
```sql
SELECT public.is_admin(auth.uid()) as sou_admin;
```

3. **Verifique se a função existe:**
```sql
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'is_admin';
```

4. **Veja os logs do console do navegador** quando tentar deletar





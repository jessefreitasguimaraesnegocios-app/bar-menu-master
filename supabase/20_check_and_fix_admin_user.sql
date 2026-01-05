-- ============================================
-- VERIFICAR E CORRIGIR USUÁRIO ADMIN
-- ============================================
-- Execute este script para verificar se você é admin
-- e adicionar role de admin se necessário
-- ============================================

-- 1. Verificar usuários e suas roles
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  ur.role,
  ur.created_at as role_created_at,
  CASE 
    WHEN ur.role = 'admin' THEN '✅ É ADMIN'
    WHEN ur.role IS NULL THEN '❌ SEM ROLE'
    ELSE '⚠️ ROLE: ' || ur.role
  END as status
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
ORDER BY u.created_at DESC;

-- 2. Verificar se a função is_admin funciona para cada usuário
SELECT 
  u.id,
  u.email,
  public.is_admin(u.id) as is_admin_check
FROM auth.users u
ORDER BY u.created_at DESC;

-- 3. INSTRUÇÕES PARA ADICIONAR ADMIN:
-- Substitua 'SEU-EMAIL-AQUI' pelo seu email e execute:

/*
-- Primeiro, encontre seu user_id:
SELECT id, email FROM auth.users WHERE email = 'SEU-EMAIL-AQUI';

-- Depois, adicione role de admin (substitua UUID pelo seu user_id):
INSERT INTO public.user_roles (user_id, role)
VALUES ('UUID-DO-SEU-USUARIO-AQUI', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Verifique se foi adicionado:
SELECT * FROM public.user_roles WHERE user_id = 'UUID-DO-SEU-USUARIO-AQUI';
*/

-- 4. Função auxiliar para adicionar admin por email
CREATE OR REPLACE FUNCTION add_admin_by_email(user_email TEXT)
RETURNS TABLE(user_id UUID, email TEXT, role TEXT, success BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_user_id UUID;
BEGIN
  -- Buscar user_id pelo email
  SELECT id INTO found_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF found_user_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, user_email, NULL::TEXT, FALSE;
    RETURN;
  END IF;
  
  -- Adicionar role de admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (found_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Retornar resultado
  RETURN QUERY
  SELECT 
    found_user_id,
    user_email,
    'admin'::TEXT,
    TRUE;
END;
$$;

-- 5. USO DA FUNÇÃO:
-- Execute substituindo pelo seu email:
-- SELECT * FROM add_admin_by_email('seu-email@exemplo.com');

-- 6. Verificar políticas ativas
SELECT 
  'Políticas de bars:' as info,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'INSERT' THEN with_check
    WHEN cmd = 'UPDATE' THEN qual || ' | ' || with_check
    WHEN cmd = 'DELETE' THEN qual
  END as condition
FROM pg_policies
WHERE tablename = 'bars'
ORDER BY cmd;


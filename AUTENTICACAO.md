# 🔐 Guia de Autenticação - Cardápio Digital

## 📁 Estrutura de Arquivos

### Arquivos Criados/Modificados:

```
src/
├── contexts/
│   └── AuthContext.tsx          ← Contexto de autenticação (NOVO)
├── components/
│   ├── ProtectedRoute.tsx       ← Componente para proteger rotas (NOVO)
│   └── Header.tsx               ← Atualizado para mostrar link apenas quando logado
├── pages/
│   ├── Login.tsx                ← Tela de login para o dono (NOVO)
│   └── OwnerPortal.tsx         ← Já existia, agora protegido
└── App.tsx                      ← Atualizado com AuthProvider e rotas
```

## 🚀 Como Funciona

### 1. **Cardápio Público** (Sem Login)
- Rotas `/` e `/menu` são **públicas**
- Qualquer pessoa pode acessar via QR Code
- Não precisa de autenticação

### 2. **Login do Dono**
- Rota `/login` - Tela de login exclusiva para proprietários
- Usa Supabase Auth
- Valida se `user_metadata.role === 'owner'`

### 3. **Portal do Dono Protegido**
- Rota `/owner` - **Protegida**
- Se não estiver logado como owner → redireciona para `/`
- Se estiver logado → mostra o portal

### 4. **Header Inteligente**
- Link "Portal do Dono" só aparece quando o dono está logado
- Botão "Sair" aparece quando logado

## ⚙️ Configuração no Supabase

### 1. Criar Usuário Owner

No Supabase Dashboard:

1. Vá em **Authentication** → **Users**
2. Clique em **Add User** → **Create new user**
3. Preencha email e senha
4. Em **User Metadata**, adicione:
   ```json
   {
     "role": "owner"
   }
   ```

### 2. Verificar Políticas RLS

As políticas RLS já estão configuradas no `schema.sql`:
- **SELECT**: Público (qualquer um pode ver itens ativos)
- **INSERT/UPDATE/DELETE**: Apenas autenticados

## 📝 Fluxo de Uso

### Para o Cliente (QR Code):
1. Escaneia QR Code
2. Acessa `/menu` diretamente
3. Vê o cardápio completo
4. **Nunca precisa fazer login**

### Para o Dono:
1. Acessa `/login`
2. Faz login com email/senha
3. Se `role === 'owner'` → entra
4. Se não for owner → erro de acesso negado
5. Após login → redireciona para `/owner`
6. Pode gerenciar o cardápio
7. Clica em "Sair" quando terminar

## 🔒 Segurança

- ✅ Cardápio público (sem autenticação)
- ✅ Portal protegido (apenas owners)
- ✅ Validação de role no login
- ✅ Redirecionamento automático
- ✅ RLS no banco de dados

## 🐛 Troubleshooting

### "Acesso negado" no login
- Verifique se o usuário tem `user_metadata.role === 'owner'` no Supabase

### Não redireciona para /owner
- Verifique se o Supabase está conectado
- Verifique o console do navegador para erros

### Link "Portal do Dono" não aparece
- Faça login primeiro
- Verifique se o usuário tem role 'owner'





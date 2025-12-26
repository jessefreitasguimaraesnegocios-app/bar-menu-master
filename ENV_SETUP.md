# 🔐 Configuração de Variáveis de Ambiente

## 📋 Arquivos

- `.env` - Suas credenciais (NÃO commitar no Git)
- `.env.example` - Template de exemplo (pode commitar)

## 🚀 Como Configurar

### 1. Criar arquivo .env

Na raiz do projeto, crie um arquivo chamado `.env`:

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

### 2. Preencher Credenciais

Abra o arquivo `.env` e preencha com suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**Onde encontrar:**
- **URL**: Supabase Dashboard → Settings → API → Project URL
- **Anon Key**: Supabase Dashboard → Settings → API → Project API keys → anon/public

### 3. Reiniciar o Servidor

Após criar/editar o `.env`, reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

## 🔒 Segurança

### ⚠️ Importante sobre Frontend

**No frontend (React/Vite), as variáveis de ambiente são expostas no bundle final.**

Porém, isso é **SEGURO** para o Supabase porque:

1. ✅ A **chave anônima (anon key)** é projetada para ser pública
2. ✅ As **políticas RLS (Row Level Security)** protegem os dados
3. ✅ Apenas operações permitidas pelas políticas serão executadas
4. ✅ A chave anônima não permite operações administrativas

### 🛡️ O que NÃO fazer

- ❌ **NUNCA** use a **service_role key** no frontend (ela ignora RLS)
- ❌ **NUNCA** commite o arquivo `.env` no Git
- ✅ Use apenas a **anon/public key** no frontend

### 📝 Boas Práticas

1. ✅ Use `.env` para desenvolvimento local
2. ✅ Use `.env.example` como template (sem credenciais reais)
3. ✅ Configure variáveis de ambiente no servidor de produção (Vercel, Netlify, etc.)
4. ✅ Mantenha `.env` no `.gitignore`

## 🌐 Deploy em Produção

### Vercel
1. Vá em Settings → Environment Variables
2. Adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Faça redeploy

### Netlify
1. Vá em Site settings → Environment variables
2. Adicione as mesmas variáveis
3. Faça redeploy

### Outros
Configure as variáveis de ambiente conforme a documentação da sua plataforma.

## 🔄 Prioridade de Configuração

O sistema usa as credenciais nesta ordem:

1. **Variáveis de ambiente** (`.env` ou do servidor) ← **Recomendado**
2. **localStorage** (conexão manual via diálogo) ← Fallback

## ✅ Verificação

Após configurar, verifique se está funcionando:

1. Abra o console do navegador
2. Acesse o Portal do Dono
3. O sistema deve conectar automaticamente ao Supabase
4. Não deve aparecer o diálogo de conexão manual







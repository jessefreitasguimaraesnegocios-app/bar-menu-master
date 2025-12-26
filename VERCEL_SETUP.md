# 🚀 Configuração na Vercel

## ⚠️ IMPORTANTE: Variáveis de Ambiente

Para que os dados do Supabase apareçam em produção, você **DEVE** configurar as variáveis de ambiente na Vercel.

## 📋 Passo a Passo

### 1. Acesse o Dashboard da Vercel

1. Vá para [vercel.com](https://vercel.com)
2. Faça login e selecione seu projeto `bar-menu-master`

### 2. Configure as Variáveis de Ambiente

1. No projeto, vá em **Settings** → **Environment Variables**
2. Adicione as seguintes variáveis:

#### Variável 1:
- **Name**: `VITE_SUPABASE_URL`
- **Value**: `https://kpkibonznmsufafyxvqt.supabase.co` (sua URL do Supabase)
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### Variável 2:
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: Sua chave anon do Supabase (encontre em: Supabase Dashboard → Settings → API → anon/public key)
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

### 3. Onde Encontrar as Credenciais

**No Supabase Dashboard:**
1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### 4. Fazer Redeploy

Após adicionar as variáveis:

1. Vá em **Deployments**
2. Clique nos três pontos (⋯) do último deploy
3. Selecione **Redeploy**
4. Ou faça um novo commit e push (a Vercel detecta automaticamente)

### 5. Verificar se Funcionou

1. Acesse seu site na Vercel
2. Abra o console do navegador (F12)
3. Verifique se não há erros de "Supabase não está conectado"
4. Os itens do cardápio devem aparecer automaticamente

## 🔍 Troubleshooting

### Problema: Itens não aparecem em produção

**Solução:**
1. ✅ Verifique se as variáveis estão configuradas na Vercel
2. ✅ Verifique se fez redeploy após adicionar as variáveis
3. ✅ Verifique se os nomes das variáveis estão corretos (case-sensitive)
4. ✅ Verifique o console do navegador para erros

### Problema: Funciona localmente mas não em produção

**Causa:** Variáveis de ambiente não configuradas na Vercel

**Solução:** Siga os passos acima para configurar

### Problema: Erro "Bucket not found"

**Solução:** Crie o bucket `background-images` no Supabase Storage (veja `supabase/BACKGROUND_IMAGES_SETUP.md`)

## ✅ Checklist

- [ ] Variável `VITE_SUPABASE_URL` configurada na Vercel
- [ ] Variável `VITE_SUPABASE_ANON_KEY` configurada na Vercel
- [ ] Variáveis marcadas para Production, Preview e Development
- [ ] Redeploy feito após configurar variáveis
- [ ] Tabela `menu_items` criada no Supabase
- [ ] Políticas RLS configuradas (público pode ler)
- [ ] Testado em produção e funcionando

## 📝 Nota Importante

**As variáveis de ambiente são OBRIGATÓRIAS em produção!**

Sem elas, o app não consegue conectar ao Supabase e usa apenas dados estáticos (fallback).




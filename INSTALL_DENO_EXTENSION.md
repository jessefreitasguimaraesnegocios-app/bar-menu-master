# 🦕 Como Instalar a Extensão Deno no VS Code

Siga estes passos simples para instalar a extensão Deno e eliminar os "12 problems" das Edge Functions:

## 📥 Passo 1: Abrir o Painel de Extensões

**Método 1 - Atalho de Teclado:**
- Pressione `Ctrl+Shift+X` (Windows/Linux)
- Ou `Cmd+Shift+X` (Mac)

**Método 2 - Menu:**
- Clique no ícone de **Extensões** na barra lateral esquerda (4 quadrados)
- Ou vá em `View` → `Extensions`

## 🔍 Passo 2: Procurar pela Extensão Deno

1. Na barra de pesquisa no topo do painel de extensões, digite: **`Deno`**
2. Procure pela extensão oficial: **"Deno"** por **Deno Land Inc.**
3. A extensão deve ter:
   - 🦕 Ícone do dinossauro do Deno
   - Autor: **Deno Land Inc.**
   - Categoria: Programming Languages

## ✅ Passo 3: Instalar a Extensão

1. Clique no botão **"Install"** (Instalar)
2. Aguarde alguns segundos para a instalação completar

## ⚙️ Passo 4: Ativar para o Workspace

1. Após a instalação, você pode receber uma notificação
2. Se aparecer: **"Enable Deno for this workspace?"** → Clique em **"Yes"** ou **"Allow"**
3. Se não aparecer automaticamente, não se preocupe - já está configurado!

## 🎯 Passo 5: Verificar se Funcionou

1. **Recarregue o VS Code:**
   - Pressione `Ctrl+Shift+P` (ou `Cmd+Shift+P`)
   - Digite: `Developer: Reload Window`
   - Pressione Enter

2. **Ou simplesmente:**
   - Feche e reabra o VS Code

3. **Verifique os arquivos:**
   - Abra `supabase/functions/create-payment/index.ts`
   - Abra `supabase/functions/mp-webhook/index.ts`
   - Os erros TypeScript devem ter desaparecido! ✅

## ✅ O Que Deve Funcionar Agora

Após instalar a extensão, o VS Code reconhecerá:
- ✅ `Deno.env.get()` - Variáveis de ambiente do Deno
- ✅ `import { serve } from "https://deno.land/std/..."` - Importações HTTP
- ✅ `import { createClient } from "npm:@supabase/..."` - Importações npm no Deno
- ✅ Todas as APIs nativas do Deno

## 🔄 Se os Erros Ainda Aparecerem

1. **Recarregue o VS Code completamente:**
   - Feche todas as janelas
   - Reabra o VS Code

2. **Verifique se a extensão está ativa:**
   - Vá em Extensions
   - Procure "Deno"
   - Deve mostrar "Installed" e estar habilitada

3. **Verifique o ícone na barra inferior:**
   - Deve aparecer um ícone do Deno na barra de status (canto inferior direito)

## 📝 Importante

- A extensão Deno **só afeta** os arquivos dentro de `supabase/functions/`
- O resto do projeto (React/TypeScript) continua funcionando normalmente
- Isso é o comportamento esperado e correto!

## 🎉 Pronto!

Após instalar a extensão Deno, os "12 problems" devem desaparecer completamente!

Se tiver alguma dúvida ou os erros persistirem, me avise! 🚀

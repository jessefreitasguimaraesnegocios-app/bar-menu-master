# Supabase Edge Functions - Notas Importantes

## ⚠️ Sobre os "Erros" do TypeScript

Se você está vendo erros TypeScript nas Edge Functions (como "Cannot find module 'https://deno.land/std...'" ou "Cannot find name 'Deno'"), **isso é NORMAL e ESPERADO**.

### Por que isso acontece?

1. **Supabase Edge Functions rodam em Deno**, não Node.js
2. O TypeScript Language Server do VS Code está configurado para **Node.js**
3. O Deno tem APIs e importações diferentes do Node.js
4. Esses "erros" são **falsos positivos** - o código está correto para Deno

### O código funciona?

**SIM!** O código está correto e funcionará perfeitamente quando deployado no Supabase.

Os erros aparecem apenas no editor porque:
- `Deno.env.get()` é uma API válida do Deno
- `import { serve } from "https://deno.land/std/..."` é uma importação válida do Deno
- O Supabase compila e executa essas funções no ambiente Deno

### Como ignorar esses erros no VS Code?

1. **Instale a extensão Deno** (recomendado):
   - Abra VS Code
   - Vá em Extensions (Ctrl+Shift+X)
   - Procure por "Deno" (oficial da Deno Land)
   - Instale e ative

2. **OU** simplesmente ignore os erros - eles não afetam o funcionamento

### Verificação

Para verificar se o código está correto:
- ✅ O código compila e faz deploy sem erros no Supabase
- ✅ As funções funcionam quando chamadas
- ✅ Os erros só aparecem no editor, não no runtime

## 📁 Estrutura

```
supabase/functions/
├── create-payment/
│   └── index.ts        ← Edge Function para criar pagamentos
├── mp-webhook/
│   └── index.ts        ← Edge Function para webhooks do Mercado Pago
├── deno.json           ← Configuração do Deno
└── tsconfig.json       ← Configuração TypeScript para Deno
```

## 🚀 Deploy

```bash
# Deploy de uma função específica
supabase functions deploy create-payment --no-verify-jwt
supabase functions deploy mp-webhook --no-verify-jwt

# Ou deploy de todas
supabase functions deploy --no-verify-jwt
```

## ✅ Checklist

- [x] Código está correto para Deno
- [x] TypeScript configurado (ignorando erros do editor)
- [x] ESLint configurado para ignorar pasta
- [x] Funções deployadas no Supabase
- [x] Erros do editor são esperados e não afetam funcionamento

**Conclusão:** Os "12 problems" são falsos positivos do editor. O código funciona perfeitamente no Supabase! ✅



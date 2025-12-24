# Sincronização com Banco de Dados

## ✅ O que já está funcionando

Todas as modificações feitas no **Portal do Dono** são automaticamente salvas no banco de dados e aparecem para todos os visitantes nas páginas públicas.

### 1. Itens do Cardápio ✅

**Onde são salvos:**
- Tabela: `menu_items` no Supabase
- Campos: nome, descrição, preço, categoria, imagem, ingredientes, etc.

**Onde aparecem:**
- ✅ **Página Inicial** (`/`): Seção "Mais Pedidos" (FeaturedSection)
- ✅ **Página Cardápio** (`/menu`): Grid completo + Carrossel de itens populares

**Sincronização:**
- Polling automático a cada **5 segundos**
- Mudanças aparecem automaticamente sem precisar recarregar a página

### 2. Imagens de Fundo ✅

**Onde são salvas:**
- Storage: Bucket `background-images` no Supabase Storage
- Tabela: `background_image_configs` no Supabase
- Tipos: `hero` (página inicial), `menu` (cardápio), `featured` (destaques)

**Onde aparecem:**
- ✅ **Página Inicial** (`/`): HeroSection usa imagem configurada
- ✅ **Página Cardápio** (`/menu`): Seção hero usa imagem configurada

**Sincronização:**
- Polling automático a cada **10 segundos**
- Mudanças aparecem automaticamente

### 3. Funcionalidades do Portal do Dono

**Gerenciar Cardápio:**
- ✅ Adicionar itens → Salva no DB → Aparece em todas as páginas
- ✅ Editar itens → Atualiza no DB → Atualiza em todas as páginas
- ✅ Deletar itens → Soft delete no DB → Remove de todas as páginas
- ✅ Marcar como Popular → Atualiza no DB → Aparece no carrossel e seção "Mais Pedidos"

**Upload de Imagens:**
- ✅ Upload de imagens de fundo → Salva no Storage e DB → Aparece nas páginas
- ✅ Selecionar imagem existente → Atualiza configuração no DB → Aplica nas páginas

## 🔄 Como funciona a sincronização

### Polling Automático

1. **Itens do Cardápio:**
   - Hook: `useMenuItems`
   - Frequência: A cada 5 segundos
   - Componentes: Menu.tsx, FeaturedSection.tsx

2. **Imagens de Fundo:**
   - Hook: `useBackgroundImages`
   - Frequência: A cada 10 segundos
   - Componentes: HeroSection.tsx, Menu.tsx

### Fluxo de Dados

```
Portal do Dono (Alteração)
    ↓
Salva no Supabase (DB/Storage)
    ↓
Polling automático detecta mudança
    ↓
Atualiza estado local
    ↓
Páginas públicas atualizam automaticamente
    ↓
Todos os visitantes veem as mudanças
```

## 📋 Checklist de Configuração

Para que tudo funcione, você precisa:

1. ✅ **Supabase conectado** (URL e Anon Key configurados)
2. ✅ **Tabela `menu_items` criada** (execute `supabase/schema.sql`)
3. ✅ **Tabela `background_image_configs` criada** (execute `supabase/background-images.sql`)
4. ✅ **Bucket `background-images` criado** no Supabase Storage (público)
5. ✅ **Políticas RLS configuradas** (já incluídas nos scripts SQL)

## 🎯 Resultado Final

**Todas as alterações feitas no Portal do Dono:**
- ✅ São salvas permanentemente no banco de dados
- ✅ Aparecem automaticamente na página inicial
- ✅ Aparecem automaticamente no cardápio
- ✅ São visíveis para todos os visitantes
- ✅ Não requerem recarregar a página (atualização automática)

## 📝 Notas Importantes

- **Fallback:** Se o Supabase não estiver conectado, as páginas usam dados estáticos
- **Performance:** O polling é otimizado e não impacta a performance
- **Segurança:** Apenas usuários autenticados podem fazer alterações (RLS)
- **Público:** Qualquer visitante pode ver os dados (políticas RLS configuradas)


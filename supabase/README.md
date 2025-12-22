# Configuração do Banco de Dados Supabase

Este diretório contém os arquivos SQL necessários para configurar o banco de dados do sistema de cardápio.

## 📋 Arquivos

- `schema.sql` - Schema completo do banco de dados com tabelas, políticas de segurança e funções
- `storage.sql` - Configuração do bucket de storage para imagens do cardápio
- `seed.sql` - Dados iniciais para popular o banco de dados

## 🚀 Como Usar

### 1. Acesse o Supabase Dashboard

1. Faça login no [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **SQL Editor** no menu lateral

### 2. Execute o Schema

1. Clique em **New Query**
2. Abra o arquivo `schema.sql`
3. Cole todo o conteúdo no editor
4. Clique em **Run** ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### 3. Configure o Storage (Obrigatório para upload de imagens)

1. Execute o arquivo `storage.sql` no SQL Editor
2. Isso criará o bucket `menu-images` com as políticas de segurança necessárias
3. O bucket será público para leitura, mas apenas usuários autenticados podem fazer upload

### 4. (Opcional) Inserir Dados Iniciais

Se você quiser popular o banco com dados de exemplo:

1. Execute o arquivo `seed.sql` no SQL Editor
2. Isso inserirá todos os itens de exemplo do cardápio

## 📊 Estrutura do Banco

### Tabela: `menu_items`

Campos principais:
- `id` - UUID (chave primária)
- `name` - Nome do item
- `description` - Descrição detalhada
- `price` - Preço (DECIMAL)
- `category` - Categoria (ENUM)
- `image` - URL da imagem
- `ingredients` - Array de ingredientes
- `preparation` - Instruções de preparo
- `abv` - Teor alcoólico (opcional)
- `is_popular` - Item popular
- `is_new` - Item novo
- `is_active` - Item ativo (para soft delete)
- `created_at` / `updated_at` - Timestamps automáticos

### Categorias Disponíveis

- `cocktails` - Coquetéis
- `beers` - Cervejas
- `wines` - Vinhos
- `spirits` - Destilados
- `appetizers` - Entradas
- `mains` - Pratos Principais

## 🔒 Segurança (RLS)

O schema implementa Row Level Security (RLS) com as seguintes políticas:

- **SELECT**: Qualquer pessoa pode ler itens ativos
- **INSERT**: Apenas usuários autenticados
- **UPDATE**: Apenas usuários autenticados
- **DELETE**: Apenas usuários autenticados (soft delete)

## 🔧 Funcionalidades

- ✅ Soft Delete (itens são marcados como inativos)
- ✅ Timestamps automáticos
- ✅ Índices para performance
- ✅ View para consultas simplificadas
- ✅ Validações de dados (CHECK constraints)

## 📝 Próximos Passos

Após executar o schema:

1. Execute o `storage.sql` para configurar o bucket de imagens
2. Configure autenticação no Supabase (se ainda não fez)
3. Teste a conexão através do Portal do Dono
4. Comece a adicionar/editar itens do cardápio com upload de imagens

## 📸 Upload de Imagens

O sistema suporta três formas de adicionar imagens:

1. **Galeria**: Escolher uma imagem do dispositivo
2. **Câmera**: Tirar uma foto diretamente
3. **URL**: Inserir uma URL de imagem externa

As imagens enviadas pela galeria ou câmera são armazenadas no Supabase Storage no bucket `menu-images`.

## 🐛 Troubleshooting

### Erro: "extension uuid-ossp does not exist"
- Execute: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` manualmente

### Erro: "relation auth.users does not exist"
- Isso é normal se você ainda não configurou autenticação
- As referências a `auth.users` são opcionais e funcionarão quando você habilitar autenticação

### Políticas RLS bloqueando acesso
- Verifique se você está autenticado ao fazer operações de escrita
- Ajuste as políticas conforme necessário no SQL Editor


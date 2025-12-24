# Configuração de Imagens de Fundo

## Passo 1: Criar o Bucket no Supabase Storage

1. Acesse o dashboard do Supabase
2. Vá em **Storage** no menu lateral
3. Clique em **New bucket**
4. Configure:
   - **Name**: `background-images`
   - **Public bucket**: ✅ Marque como público
   - **File size limit**: 5MB (ou o valor desejado)
   - **Allowed MIME types**: `image/*`
5. Clique em **Create bucket**

## Passo 2: Configurar Políticas de Acesso

No bucket `background-images`, configure as políticas:

### Política de Leitura (Pública)
```sql
-- Qualquer pessoa pode ler
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'background-images');
```

### Política de Upload (Autenticados)
```sql
-- Apenas usuários autenticados podem fazer upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'background-images' 
  AND auth.role() = 'authenticated'
);
```

## Passo 3: Executar o Schema SQL

1. Acesse o **SQL Editor** no Supabase
2. Execute o arquivo `supabase/background-images.sql`
3. Isso criará a tabela `background_image_configs`

## Passo 4: Usar no Portal do Dono

1. Acesse o Portal do Dono (`/owner`)
2. Clique no card **"Upload de Imagens"**
3. Selecione a página (Página Inicial, Cardápio ou Destaques)
4. Faça upload de uma imagem ou selecione uma existente
5. A imagem será aplicada automaticamente na página correspondente

## Tipos de Imagens de Fundo

- **hero**: Imagem de fundo da página inicial (HeroSection)
- **menu**: Imagem de fundo da seção hero do cardápio
- **featured**: Imagem de fundo da seção de destaques (futuro)

## Notas

- As imagens são armazenadas no Supabase Storage
- As configurações são salvas na tabela `background_image_configs`
- As páginas atualizam automaticamente quando uma nova imagem é selecionada
- O sistema faz polling a cada 10 segundos para verificar atualizações


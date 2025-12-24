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

### Política de Upload (Pública - Recomendado para Portal do Dono)
```sql
-- Permite upload público para o bucket background-images
-- Use esta política se o portal do dono não usa autenticação
CREATE POLICY "Public upload to background-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'background-images');
```

### Política de Upload Alternativa (Apenas Autenticados)
```sql
-- Use esta política apenas se você tiver autenticação configurada
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'background-images' 
  AND auth.role() = 'authenticated'
);
```

### Políticas Adicionais (Opcional)
```sql
-- Permite atualizar arquivos (necessário se usar upsert: true)
CREATE POLICY "Public update background-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'background-images')
WITH CHECK (bucket_id = 'background-images');

-- Permite deletar arquivos (se você implementar remoção de imagens)
CREATE POLICY "Public delete background-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'background-images');
```

**Nota:** Se você receber erro 409 ou 403 ao fazer upload, use as políticas públicas acima (INSERT, UPDATE, DELETE).

## Passo 3: Executar o Schema SQL

1. Acesse o **SQL Editor** no Supabase
2. Execute o arquivo `supabase/background-images.sql`
3. Isso criará a tabela `background_image_configs` com políticas públicas

**Importante:** O arquivo SQL já inclui políticas públicas que permitem inserção/atualização sem autenticação. Se você quiser usar autenticação, comente a política pública e descomente a política de autenticação no arquivo SQL.

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

## Solução de Problemas

### Erro 409 ou 403 ao selecionar imagem

Se você receber erro 409 (Conflict) ou 403 (Forbidden) ao tentar selecionar uma imagem:

1. A tabela pode ter sido criada com políticas que requerem autenticação
2. Execute o script `supabase/fix-background-images-policies.sql` no SQL Editor do Supabase
3. Isso removerá a política antiga e criará uma política pública

**Ou execute manualmente no SQL Editor:**
```sql
DROP POLICY IF EXISTS "Authenticated users can manage background images" ON background_image_configs;

CREATE POLICY "Public can manage background images"
  ON background_image_configs
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

## Notas

- As imagens são armazenadas no Supabase Storage
- As configurações são salvas na tabela `background_image_configs`
- As páginas atualizam automaticamente quando uma nova imagem é selecionada
- O sistema faz polling a cada 10 segundos para verificar atualizações


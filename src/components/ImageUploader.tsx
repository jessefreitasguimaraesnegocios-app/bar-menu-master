import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  error?: string;
  bucket?: string;
  folder?: string;
}

const ImageUploader = ({ value, onChange, error, bucket = 'menu-images', folder = 'uploads' }: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(value);
  const [uploadMode, setUploadMode] = useState<'gallery' | 'camera' | 'url'>(() => {
    // Se já tem uma URL que não é do storage, assume que é URL externa
    return (value && !value.includes('/storage/v1/object/public/')) ? 'url' : 'gallery';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    const client = getSupabaseClient();
    if (!client) {
      toast({
        title: 'Erro',
        description: 'Supabase não está conectado. Você pode inserir uma URL diretamente.',
        variant: 'destructive',
      });
      setUploadMode('url');
      return;
    }

    setUploading(true);

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Fazer upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await client.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = client.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        const publicUrl = urlData.publicUrl;
        setImageUrl(publicUrl);
        onChange(publicUrl);
        toast({
          title: 'Sucesso',
          description: 'Imagem enviada com sucesso!',
        });
      } else {
        throw new Error('Não foi possível obter a URL pública da imagem');
      }
    } catch (err: any) {
      console.error('Error uploading image:', err);
      toast({
        title: 'Erro ao fazer upload',
        description: err.message || 'Não foi possível fazer upload da imagem. Tente usar uma URL.',
        variant: 'destructive',
      });
      setUploadMode('url');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndUploadFile(file);
      // Limpar o input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const validateAndUploadFile = (file: File) => {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um arquivo de imagem válido.',
        variant: 'destructive',
      });
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A imagem deve ter no máximo 5MB.',
        variant: 'destructive',
      });
      return;
    }

    handleFileUpload(file);
  };

  const handleCameraClick = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndUploadFile(file);
      // Limpar o input para permitir tirar outra foto
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
    }
  };

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    onChange(url);
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant={uploadMode === 'gallery' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMode('gallery')}
          disabled={uploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          Galeria
        </Button>
        <Button
          type="button"
          variant={uploadMode === 'camera' ? 'default' : 'outline'}
          size="sm"
          onClick={handleCameraClick}
          disabled={uploading}
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          Câmera
        </Button>
        <Button
          type="button"
          variant={uploadMode === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMode('url')}
          disabled={uploading}
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          URL
        </Button>
      </div>

      {uploadMode === 'url' ? (
        <div className="space-y-2">
          <Label htmlFor="image-url">URL da Imagem</Label>
          <Input
            id="image-url"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            disabled={uploading}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          <Input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraChange}
            disabled={uploading}
            className="hidden"
          />
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Enviando...</span>
            </div>
          )}
          {uploadMode === 'gallery' && (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Selecionar da Galeria
            </Button>
          )}
          {uploadMode === 'camera' && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCameraClick}
              disabled={uploading}
              className="w-full"
            >
              <Camera className="w-4 h-4 mr-2" />
              Abrir Câmera
            </Button>
          )}
        </div>
      )}

      {/* Preview da Imagem */}
      {imageUrl && (
        <div className="relative">
          <div className="relative rounded-lg overflow-hidden border border-border/50">
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-48 object-cover"
              onError={() => {
                toast({
                  title: 'Erro',
                  description: 'Não foi possível carregar a imagem. Verifique a URL.',
                  variant: 'destructive',
                });
              }}
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemoveImage}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Mensagem de Erro */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

export default ImageUploader;

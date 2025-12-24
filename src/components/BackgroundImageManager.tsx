import { useState, useEffect } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getSupabaseClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

type BackgroundImageType = 'hero' | 'menu' | 'featured';

interface BackgroundImage {
  id: string;
  type: BackgroundImageType;
  url: string;
  name: string;
  created_at: string;
}

const BackgroundImageManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<BackgroundImage[]>([]);
  const [selectedType, setSelectedType] = useState<BackgroundImageType>('hero');
  const [currentImages, setCurrentImages] = useState<Record<BackgroundImageType, string | null>>({
    hero: null,
    menu: null,
    featured: null,
  });
  const [bucketError, setBucketError] = useState(false);
  const { toast } = useToast();

  const fetchImages = async () => {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      // Buscar imagens do storage
      const { data: files, error } = await client.storage
        .from('background-images')
        .list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;

      // Buscar configurações atuais
      const { data: configs, error: configError } = await client
        .from('background_image_configs')
        .select('*');

      if (!configError && configs) {
        const configMap: Record<BackgroundImageType, string | null> = {
          hero: null,
          menu: null,
          featured: null,
        };
        configs.forEach((config: any) => {
          configMap[config.type as BackgroundImageType] = config.image_url;
        });
        setCurrentImages(configMap);
      }

      // Transformar arquivos em BackgroundImage
      const imageList: BackgroundImage[] = (files || []).map((file) => {
        const { data: urlData } = client.storage
          .from('background-images')
          .getPublicUrl(file.name);

        return {
          id: file.name, // Usar nome do arquivo como ID
          type: 'hero' as BackgroundImageType, // Default, será atualizado
          url: urlData.publicUrl,
          name: file.name,
          created_at: file.created_at || new Date().toISOString(),
        };
      });

      setImages(imageList);
      setBucketError(false);
    } catch (error: any) {
      console.error('Error fetching images:', error);
      
      // Verificar se o erro é de bucket não encontrado
      if (error?.message?.includes('Bucket not found') || error?.message?.includes('bucket')) {
        setBucketError(true);
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as imagens.',
          variant: 'destructive',
          duration: 6000,
        });
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um arquivo de imagem.',
        variant: 'destructive',
      });
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A imagem deve ter no máximo 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    const client = getSupabaseClient();
    if (!client) {
      toast({
        title: 'Erro',
        description: 'Supabase não está conectado.',
        variant: 'destructive',
      });
      setUploading(false);
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedType}_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload para Supabase Storage
      const { error: uploadError } = await client.storage
        .from('background-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Permite sobrescrever se o arquivo já existir
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = client.storage
        .from('background-images')
        .getPublicUrl(filePath);

      // Salvar configuração - verificar se existe e fazer update ou insert
      // Como 'type' é UNIQUE, precisamos tratar o caso de já existir
      const { data: existingConfig } = await client
        .from('background_image_configs')
        .select('id')
        .eq('type', selectedType)
        .single();

      let configError;
      if (existingConfig) {
        // Se existe, fazer UPDATE
        const { error } = await client
          .from('background_image_configs')
          .update({
            image_url: urlData.publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('type', selectedType);
        configError = error;
      } else {
        // Se não existe, fazer INSERT
        const { error } = await client
          .from('background_image_configs')
          .insert({
            type: selectedType,
            image_url: urlData.publicUrl,
            updated_at: new Date().toISOString(),
          });
        configError = error;
      }

      if (configError) throw configError;

      toast({
        title: 'Sucesso',
        description: 'Imagem de fundo atualizada com sucesso!',
      });

      await fetchImages();
    } catch (error: any) {
      console.error('Error uploading image:', error);
      
      let errorMessage = 'Não foi possível fazer upload da imagem.';
      
      // Verificar tipo de erro específico
      const errorStatus = error?.status || error?.statusCode;
      const errorMsg = error?.message || '';
      
      if (errorStatus === 409 || errorMsg.includes('409') || errorMsg.toLowerCase().includes('conflict')) {
        errorMessage = 'Arquivo já existe ou há conflito. Tente novamente ou verifique as políticas de storage no Supabase.';
      } else if (errorMsg.includes('Bucket not found') || 
                 errorMsg.includes('bucket') ||
                 errorMsg.toLowerCase().includes('bucket not found')) {
        setBucketError(true); // Ativar o alerta detalhado
        errorMessage = 'Bucket "background-images" não encontrado. Por favor, crie o bucket no Supabase Storage primeiro. Veja as instruções abaixo.';
      } else if (errorStatus === 403 || errorMsg.includes('403') || errorMsg.toLowerCase().includes('permission')) {
        errorMessage = 'Permissão negada. Verifique se as políticas de storage estão configuradas corretamente no Supabase.';
      } else if (errorMsg) {
        errorMessage = `Erro: ${errorMsg}`;
      }
      
      toast({
        title: 'Erro no Upload',
        description: errorMessage,
        variant: 'destructive',
        duration: 8000, // Mostrar por mais tempo
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSelectImage = async (url: string) => {
    const client = getSupabaseClient();
    if (!client) {
      toast({
        title: 'Erro',
        description: 'Supabase não está conectado.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Verificar se existe configuração para este tipo
      const { data: existingConfig } = await client
        .from('background_image_configs')
        .select('id')
        .eq('type', selectedType)
        .single();

      let error;
      if (existingConfig) {
        // Se existe, fazer UPDATE
        const { error: updateError } = await client
          .from('background_image_configs')
          .update({
            image_url: url,
            updated_at: new Date().toISOString(),
          })
          .eq('type', selectedType);
        error = updateError;
      } else {
        // Se não existe, fazer INSERT
        const { error: insertError } = await client
          .from('background_image_configs')
          .insert({
            type: selectedType,
            image_url: url,
            updated_at: new Date().toISOString(),
          });
        error = insertError;
      }

      if (error) throw error;

      setCurrentImages((prev) => ({
        ...prev,
        [selectedType]: url,
      }));

      toast({
        title: 'Sucesso',
        description: 'Imagem de fundo selecionada!',
      });
    } catch (error: any) {
      console.error('Error selecting image:', error);
      
      let errorMessage = 'Não foi possível selecionar a imagem.';
      const errorStatus = error?.status || error?.statusCode || error?.code;
      const errorMsg = error?.message || '';
      
      if (errorStatus === 409 || errorMsg.includes('409') || errorMsg.toLowerCase().includes('conflict')) {
        errorMessage = 'Erro de conflito. Verifique se as políticas da tabela background_image_configs estão configuradas corretamente no Supabase.';
      } else if (errorStatus === 403 || errorMsg.includes('403') || errorMsg.toLowerCase().includes('permission') || errorMsg.toLowerCase().includes('policy')) {
        errorMessage = 'Permissão negada. A tabela background_image_configs requer políticas públicas. Execute o SQL em supabase/background-images.sql com políticas públicas.';
      } else if (errorMsg) {
        errorMessage = `Erro: ${errorMsg}`;
      }
      
      toast({
        title: 'Erro ao Selecionar Imagem',
        description: errorMessage,
        variant: 'destructive',
        duration: 8000,
      });
    }
  };

  return (
    <>
      <Card
        className="glass border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <CardHeader>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <ImageIcon className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="font-serif text-xl">Upload de Imagens</CardTitle>
          <CardDescription>
            Adicione fotos incríveis para exibir suas bebidas e pratos
          </CardDescription>
        </CardHeader>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Imagens de Fundo</DialogTitle>
            <DialogDescription>
              Faça upload e configure imagens de fundo para as páginas do site
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Aviso de bucket não encontrado */}
            {bucketError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Bucket não encontrado</AlertTitle>
                <AlertDescription className="mt-2">
                  O bucket "background-images" não existe no Supabase Storage. 
                  <br />
                  <strong>Para resolver:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Acesse o dashboard do Supabase</li>
                    <li>Vá em <strong>Storage</strong> no menu lateral</li>
                    <li>Clique em <strong>New bucket</strong></li>
                    <li>Nome: <strong>background-images</strong></li>
                    <li>Marque como <strong>Público</strong></li>
                    <li>Clique em <strong>Create bucket</strong></li>
                  </ol>
                  <p className="mt-2 text-sm">
                    Veja instruções completas em: <code className="bg-muted px-1 rounded">supabase/BACKGROUND_IMAGES_SETUP.md</code>
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Seleção de tipo */}
            <div>
              <Label>Selecione a página</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                {(['hero', 'menu', 'featured'] as BackgroundImageType[]).map((type) => (
                  <Button
                    key={type}
                    variant={selectedType === type ? 'default' : 'outline'}
                    onClick={() => setSelectedType(type)}
                    className="capitalize"
                  >
                    {type === 'hero' ? 'Página Inicial' : type === 'menu' ? 'Cardápio' : 'Destaques'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Upload */}
            <div>
              <Label>Fazer upload de nova imagem</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="background-upload"
                />
                <Button
                  asChild
                  disabled={uploading}
                  className="w-full"
                >
                  <label htmlFor="background-upload" className="cursor-pointer">
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Fazer Upload
                      </>
                    )}
                  </label>
                </Button>
              </div>
            </div>

            {/* Lista de imagens */}
            <div>
              <Label>Imagens disponíveis</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-all"
                    onClick={() => handleSelectImage(image.url)}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-32 object-cover"
                    />
                    {currentImages[selectedType] === image.url && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Selecionar</span>
                    </div>
                  </div>
                ))}
              </div>
              {images.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma imagem disponível. Faça upload de uma imagem para começar.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BackgroundImageManager;


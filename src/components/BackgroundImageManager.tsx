import { useState, useEffect } from 'react';
import { ImagePlus, Loader2, CheckCircle2, Upload, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSupabaseClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import ImageUploader from './ImageUploader';

type BackgroundImageType = 'hero' | 'menu' | 'featured';

interface BackgroundImageConfig {
  type: BackgroundImageType;
  image_url: string;
}

const backgroundImageLabels: Record<BackgroundImageType, string> = {
  hero: 'Página Inicial',
  menu: 'Cardápio',
  featured: 'Destaques',
};

const BackgroundImageManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<BackgroundImageType>('hero');
  const [images, setImages] = useState<Record<BackgroundImageType, string>>({
    hero: '',
    menu: '',
    featured: '',
  });
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [saving, setSaving] = useState<Record<BackgroundImageType, boolean>>({
    hero: false,
    menu: false,
    featured: false,
  });
  const [showUpload, setShowUpload] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchImages();
      fetchAvailableImages();
    }
  }, [isOpen]);

  const fetchImages = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await client
        .from('background_image_configs')
        .select('*');

      if (error) throw error;

      const imageMap: Record<BackgroundImageType, string> = {
        hero: '',
        menu: '',
        featured: '',
      };

      if (data) {
        data.forEach((config: BackgroundImageConfig) => {
          imageMap[config.type] = config.image_url || '';
        });
      }

      setImages(imageMap);
    } catch (error) {
      console.error('Error fetching background images:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as imagens de fundo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableImages = async () => {
    const client = getSupabaseClient();
    if (!client) {
      return;
    }

    setLoadingGallery(true);
    try {
      const imageUrls: string[] = [];
      
      // Buscar na raiz
      const { data: rootData, error: rootError } = await client.storage
        .from('background-images')
        .list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (!rootError && rootData) {
        for (const file of rootData) {
          if (file.name && file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
            const { data: urlData } = client.storage
              .from('background-images')
              .getPublicUrl(file.name);
            
            if (urlData?.publicUrl) {
              imageUrls.push(urlData.publicUrl);
            }
          }
        }
      }

      // Buscar em subpastas comuns
      const folders = ['uploads', 'images', 'backgrounds'];
      for (const folder of folders) {
        try {
          const { data: folderData } = await client.storage
            .from('background-images')
            .list(folder, {
              limit: 100,
              sortBy: { column: 'created_at', order: 'desc' },
            });

          if (folderData) {
            for (const file of folderData) {
              if (file.name && file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
                const filePath = `${folder}/${file.name}`;
                const { data: urlData } = client.storage
                  .from('background-images')
                  .getPublicUrl(filePath);
                
                if (urlData?.publicUrl) {
                  imageUrls.push(urlData.publicUrl);
                }
              }
            }
          }
        } catch (e) {
          // Ignorar erros de pastas que não existem
        }
      }

      setAvailableImages(imageUrls);
    } catch (error: any) {
      console.error('Error fetching available images:', error);
      // Se o bucket não existir, apenas não mostrar imagens
      if (error?.message?.includes('Bucket not found')) {
        setAvailableImages([]);
      }
    } finally {
      setLoadingGallery(false);
    }
  };

  const handleImageSelect = async (imageUrl: string) => {
    // Mostrar feedback visual imediato
    setImages((prev) => ({ ...prev, [activeTab]: imageUrl }));
    
    // Salvar no banco de dados
    await handleImageChange(activeTab, imageUrl);
    setShowUpload(false);
  };

  const handleImageChange = async (type: BackgroundImageType, imageUrl: string) => {
    const client = getSupabaseClient();
    if (!client) {
      toast({
        title: 'Erro',
        description: 'Supabase não está conectado.',
        variant: 'destructive',
      });
      return;
    }

    setSaving((prev) => ({ ...prev, [type]: true }));

    try {
      // Verificar se já existe uma configuração para este tipo
      const { data: existing } = await client
        .from('background_image_configs')
        .select('id')
        .eq('type', type)
        .single();

      if (existing) {
        // Atualizar existente
        const { error } = await client
          .from('background_image_configs')
          .update({ image_url: imageUrl })
          .eq('type', type);

        if (error) throw error;
      } else {
        // Criar novo
        const { error } = await client
          .from('background_image_configs')
          .insert({ type, image_url: imageUrl });

        if (error) throw error;
      }

      setImages((prev) => ({ ...prev, [type]: imageUrl }));
      
      // Atualizar galeria após salvar
      await fetchAvailableImages();

      toast({
        title: 'Sucesso',
        description: `Imagem de fundo para ${backgroundImageLabels[type]} atualizada.`,
      });
    } catch (error: any) {
      console.error('Error saving background image:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar a imagem de fundo.',
        variant: 'destructive',
      });
    } finally {
      setSaving((prev) => ({ ...prev, [type]: false }));
    }
  };

  return (
    <>
      <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer" onClick={() => setIsOpen(true)}>
        <CardHeader>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <ImagePlus className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="font-serif text-xl">Upload de Imagens</CardTitle>
          <CardDescription>
            Adicione fotos incríveis para exibir suas bebidas e pratos
          </CardDescription>
        </CardHeader>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="glass border-border/50 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Gerenciar Imagens de Fundo</DialogTitle>
            <DialogDescription>
              Faça upload e configure imagens de fundo para as páginas do site
            </DialogDescription>
          </DialogHeader>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as BackgroundImageType)} className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="hero">{backgroundImageLabels.hero}</TabsTrigger>
                <TabsTrigger value="menu">{backgroundImageLabels.menu}</TabsTrigger>
                <TabsTrigger value="featured">{backgroundImageLabels.featured}</TabsTrigger>
              </TabsList>

              {(Object.keys(images) as BackgroundImageType[]).map((type) => (
                <TabsContent key={type} value={type} className="space-y-4 mt-6">
                  {/* Imagem Atual */}
                  {images[type] && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Imagem Atual</Label>
                      <div className="relative rounded-lg overflow-hidden border border-border/50">
                        <img
                          src={images[type]}
                          alt={`Imagem atual para ${backgroundImageLabels[type]}`}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-2 right-2 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-xs text-green-600 dark:text-green-400">Configurada</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Botão de Upload */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Fazer upload de nova imagem</Label>
                    {!showUpload ? (
                      <Button
                        onClick={() => setShowUpload(true)}
                        className="w-full"
                        variant="outline"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Fazer Upload
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Upload de Imagem</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowUpload(false)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <ImageUploader
                          value=""
                          onChange={(url) => {
                            handleImageSelect(url);
                            setShowUpload(false);
                          }}
                          error={saving[type] ? 'Salvando...' : undefined}
                          bucket="background-images"
                          folder=""
                        />
                      </div>
                    )}
                  </div>

                  {/* Galeria de Imagens Disponíveis */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Imagens disponíveis</Label>
                    {loadingGallery ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      </div>
                    ) : availableImages.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {availableImages.map((imageUrl, index) => {
                          const isSelected = images[type] === imageUrl;
                          return (
                            <div
                              key={index}
                              className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                isSelected
                                  ? 'border-primary ring-2 ring-primary ring-offset-2'
                                  : 'border-border/50 hover:border-primary'
                              }`}
                              onClick={() => handleImageSelect(imageUrl)}
                            >
                              <img
                                src={imageUrl}
                                alt={`Imagem ${index + 1}`}
                                className="w-full h-24 object-cover"
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                                  <div className="bg-background/90 rounded-full p-2">
                                    <CheckCircle2 className="w-6 h-6 text-primary" />
                                  </div>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                              {!isSelected && (
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="bg-background/80 backdrop-blur-sm rounded-full p-1.5">
                                    <ImagePlus className="w-4 h-4 text-primary" />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Nenhuma imagem disponível. Faça upload de uma nova imagem.
                      </div>
                    )}
                  </div>

                  {saving[type] && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BackgroundImageManager;

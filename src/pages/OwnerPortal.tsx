import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Lock, Database, ImagePlus, Edit3, Trash2, Plus, Shield, CheckCircle2, List } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SupabaseConnectionDialog from '@/components/SupabaseConnectionDialog';
import MenuItemForm from '@/components/MenuItemForm';
import MenuItemList from '@/components/MenuItemList';
import BackgroundImageManager from '@/components/BackgroundImageManager';
import { isSupabaseConnected, getSupabaseClient } from '@/lib/supabase';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useToast } from '@/hooks/use-toast';
import type { MenuItem } from '@/data/menuData';

const OwnerPortal = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  const [isConnected, setIsConnected] = useState(() => {
    // Check if Supabase is connected or if credentials exist in localStorage
    return isSupabaseConnected() || 
           (typeof window !== 'undefined' && 
            !!localStorage.getItem('supabase_url') && 
            !!localStorage.getItem('supabase_anon_key'));
  });

  // Desabilitar polling no Portal do Dono para evitar piscadas na tela
  const { items, loading, error, addItem, updateItem, deleteItem, refetch } = useMenuItems(false);

  // Try to initialize from localStorage on mount
  useEffect(() => {
    if (!isSupabaseConnected() && typeof window !== 'undefined') {
      const savedUrl = localStorage.getItem('supabase_url');
      const savedKey = localStorage.getItem('supabase_anon_key');
      if (savedUrl && savedKey) {
        // Try to get client (will auto-initialize from localStorage)
        const client = getSupabaseClient();
        if (client) {
          setIsConnected(true);
        }
      }
    }
  }, []);

  const handleAddItem = () => {
    setEditingItem(undefined);
    setIsFormOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: Omit<MenuItem, 'id'>) => {
    try {
      if (editingItem) {
        await updateItem(editingItem.id, data);
        toast({
          title: 'Item atualizado',
          description: `${data.name} foi atualizado com sucesso.`,
        });
      } else {
        await addItem(data);
        toast({
          title: 'Item adicionado',
          description: `${data.name} foi adicionado ao cardápio.`,
        });
      }
      setIsFormOpen(false);
      setEditingItem(undefined);
    } catch (error) {
      throw error; // Re-throw para o formulário tratar
    }
  };

  const handleDeleteItem = async (id: string) => {
    await deleteItem(id);
  };
  return (
    <>
      <Helmet>
        <title>Portal do Dono | Cantim</title>
        <meta name="description" content="Gerencie o cardápio do seu bar, adicione novos itens, atualize preços e faça upload de imagens. Portal seguro para proprietários." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16 pt-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Portal de Gerenciamento Seguro</span>
              </div>
              
              <h1 className="font-serif text-5xl md:text-6xl font-bold mb-4">
                Portal do <span className="text-primary glow-text">Dono</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Gerencie seu cardápio, atualize itens e mantenha seu bar funcionando perfeitamente
              </p>
            </motion.div>

            {isConnected ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="manage">Gerenciar Cardápio</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Feature Cards */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer" onClick={handleAddItem}>
                      <CardHeader>
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                          <Plus className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="font-serif text-xl">Adicionar Itens</CardTitle>
                        <CardDescription>
                          Crie novos itens do cardápio com descrições, preços e categorias
                        </CardDescription>
                      </CardHeader>
                    </Card>

                    <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer" onClick={() => setActiveTab('manage')}>
                      <CardHeader>
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                          <Edit3 className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="font-serif text-xl">Editar Cardápio</CardTitle>
                        <CardDescription>
                          Atualize itens existentes, altere preços e modifique descrições
                        </CardDescription>
                      </CardHeader>
                    </Card>

                    <BackgroundImageManager />

                    <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300">
                      <CardHeader>
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                          <Trash2 className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="font-serif text-xl">Remover Itens</CardTitle>
                        <CardDescription>
                          Arquive ou delete itens que não estão mais disponíveis
                        </CardDescription>
                      </CardHeader>
                    </Card>

                    <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300">
                      <CardHeader>
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                          <Database className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="font-serif text-xl">Categorias</CardTitle>
                        <CardDescription>
                          Organize itens em coquetéis, cervejas, vinhos, destilados e comidas
                        </CardDescription>
                      </CardHeader>
                    </Card>

                    <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300">
                      <CardHeader>
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                          <Lock className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="font-serif text-xl">Acesso Seguro</CardTitle>
                        <CardDescription>
                          Protegido com autenticação para garantir que apenas donos possam gerenciar
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>

                  {/* Stats */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  >
                    <Card className="glass border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-lg">Total de Itens</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-primary">{items.length}</p>
                      </CardContent>
                    </Card>
                    <Card className="glass border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-lg">Itens Populares</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-primary">
                          {items.filter((item) => item.isPopular).length}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="glass border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-lg">Novos Itens</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-primary">
                          {items.filter((item) => item.isNew).length}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent value="manage" className="space-y-6">
                  {error && (
                    <Card className="border-destructive">
                      <CardContent className="pt-6">
                        <p className="text-destructive">{error}</p>
                      </CardContent>
                    </Card>
                  )}
                  <MenuItemList
                    items={items}
                    loading={loading}
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                    onAdd={handleAddItem}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <>
                {/* Feature Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
                >
                  <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <Plus className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="font-serif text-xl">Adicionar Itens</CardTitle>
                      <CardDescription>
                        Crie novos itens do cardápio com descrições, preços e categorias
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <Edit3 className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="font-serif text-xl">Editar Cardápio</CardTitle>
                      <CardDescription>
                        Atualize itens existentes, altere preços e modifique descrições
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300">
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

                  <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <Trash2 className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="font-serif text-xl">Remover Itens</CardTitle>
                      <CardDescription>
                        Arquive ou delete itens que não estão mais disponíveis
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <Database className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="font-serif text-xl">Categorias</CardTitle>
                      <CardDescription>
                        Organize itens em coquetéis, cervejas, vinhos, destilados e comidas
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <Lock className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="font-serif text-xl">Acesso Seguro</CardTitle>
                      <CardDescription>
                        Protegido com autenticação para garantir que apenas donos possam gerenciar
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              </>
            )}

            {/* CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <Card className="glass border-primary/20 max-w-2xl mx-auto glow-border">
                <CardContent className="pt-8 pb-8">
                  <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-serif text-2xl font-semibold mb-3">
                    Backend Necessário
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Para habilitar recursos de gerenciamento de cardápio como adicionar, editar e deletar itens com autenticação segura, conecte ao Supabase.
                  </p>
                  {isConnected ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">Conectado ao Supabase</span>
                      </div>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setIsDialogOpen(true)}
                        className="px-8 py-6 text-lg font-medium rounded-full"
                      >
                        <Database className="mr-2 h-5 w-5" />
                        Alterar Conexão
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      onClick={() => setIsDialogOpen(true)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-medium rounded-full shadow-glow"
                    >
                      <Database className="mr-2 h-5 w-5" />
                      Conectar Backend
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>

      <SupabaseConnectionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConnected={() => {
          setIsConnected(true);
          refetch();
        }}
      />

      <MenuItemForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
        mode={editingItem ? 'edit' : 'create'}
      />
    </>
  );
};

export default OwnerPortal;

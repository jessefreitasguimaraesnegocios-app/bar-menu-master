import { useState, useMemo } from 'react';
import { Edit3, Trash2, Plus, Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { categories, type MenuItem, type Category } from '@/data/menuData';
import { useToast } from '@/hooks/use-toast';
import { useBarCategories } from '@/hooks/useBarCategories';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { useAuth } from '@/contexts/AuthContext';

interface MenuItemListProps {
  items: MenuItem[];
  loading: boolean;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => Promise<void>;
  onAdd: () => void;
  barId?: string | null; // Opcional: permite passar barId diretamente
  onImportDefault?: () => Promise<void>; // Função para importar itens padrão
}

const MenuItemList = ({ items, loading, onEdit, onDelete, onAdd, barId: propBarId, onImportDefault }: MenuItemListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
  // Obter barId do contexto ou da prop
  const { barId: authBarId, isAdmin } = useAuth();
  const barId = propBarId ?? authBarId;
  
  // Obter categorias disponíveis para o bar
  const { getAvailableCategories } = useBarCategories();
  const { customCategories } = useCustomCategories();
  
  // Combinar categorias padrão com customizadas
  const allCategories = useMemo(() => {
    const defaultCats = categories.map(cat => ({
      id: cat.id,
      label: cat.label,
      icon: cat.icon,
    }));
    const customCats = customCategories.map(cat => ({
      id: cat.id,
      label: cat.label,
      icon: cat.icon,
    }));
    return [...defaultCats, ...customCats];
  }, [customCategories]);
  
  // Se não há bar_id ou é admin, mostrar todas as categorias
  const showAllCategories = !barId || isAdmin;
  
  // Obter apenas categorias disponíveis/in_use para este bar
  const availableCategoryIds = useMemo(() => {
    return showAllCategories 
      ? allCategories.map(c => c.id)
      : getAvailableCategories(barId || '');
  }, [showAllCategories, barId, getAvailableCategories, allCategories]);
  
  // Filtrar categorias para mostrar apenas as disponíveis
  const categoriesToShow = useMemo(() => {
    return showAllCategories
      ? allCategories
      : allCategories.filter(cat => availableCategoryIds.includes(cat.id));
  }, [showAllCategories, allCategories, availableCategoryIds]);

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteClick = (item: MenuItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(itemToDelete.id);
      toast({
        title: 'Item removido',
        description: `${itemToDelete.name} foi removido do cardápio.`,
      });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao remover item',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    // Buscar em todas as categorias (padrão + customizadas)
    const cat = allCategories.find((c) => c.id === category);
    return cat?.label || category;
  };

  const getCategoryIcon = (category: string) => {
    // Buscar em todas as categorias (padrão + customizadas)
    const cat = allCategories.find((c) => c.id === category);
    return cat?.icon || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando itens...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar itens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={onAdd} className="sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Item
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            Todos
          </Button>
          {categoriesToShow.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.icon} {category.label}
            </Button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            {items.length === 0 ? (
              <>
                <p className="text-muted-foreground mb-2 text-lg font-semibold">
                  Nenhum item no cardápio ainda
                </p>
                <p className="text-muted-foreground mb-6 text-sm max-w-md mx-auto">
                  Adicione itens ao seu cardápio para que apareçam no menu público.
                  Os itens devem estar associados ao seu estabelecimento.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  {onImportDefault && (
                    <Button 
                      onClick={async () => {
                        if (onImportDefault) {
                          try {
                            await onImportDefault();
                            toast({
                              title: "Itens importados!",
                              description: "Os itens padrão foram adicionados ao seu cardápio.",
                            });
                          } catch (error) {
                            toast({
                              title: "Erro ao importar",
                              description: error instanceof Error ? error.message : "Não foi possível importar os itens padrão.",
                              variant: "destructive",
                            });
                          }
                        }
                      }}
                      variant="outline"
                      size="lg"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Importar Itens Padrão
                    </Button>
                  )}
                  <Button onClick={onAdd} size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Primeiro Item
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">
                  Nenhum item encontrado com os filtros selecionados.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchTerm('');
                  }}
                >
                  Limpar Filtros
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 bg-muted">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  {item.isPopular && (
                    <Badge variant="default" className="bg-primary">
                      Popular
                    </Badge>
                  )}
                  {item.isNew && (
                    <Badge variant="secondary">Novo</Badge>
                  )}
                </div>
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{item.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      {getCategoryIcon(item.category)} {getCategoryLabel(item.category)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    R$ {item.price.toFixed(2)}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(item)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteClick(item)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{itemToDelete?.name}</strong> do cardápio?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MenuItemList;


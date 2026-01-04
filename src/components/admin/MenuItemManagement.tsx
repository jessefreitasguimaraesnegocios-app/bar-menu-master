import { useState } from 'react';
import { Plus, Edit3, Trash2, Loader2, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMenuItems } from '@/hooks/useMenuItems';
import MenuItemForm from '@/components/MenuItemForm';
import MenuItemList from '@/components/MenuItemList';
import type { MenuItem } from '@/data/menuData';

interface Bar {
  id: string;
  name: string;
}

interface MenuItemManagementProps {
  bars: Bar[];
}

const MenuItemManagement = ({ bars }: MenuItemManagementProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>(undefined);
  const { items, loading, error, addItem, updateItem, deleteItem, refetch } = useMenuItems();

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
      } else {
        await addItem(data);
      }
      setIsFormOpen(false);
      setEditingItem(undefined);
      refetch();
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteItem = async (id: string) => {
    await deleteItem(id);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif font-bold mb-2">Gerenciar Produtos</h2>
          <p className="text-muted-foreground">
            Crie e gerencie itens do cardápio disponíveis para os bares
          </p>
        </div>
        <Button onClick={handleAddItem}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Produto
        </Button>
      </div>

      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Produtos do Sistema
          </CardTitle>
          <CardDescription>
            Estes produtos podem ser associados aos bares conforme a disponibilidade de categorias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              {typeof error === 'string' ? error : error?.message || 'Erro ao carregar produtos'}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <MenuItemList
              items={items}
              loading={loading}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              onAdd={handleAddItem}
            />
          )}
        </CardContent>
      </Card>

      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle>Sobre o Gerenciamento de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              • Os produtos criados aqui ficam disponíveis para <strong>todos os bares</strong> do sistema.
            </p>
            <p>
              • Cada bar pode exibir apenas produtos das categorias que estão habilitadas para ele.
            </p>
            <p>
              • Para controlar quais produtos aparecem em cada bar, gerencie as categorias disponíveis.
            </p>
            <p>
              • Os bares podem personalizar preços e disponibilidade através do Portal do Dono.
            </p>
          </div>
        </CardContent>
      </Card>

      <MenuItemForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
        mode={editingItem ? 'edit' : 'create'}
      />
    </div>
  );
};

export default MenuItemManagement;


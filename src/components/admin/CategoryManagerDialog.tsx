import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCustomCategories, CustomCategory } from '@/hooks/useCustomCategories';
import { categories as defaultCategories } from '@/data/menuData';

interface CategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CategoryManagerDialog = ({ open, onOpenChange }: CategoryManagerDialogProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📦');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { customCategories, addCategory, updateCategory, deleteCategory } = useCustomCategories();

  // Todas as categorias (padrão + customizadas)
  const allCategories = [...defaultCategories, ...customCategories];

  const handleAddCategory = () => {
    if (!newCategoryLabel.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome da categoria é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    try {
      addCategory(newCategoryLabel.trim(), newCategoryIcon);
      toast({
        title: 'Categoria adicionada',
        description: `${newCategoryLabel} foi adicionada com sucesso.`,
      });
      setNewCategoryLabel('');
      setNewCategoryIcon('📦');
      setIsAdding(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível adicionar a categoria.',
        variant: 'destructive',
      });
    }
  };

  const handleEditCategory = (category: CustomCategory) => {
    setEditingId(category.id);
    setEditLabel(category.label);
    setEditIcon(category.icon);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editLabel.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome da categoria é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    try {
      updateCategory(editingId, editLabel.trim(), editIcon);
      toast({
        title: 'Categoria atualizada',
        description: `${editLabel} foi atualizada com sucesso.`,
      });
      setEditingId(null);
      setEditLabel('');
      setEditIcon('');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar a categoria.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCategory = (category: CustomCategory) => {
    if (!confirm(`Tem certeza que deseja remover a categoria "${category.label}"?`)) {
      return;
    }

    try {
      deleteCategory(category.id);
      toast({
        title: 'Categoria removida',
        description: `${category.label} foi removida.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível remover a categoria.',
        variant: 'destructive',
      });
    }
  };

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Ícones emoji comuns para categorias
  const commonIcons = ['📦', '🍕', '🍔', '🌮', '🍜', '🍱', '🥗', '🥪', '🍰', '☕', '🥤', '🍪', '🧁', '🍩', '🍭'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias</DialogTitle>
          <DialogDescription>
            Crie e gerencie categorias customizadas para o cardápio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de categorias existentes */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg mb-4">Todas as Categorias</h3>
            
            <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-2">
              {allCategories.map((category) => {
                const isEditing = editingId === category.id;
                const isDefault = !('isCustom' in category) || !category.isCustom;

                return (
                  <div
                    key={category.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isDefault
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border/50 bg-background hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{category.icon}</span>
                        {isEditing && isDefault === false ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              type="text"
                              value={editIcon}
                              onChange={(e) => setEditIcon(e.target.value)}
                              placeholder="Ícone (emoji)"
                              className="w-20"
                            />
                            <Input
                              type="text"
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              placeholder="Nome da categoria"
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={handleSaveEdit}
                              variant="default"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setEditingId(null);
                                setEditLabel('');
                                setEditIcon('');
                              }}
                              variant="outline"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1">
                              <div className="font-medium">{category.label}</div>
                              {isDefault && (
                                <div className="text-xs text-muted-foreground">
                                  Categoria padrão
                                </div>
                              )}
                            </div>
                            {!isDefault && (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditCategory(category as CustomCategory)}
                                  title="Editar categoria"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteCategory(category as CustomCategory)}
                                  className="text-destructive hover:text-destructive"
                                  title="Remover categoria"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formulário para adicionar nova categoria */}
          {!isAdding ? (
            <Button
              onClick={() => setIsAdding(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Nova Categoria
            </Button>
          ) : (
            <div className="p-4 rounded-lg border border-border/50 bg-background space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-icon">Ícone (emoji)</Label>
                <div className="flex gap-2">
                  <Input
                    id="category-icon"
                    type="text"
                    value={newCategoryIcon}
                    onChange={(e) => setNewCategoryIcon(e.target.value)}
                    placeholder="📦"
                    maxLength={2}
                    className="w-20"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {commonIcons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewCategoryIcon(icon)}
                        className="text-xl hover:scale-125 transition-transform p-1"
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-label">Nome da Categoria *</Label>
                <Input
                  id="category-label"
                  type="text"
                  value={newCategoryLabel}
                  onChange={(e) => setNewCategoryLabel(e.target.value)}
                  placeholder="Ex: Sobremesas, Bebidas Quentes, etc."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCategory();
                    }
                  }}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddCategory} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setNewCategoryLabel('');
                    setNewCategoryIcon('📦');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryManagerDialog;


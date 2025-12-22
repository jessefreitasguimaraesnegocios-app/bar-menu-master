import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import ImageUploader from '@/components/ImageUploader';
import { categories, type MenuItem, type Category } from '@/data/menuData';

const menuItemSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  price: z.number().min(0, 'Preço deve ser maior ou igual a zero'),
  category: z.enum(['cocktails', 'beers', 'wines', 'spirits', 'appetizers', 'mains']),
  image: z.string().min(1, 'Imagem é obrigatória').refine(
    (val) => {
      // Aceita URLs válidas ou URLs do Supabase Storage
      if (!val) return false;
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'URL da imagem inválida' }
  ),
  ingredients: z.string().optional(),
  preparation: z.string().optional(),
  abv: z.number().min(0).max(100).optional().nullable(),
  isPopular: z.boolean().default(false),
  isNew: z.boolean().default(false),
});

type MenuItemFormData = z.infer<typeof menuItemSchema>;

interface MenuItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<MenuItem, 'id'>) => Promise<void>;
  initialData?: MenuItem;
  mode: 'create' | 'edit';
}

const MenuItemForm = ({ open, onOpenChange, onSubmit, initialData, mode }: MenuItemFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: 'cocktails',
      image: '',
      ingredients: '',
      preparation: '',
      abv: null,
      isPopular: false,
      isNew: false,
    },
  });

  const ingredientsString = watch('ingredients');

  useEffect(() => {
    if (initialData && mode === 'edit') {
      reset({
        name: initialData.name,
        description: initialData.description,
        price: initialData.price,
        category: initialData.category,
        image: initialData.image,
        ingredients: initialData.ingredients?.join(', ') || '',
        preparation: initialData.preparation || '',
        abv: initialData.abv || null,
        isPopular: initialData.isPopular || false,
        isNew: initialData.isNew || false,
      });
    } else {
      reset({
        name: '',
        description: '',
        price: 0,
        category: 'cocktails',
        image: '',
        ingredients: '',
        preparation: '',
        abv: null,
        isPopular: false,
        isNew: false,
      });
    }
    setError(null);
  }, [initialData, mode, open, reset]);

  const onFormSubmit = async (data: MenuItemFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Converter string de ingredientes para array
      const ingredientsArray = data.ingredients
        ? data.ingredients.split(',').map((ing) => ing.trim()).filter(Boolean)
        : [];

      const menuItem: Omit<MenuItem, 'id'> = {
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        image: data.image,
        ingredients: ingredientsArray.length > 0 ? ingredientsArray : undefined,
        preparation: data.preparation || undefined,
        abv: data.abv || undefined,
        isPopular: data.isPopular,
        isNew: data.isNew,
      };

      await onSubmit(menuItem);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {mode === 'create' ? 'Adicionar Novo Item' : 'Editar Item'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Preencha os dados para adicionar um novo item ao cardápio'
              : 'Atualize as informações do item'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ex: Old Fashioned"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select
              value={watch('category')}
              onValueChange={(value) => setValue('category', value as Category)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descreva o item..."
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <ImageUploader
              value={watch('image')}
              onChange={(url) => setValue('image', url)}
              error={errors.image?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ingredients">Ingredientes (separados por vírgula)</Label>
            <Input
              id="ingredients"
              {...register('ingredients')}
              placeholder="Ingrediente 1, Ingrediente 2, ..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preparation">Modo de Preparo</Label>
            <Textarea
              id="preparation"
              {...register('preparation')}
              placeholder="Descreva como preparar..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="abv">Teor Alcoólico (%)</Label>
              <Input
                id="abv"
                type="number"
                step="0.1"
                {...register('abv', { valueAsNumber: true })}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPopular"
                checked={watch('isPopular')}
                onCheckedChange={(checked) => setValue('isPopular', checked === true)}
              />
              <Label htmlFor="isPopular" className="cursor-pointer">
                Item Popular
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isNew"
                checked={watch('isNew')}
                onCheckedChange={(checked) => setValue('isNew', checked === true)}
              />
              <Label htmlFor="isNew" className="cursor-pointer">
                Item Novo
              </Label>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                mode === 'create' ? 'Adicionar' : 'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MenuItemForm;


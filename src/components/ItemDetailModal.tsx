import { Droplets, Clock, Sparkles, Star, ShoppingCart, Plus, Minus, X } from 'lucide-react';
import { MenuItem } from '@/data/menuData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/CartContext';
import { useState, useEffect } from 'react';

interface ItemDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (item: MenuItem, quantity: number) => void; // Callback opcional customizado
}

const ItemDetailModal = ({ item, isOpen, onClose, onAddToCart }: ItemDetailModalProps) => {
  const { addItem: defaultAddItem, getItemQuantity, updateQuantity, openCart } = useCart();
  
  // Usar callback customizado se fornecido, senão usar o padrão
  const addItemToCart = onAddToCart || defaultAddItem;
  const [quantity, setQuantity] = useState(1);
  const [itemAdded, setItemAdded] = useState(false);
  
  // Resetar estado quando o item mudar ou modal fechar
  useEffect(() => {
    if (!isOpen) {
      setItemAdded(false);
      setQuantity(1);
    }
  }, [isOpen]);

  const currentQuantity = item ? getItemQuantity(item.id) : 0;
  const isInCart = currentQuantity > 0 || itemAdded;
  
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass border-border/50 max-w-2xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">{item.name}</DialogTitle>
        {/* Image Header */}
        <div className="relative h-64 md:h-80">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {item.isPopular && (
              <Badge className="bg-primary/90 text-primary-foreground border-0">
                <Star className="w-3 h-3 mr-1" />
                Popular
              </Badge>
            )}
            {item.isNew && (
              <Badge className="bg-accent/90 text-accent-foreground border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                Novo
              </Badge>
            )}
          </div>

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2 glow-text">
              {item.name}
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-semibold text-primary">R$ {item.price.toFixed(2)}</span>
              {item.abv && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Droplets className="w-4 h-4" />
                  {item.abv}% ABV
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-foreground/90 text-lg leading-relaxed">
            {item.description}
          </p>

          {/* Ingredients */}
          {item.ingredients && item.ingredients.length > 0 && (
            <div>
              <h3 className="font-serif text-lg font-semibold mb-3 text-primary">
                Ingredientes
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.ingredients.map((ingredient, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preparation */}
          {item.preparation && (
            <div>
              <h3 className="font-serif text-lg font-semibold mb-3 text-primary flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Preparo
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {item.preparation}
              </p>
            </div>
          )}

          {/* Add to Cart Section */}
          <div className="border-t pt-6 space-y-4">
            {!isInCart && (
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Quantidade</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {!isInCart ? (
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  addItemToCart(item, quantity);
                  setItemAdded(true);
                }}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Adicionar ao Carrinho - R$ {(item.price * quantity).toFixed(2)}
              </Button>
            ) : (
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                onClick={() => {
                  openCart();
                  onClose();
                }}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Ver Carrinho
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetailModal;

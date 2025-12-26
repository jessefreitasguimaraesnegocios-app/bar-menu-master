import { Droplets, Clock, Sparkles, Star, ShoppingCart, Plus, Minus } from 'lucide-react';
import { MenuItem } from '@/data/menuData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';

interface ItemDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const ItemDetailModal = ({ item, isOpen, onClose }: ItemDetailModalProps) => {
  const { addItem, getItemQuantity, updateQuantity, openCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  
  if (!item) return null;

  const itemQuantity = getItemQuantity(item.id);
  const hasItemInCart = itemQuantity > 0;

  const handleAddToCart = () => {
    addItem(item, quantity);
    setQuantity(1);
  };

  const handleUpdateQuantity = (newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(item.id, newQuantity);
  };

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
          <div className="pt-4 border-t border-border/50">
            {hasItemInCart ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {itemQuantity} {itemQuantity === 1 ? 'item' : 'itens'} no carrinho
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => handleUpdateQuantity(itemQuantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{itemQuantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => handleUpdateQuantity(itemQuantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={() => {
                      onClose();
                      openCart();
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Ver Carrinho
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border rounded-lg w-fit">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={handleAddToCart}
                  className="w-full"
                  size="lg"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Adicionar ao Carrinho
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetailModal;

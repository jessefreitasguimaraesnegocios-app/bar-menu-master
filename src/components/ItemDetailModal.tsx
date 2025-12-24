import { Droplets, Clock, Sparkles, Star } from 'lucide-react';
import { MenuItem } from '@/data/menuData';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface ItemDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const ItemDetailModal = ({ item, isOpen, onClose }: ItemDetailModalProps) => {
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetailModal;

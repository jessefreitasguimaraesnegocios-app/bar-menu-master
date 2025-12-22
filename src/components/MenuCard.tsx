import { motion } from 'framer-motion';
import { Sparkles, Star } from 'lucide-react';
import { MenuItem } from '@/data/menuData';
import { Badge } from '@/components/ui/badge';

interface MenuCardProps {
  item: MenuItem;
  onClick: () => void;
  index: number;
}

const MenuCard = ({ item, onClick, index }: MenuCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-xl glass glow-border transition-all duration-300 hover:shadow-glow">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {item.isPopular && (
              <Badge className="bg-primary/90 text-primary-foreground border-0">
                <Star className="w-3 h-3 mr-1" />
                Popular
              </Badge>
            )}
            {item.isNew && (
              <Badge className="bg-accent/90 text-accent-foreground border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                New
              </Badge>
            )}
          </div>

          {/* Price Tag */}
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm text-primary font-semibold text-sm">
              ${item.price}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-serif text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
            {item.name}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
            {item.description}
          </p>
          
          {item.abv && (
            <span className="text-xs text-muted-foreground/70">
              {item.abv}% ABV
            </span>
          )}
        </div>

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-glow" />
        </div>
      </div>
    </motion.div>
  );
};

export default MenuCard;

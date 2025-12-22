import { motion } from 'framer-motion';
import { categories, Category } from '@/data/menuData';

interface CategoryFilterProps {
  activeCategory: Category | 'all';
  onCategoryChange: (category: Category | 'all') => void;
}

const CategoryFilter = ({ activeCategory, onCategoryChange }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onCategoryChange('all')}
        className={`relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
          activeCategory === 'all'
            ? 'text-primary-foreground'
            : 'text-foreground/70 hover:text-foreground glass'
        }`}
      >
        {activeCategory === 'all' && (
          <motion.div
            layoutId="categoryBg"
            className="absolute inset-0 bg-primary rounded-full"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
        <span className="relative z-10">Todos</span>
      </motion.button>

      {categories.map((category) => (
        <motion.button
          key={category.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onCategoryChange(category.id)}
          className={`relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
            activeCategory === category.id
              ? 'text-primary-foreground'
              : 'text-foreground/70 hover:text-foreground glass'
          }`}
        >
          {activeCategory === category.id && (
            <motion.div
              layoutId="categoryBg"
              className="absolute inset-0 bg-primary rounded-full"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <span>{category.icon}</span>
            <span>{category.label}</span>
          </span>
        </motion.button>
      ))}
    </div>
  );
};

export default CategoryFilter;

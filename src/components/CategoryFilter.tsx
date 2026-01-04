import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { categories, Category } from '@/data/menuData';
import { useAuth } from '@/contexts/AuthContext';
import { useBarCategories } from '@/hooks/useBarCategories';
import { useCustomCategories } from '@/hooks/useCustomCategories';

interface CategoryFilterProps {
  activeCategory: Category | 'all';
  onCategoryChange: (category: Category | 'all') => void;
  barId?: string | null; // Opcional: permite passar barId diretamente
}

const CategoryFilter = ({ activeCategory, onCategoryChange, barId: propBarId }: CategoryFilterProps) => {
  const { barId: authBarId, isAdmin } = useAuth();
  const barId = propBarId ?? authBarId; // Usar prop se disponível, senão usar do auth
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

  // Calcular categorias disponíveis com useMemo para evitar recálculos desnecessários
  const availableCategories = useMemo(() => {
    return showAllCategories 
      ? allCategories.map(c => c.id)
      : getAvailableCategories(barId || '');
  }, [showAllCategories, barId, getAvailableCategories, allCategories]);

  // Determinar quais categorias mostrar
  const categoriesToShow = useMemo(() => {
    return availableCategories.length > 0 || showAllCategories
      ? allCategories.filter(cat => showAllCategories || availableCategories.includes(cat.id))
      : allCategories;
  }, [availableCategories, showAllCategories, allCategories]);

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

      {categoriesToShow.map((category) => (
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

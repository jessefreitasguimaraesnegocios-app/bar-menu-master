import { useState, useEffect, useCallback } from 'react';

export interface CustomCategory {
  id: string;
  label: string;
  icon: string;
  isCustom: boolean;
}

const STORAGE_KEY = 'custom_categories';

export const useCustomCategories = () => {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);

  // Carregar categorias customizadas do localStorage
  useEffect(() => {
    const loadCategories = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setCustomCategories(JSON.parse(saved));
        } catch (error) {
          console.error('Error loading custom categories:', error);
        }
      }
    };

    loadCategories();

    // Escutar mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadCategories();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('customCategoriesUpdated', loadCategories);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('customCategoriesUpdated', loadCategories);
    };
  }, []);

  const saveCategories = useCallback((categories: CustomCategory[]) => {
    setCustomCategories(categories);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(new Event('customCategoriesUpdated'));
  }, []);

  const addCategory = useCallback((label: string, icon: string) => {
    const newCategory: CustomCategory = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label,
      icon,
      isCustom: true,
    };

    const updated = [...customCategories, newCategory];
    saveCategories(updated);
    return newCategory;
  }, [customCategories, saveCategories]);

  const updateCategory = useCallback((id: string, label: string, icon: string) => {
    const updated = customCategories.map(cat =>
      cat.id === id ? { ...cat, label, icon } : cat
    );
    saveCategories(updated);
  }, [customCategories, saveCategories]);

  const deleteCategory = useCallback((id: string) => {
    const updated = customCategories.filter(cat => cat.id !== id);
    saveCategories(updated);
  }, [customCategories, saveCategories]);

  return {
    customCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
};

export default useCustomCategories;












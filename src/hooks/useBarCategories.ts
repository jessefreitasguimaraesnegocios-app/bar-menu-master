import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Category } from '@/data/menuData';

type CategoryStatus = 'unavailable' | 'available' | 'in_use';

interface BarCategoryConfig {
  [barId: string]: {
    [category: string]: CategoryStatus; // Usa string para suportar categorias customizadas
  };
}

const STORAGE_KEY = 'bar_category_config';

export const useBarCategories = () => {
  const [config, setConfig] = useState<BarCategoryConfig>({});

  // Carregar do localStorage ao montar e escutar mudanças
  useEffect(() => {
    const loadConfig = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setConfig(JSON.parse(saved));
        } catch (error) {
          console.error('Error loading bar categories:', error);
        }
      }
    };

    loadConfig();

    // Escutar mudanças no localStorage (para quando outro componente atualizar)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadConfig();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Também criar um listener customizado para mudanças na mesma janela
    window.addEventListener('barCategoriesUpdated', loadConfig);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('barCategoriesUpdated', loadConfig);
    };
  }, []);

  // Salvar no localStorage sempre que mudar
  const saveConfig = (newConfig: BarCategoryConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    // Disparar evento customizado para atualizar outros componentes na mesma janela
    window.dispatchEvent(new Event('barCategoriesUpdated'));
  };

  const setCategoryStatus = (barId: string, category: Category, status: CategoryStatus) => {
    const newConfig = {
      ...config,
      [barId]: {
        ...(config[barId] || {}),
        [category]: status,
      },
    };
    saveConfig(newConfig);
  };

  const getCategoryStatus = (barId: string, category: Category): CategoryStatus => {
    return config[barId]?.[category] || 'unavailable';
  };

  const getAvailableCategories = useCallback((barId: string): Category[] => {
    const barConfig = config[barId] || {};
    return Object.entries(barConfig)
      .filter(([_, status]) => status === 'in_use')
      .map(([category]) => category as Category);
  }, [config]);

  const getAllCategoriesForBar = (barId: string): Record<string, CategoryStatus> => {
    return config[barId] || {};
  };

  return {
    config,
    setCategoryStatus,
    getCategoryStatus,
    getAvailableCategories,
    getAllCategoriesForBar,
    saveConfig,
  };
};

export default useBarCategories;


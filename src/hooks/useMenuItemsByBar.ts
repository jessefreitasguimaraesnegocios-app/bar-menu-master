import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import type { MenuItem } from '@/data/menuData';

interface MenuItemRow {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  ingredients?: string[] | null;
  preparation?: string | null;
  abv?: number | null;
  is_popular?: boolean | null;
  is_new?: boolean | null;
  bar_id?: string | null;
}

export const useMenuItemsByBar = (barId: string | null | undefined) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const mapRowToMenuItem = (row: MenuItemRow): MenuItem => {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: Number(row.price),
      category: row.category as MenuItem['category'],
      image: row.image,
      ingredients: row.ingredients || undefined,
      preparation: row.preparation || undefined,
      abv: row.abv ? Number(row.abv) : undefined,
      isPopular: row.is_popular || false,
      isNew: row.is_new || false,
    };
  };

  const fetchItems = useCallback(async () => {
    if (!barId) {
      setItems([]);
      setLoading(false);
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setLoading(false);
      setError(new Error('Supabase client not available'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await client
        .from('menu_items')
        .select('*')
        .eq('bar_id', barId)
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('is_popular', { ascending: false })
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      const mappedItems = (data || []).map(mapRowToMenuItem);
      setItems(mappedItems);
    } catch (err) {
      console.error('Error fetching menu items by bar:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch menu items'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [barId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
  };
};











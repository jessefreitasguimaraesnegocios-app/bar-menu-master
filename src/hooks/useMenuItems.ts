import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import type { MenuItem, Category } from '@/data/menuData';

export const useMenuItems = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setError('Supabase não está conectado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await client
        .from('menu_items')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      // Transformar dados do Supabase para o formato MenuItem
      const transformedItems: MenuItem[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: parseFloat(item.price),
        category: item.category as Category,
        image: item.image,
        ingredients: item.ingredients || [],
        preparation: item.preparation || undefined,
        abv: item.abv ? parseFloat(item.abv) : undefined,
        isPopular: item.is_popular || false,
        isNew: item.is_new || false,
      }));

      setItems(transformedItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar itens');
      console.error('Error fetching menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (item: Omit<MenuItem, 'id'>) => {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase não está conectado');
    }

    try {
      const { data, error: insertError } = await client
        .from('menu_items')
        .insert({
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          image: item.image,
          ingredients: item.ingredients || [],
          preparation: item.preparation || null,
          abv: item.abv || null,
          is_popular: item.isPopular || false,
          is_new: item.isNew || false,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Recarregar lista
      await fetchItems();

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar item';
      throw new Error(errorMessage);
    }
  };

  const updateItem = async (id: string, updates: Partial<MenuItem>) => {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase não está conectado');
    }

    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.image !== undefined) updateData.image = updates.image;
      if (updates.ingredients !== undefined) updateData.ingredients = updates.ingredients;
      if (updates.preparation !== undefined) updateData.preparation = updates.preparation;
      if (updates.abv !== undefined) updateData.abv = updates.abv;
      if (updates.isPopular !== undefined) updateData.is_popular = updates.isPopular;
      if (updates.isNew !== undefined) updateData.is_new = updates.isNew;

      const { error: updateError } = await client
        .from('menu_items')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      // Recarregar lista
      await fetchItems();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar item';
      throw new Error(errorMessage);
    }
  };

  const deleteItem = async (id: string) => {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase não está conectado');
    }

    try {
      // Soft delete - marcar como inativo
      const { error: deleteError } = await client
        .from('menu_items')
        .update({ is_active: false })
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Recarregar lista
      await fetchItems();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar item';
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
    addItem,
    updateItem,
    deleteItem,
  };
};


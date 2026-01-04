import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { MenuItem } from '@/data/menuData';
import { menuItems as defaultMenuItems } from '@/data/menuData';

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
}

export const useMenuItems = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isAdmin, isOwner, barId } = useAuth();

  // Converter dados do banco (snake_case) para formato do frontend (camelCase)
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

  // Converter dados do frontend (camelCase) para formato do banco (snake_case)
  const mapMenuItemToRow = (item: Omit<MenuItem, 'id'>) => {
    // Garantir que category seja sempre uma string válida
    const category = String(item.category || '').trim();
    
    if (!category) {
      throw new Error('Categoria é obrigatória');
    }

    return {
      name: item.name,
      description: item.description,
      price: item.price,
      category: category, // Garantir que é string
      image: item.image,
      ingredients: item.ingredients || [],
      preparation: item.preparation || null,
      abv: item.abv || null,
      is_popular: item.isPopular || false,
      is_new: item.isNew || false,
    };
  };

  const fetchItems = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = client
        .from('menu_items')
        .select('*')
        .eq('is_active', true);

      // Se for owner, filtrar apenas itens do seu bar
      if (isOwner && barId) {
        query = query.eq('bar_id', barId);
      }
      // Admin vê todos os itens (sem filtro)

      const { data, error: fetchError } = await query
        .order('category', { ascending: true })
        .order('is_popular', { ascending: false })
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      const mappedItems = (data || []).map(mapRowToMenuItem);
      setItems(mappedItems);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch menu items'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isOwner, isAdmin, barId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = useCallback(async (item: Omit<MenuItem, 'id'>) => {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not available');
    }

    // Se for owner, garantir que o item seja associado ao seu bar
    if (isOwner && !barId) {
      throw new Error('Bar ID não encontrado. Faça login novamente.');
    }

    try {
      const rowData = mapMenuItemToRow(item);
      
      // Adicionar bar_id se for owner
      if (isOwner && barId) {
        (rowData as any).bar_id = barId;
        console.log('📝 Adicionando item com bar_id:', barId);
      } else if (isOwner && !barId) {
        console.error('❌ Owner sem bar_id! Não é possível adicionar item.');
        throw new Error('Bar ID não encontrado. Faça login novamente.');
      }

      console.log('📤 Dados a serem inseridos:', rowData);

      const { data, error: insertError } = await client
        .from('menu_items')
        .insert([rowData])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao inserir item no Supabase:', insertError);
        console.error('Código do erro:', insertError.code);
        console.error('Mensagem do erro:', insertError.message);
        console.error('Dados que causaram erro:', rowData);
        
        // Mensagem de erro mais amigável para erro de ENUM
        if (insertError.code === '22P02' && insertError.message?.includes('enum')) {
          const friendlyError = new Error(
            'A categoria selecionada não é válida. O banco de dados precisa ser atualizado. ' +
            'Execute a migration: supabase/14_force_category_to_varchar.sql'
          );
          friendlyError.name = 'InvalidCategoryError';
          throw friendlyError;
        }
        
        throw insertError;
      }

      console.log('✅ Item inserido com sucesso:', data);

      const newItem = mapRowToMenuItem(data as MenuItemRow);
      setItems((prev) => [...prev, newItem]);
      return newItem;
    } catch (err) {
      console.error('Error adding menu item:', err);
      throw err;
    }
  }, [isOwner, barId]);

  const updateItem = useCallback(async (id: string, item: Omit<MenuItem, 'id'>) => {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not available');
    }

    // Se for owner, verificar se o item pertence ao seu bar
    if (isOwner && barId) {
      const { data: existingItem } = await client
        .from('menu_items')
        .select('bar_id')
        .eq('id', id)
        .single();

      if (existingItem?.bar_id !== barId) {
        throw new Error('Você não tem permissão para editar este item.');
      }
    }

    try {
      const rowData = mapMenuItemToRow(item);

      let query = client
        .from('menu_items')
        .update(rowData)
        .eq('id', id);

      // Se for owner, garantir que só atualize itens do seu bar
      if (isOwner && barId) {
        query = query.eq('bar_id', barId);
      }

      const { data, error: updateError } = await query
        .select()
        .single();

      if (updateError) throw updateError;

      const updatedItem = mapRowToMenuItem(data as MenuItemRow);
      setItems((prev) => prev.map((i) => (i.id === id ? updatedItem : i)));
      return updatedItem;
    } catch (err) {
      console.error('Error updating menu item:', err);
      throw err;
    }
  }, [isOwner, barId]);

  const deleteItem = useCallback(async (id: string) => {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not available');
    }

    // Se for owner, verificar se o item pertence ao seu bar
    if (isOwner && barId) {
      const { data: existingItem } = await client
        .from('menu_items')
        .select('bar_id')
        .eq('id', id)
        .single();

      if (existingItem?.bar_id !== barId) {
        throw new Error('Você não tem permissão para deletar este item.');
      }
    }

    try {
      // Soft delete - atualizar is_active para false
      let query = client
        .from('menu_items')
        .update({ is_active: false })
        .eq('id', id);

      // Se for owner, garantir que só delete itens do seu bar
      if (isOwner && barId) {
        query = query.eq('bar_id', barId);
      }

      const { error: deleteError } = await query;

      if (deleteError) throw deleteError;

      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error('Error deleting menu item:', err);
      throw err;
    }
  }, [isOwner, barId]);

  const refetch = useCallback(() => {
    fetchItems();
  }, [fetchItems]);

  const importDefaultItems = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not available');
    }

    // Se for owner, garantir que tenha barId
    if (isOwner && !barId) {
      throw new Error('Bar ID não encontrado. Faça login novamente.');
    }

    try {
      // Preparar os itens padrão para inserção
      const itemsToInsert = defaultMenuItems.map((item) => {
        const rowData = mapMenuItemToRow(item);
        
        // Se for owner, associar ao seu bar
        if (isOwner && barId) {
          (rowData as any).bar_id = barId;
        }
        
        return rowData;
      });

      // Inserir todos os itens de uma vez
      const { data, error: insertError } = await client
        .from('menu_items')
        .insert(itemsToInsert)
        .select();

      if (insertError) {
        console.error('❌ Erro ao importar itens padrão:', insertError);
        throw insertError;
      }

      // Mapear os itens inseridos de volta para o formato do frontend
      const mappedItems = (data || []).map(mapRowToMenuItem);
      
      // Atualizar o estado com os novos itens
      setItems((prev) => [...prev, ...mappedItems]);
      
      return mappedItems;
    } catch (err) {
      console.error('Error importing default items:', err);
      throw err;
    }
  }, [isOwner, barId]);

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    refetch,
    importDefaultItems,
  };
};

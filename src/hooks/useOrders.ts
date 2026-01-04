import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type OrderStatus = 'pending' | 'approved' | 'preparing' | 'ready' | 'rejected' | 'cancelled' | 'refunded';

export interface OrderItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  subtotal: number;
  menu_items?: {
    id: string;
    name: string;
    image?: string;
  };
  menu_item?: {
    id: string;
    name: string;
    image?: string;
  };
}

export interface Order {
  id: string;
  bar_id: string;
  total_amount: number;
  status: OrderStatus;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

interface UseOrdersOptions {
  barId?: string;
  status?: OrderStatus[];
  enabled?: boolean;
}

export const useOrders = (options: UseOrdersOptions = {}) => {
  const { barId, status, enabled = true } = options;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client || !enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = client
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (
              id,
              name,
              image
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (barId) {
        query = query.eq('bar_id', barId);
      }

      if (status && status.length > 0) {
        query = query.in('status', status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setOrders((data as Order[]) || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch orders'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [barId, status, enabled]);

  useEffect(() => {
    fetchOrders();

    // Configurar Realtime subscription
    const client = getSupabaseClient();
    if (!client || !enabled) return;

    const channel: RealtimeChannel = client
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          ...(barId && { filter: `bar_id=eq.${barId}` }),
        },
        (payload) => {
          console.log('Order change detected:', payload);
          // Recarregar pedidos quando houver mudanças
          fetchOrders();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    // Também escutar mudanças em order_items (apenas se barId estiver definido)
    let itemsChannel: RealtimeChannel | null = null;
    if (barId) {
      itemsChannel = client
        .channel('order-items-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'order_items',
          },
          () => {
            console.log('Order items change detected');
            fetchOrders();
          }
        )
        .subscribe();
    }

    return () => {
      client.removeChannel(channel);
      if (itemsChannel) {
        client.removeChannel(itemsChannel);
      }
    };
  }, [fetchOrders, barId, enabled]);

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not available');
    }

    const { error: updateError } = await client
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (updateError) {
      throw updateError;
    }

    // Atualizar localmente
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  }, []);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    updateOrderStatus,
  };
};


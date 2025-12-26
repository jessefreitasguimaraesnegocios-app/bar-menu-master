import { getSupabaseClient } from '@/lib/supabase';
import type { CartItem } from '@/contexts/CartContext';

export interface CreatePaymentResponse {
  preference_id: string;
  init_point: string;
  sandbox_init_point?: string;
  order_id: string;
}

export interface PaymentError {
  error: string;
}

export interface OrderStatus {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded';
  total_amount: number;
  mp_preference_id?: string;
  mp_payment_id?: number;
  created_at: string;
}

/**
 * Cria um pagamento no Mercado Pago através da Edge Function
 */
export async function createPayment(
  cartItems: CartItem[],
  barId: string,
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  }
): Promise<CreatePaymentResponse> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase não está conectado');
  }

  // Preparar dados do pedido
  const items = cartItems.map((cartItem) => ({
    item_id: cartItem.item.id,
    quantity: cartItem.quantity,
    price: cartItem.item.price,
  }));

  const total = cartItems.reduce(
    (sum, cartItem) => sum + cartItem.item.price * cartItem.quantity,
    0
  );

  // Obter URL da Edge Function
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL não está configurado');
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  // Chamar Edge Function
  const response = await fetch(`${supabaseUrl}/functions/v1/create-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      bar_id: barId,
      items,
      total,
      customer_name: customerInfo?.name,
      customer_email: customerInfo?.email,
      customer_phone: customerInfo?.phone,
    }),
  });

  if (!response.ok) {
    const error: PaymentError = await response.json();
    throw new Error(error.error || 'Erro ao criar pagamento');
  }

  const data: CreatePaymentResponse = await response.json();
  return data;
}

/**
 * Verifica o status de um pedido
 */
export async function checkPaymentStatus(orderId: string): Promise<OrderStatus | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase não está conectado');
  }

  const { data, error } = await supabase
    .from('orders')
    .select('id, status, total_amount, mp_preference_id, mp_payment_id, created_at')
    .eq('id', orderId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as OrderStatus;
}

/**
 * Busca dados completos de um pedido incluindo itens
 */
export async function getOrderDetails(orderId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase não está conectado');
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error('Pedido não encontrado');
  }

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*, menu_items(*)')
    .eq('order_id', orderId);

  if (itemsError) {
    throw new Error('Erro ao buscar itens do pedido');
  }

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .single();

  return {
    order,
    items: items || [],
    payment: payment || null,
  };
}


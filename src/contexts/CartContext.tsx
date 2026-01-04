import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { MenuItem } from '@/data/menuData';
import { getSupabaseClient } from '@/lib/supabase';

interface CartItem extends MenuItem {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  getItemQuantity: (itemId: string) => number;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  total: number;
  itemCount: number;
  checkout: (barId: string, customerInfo?: { name?: string; email?: string; phone?: string }) => Promise<void>;
  isCheckingOut: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const addItem = useCallback((item: MenuItem, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      if (existingItem) {
        return prevItems.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prevItems, { ...item, quantity }];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((prevItems) => prevItems.filter((i) => i.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    );
  }, [removeItem]);

  const getItemQuantity = useCallback(
    (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      return item?.quantity || 0;
    },
    [items]
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const openCart = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleCart = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const checkout = useCallback(async (
    barId: string,
    customerInfo?: { name?: string; email?: string; phone?: string }
  ) => {
    if (items.length === 0) {
      throw new Error('Carrinho vazio');
    }

    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not available');
    }

    setIsCheckingOut(true);

    try {
      // Buscar informações do bar
      const { data: bar, error: barError } = await client
        .from('bars')
        .select('id, name, commission_rate')
        .eq('id', barId)
        .single();

      if (barError || !bar) {
        throw new Error(`Bar não encontrado: ${barError?.message || 'Bar ID inválido'}`);
      }

      // Criar pedido no banco de dados
      const orderItems = items.map(item => ({
        item_id: item.id,
        title: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      // Criar pedido antes de chamar a função de pagamento
      const { data: newOrder, error: orderError } = await client
        .from('orders')
        .insert({
          bar_id: barId,
          total_amount: totalAmount,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError || !newOrder) {
        console.error('Erro ao criar pedido:', orderError);
        // Continuar mesmo assim, pois o pedido pode ser criado depois
      }

      // Criar order_items se o pedido foi criado
      if (newOrder) {
        const orderItemsData = orderItems.map(item => ({
          order_id: newOrder.id,
          menu_item_id: item.item_id,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        }));

        const { error: orderItemsError } = await client
          .from('order_items')
          .insert(orderItemsData);
        
        if (orderItemsError) {
          console.error('Erro ao criar order_items:', orderItemsError);
          // Não falhar o fluxo se order_items falhar
        }
      }

      // Chamar função Edge para criar pagamento
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Configuração do Supabase não encontrada');
      }

      const functionUrl = `${supabaseUrl}/functions/v1/create-payment`;
      
      const requestBody = {
        bar_id: barId,
        items: orderItems.map(item => ({
          id: item.item_id,
          title: item.title,
          quantity: item.quantity,
          unit_price: item.price,
        })),
        commission_rate: bar.commission_rate || 0.06, // Taxa de comissão (padrão 6% se não configurado)
        payer: customerInfo ? {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone ? {
            area_code: customerInfo.phone.substring(0, 2),
            number: customerInfo.phone.substring(2),
          } : undefined,
        } : undefined,
        back_urls: {
          success: `${window.location.origin}/payment/success`,
          failure: `${window.location.origin}/payment/failure`,
          pending: `${window.location.origin}/payment/pending`,
        },
        auto_return: 'approved' as const,
        external_reference: newOrder?.id || `bar_${barId}_${Date.now()}`,
      };

      console.log('📤 Enviando requisição para create-payment:', {
        functionUrl,
        requestBody: { ...requestBody, items: requestBody.items.length + ' items' },
      });

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          const errorText = await response.text();
          errorData = JSON.parse(errorText);
        } catch {
          // Se não conseguir fazer parse, usar texto bruto
          errorData = { error: await response.text() };
        }
        
        const errorMessage = errorData.error || errorData.details || 'Erro ao processar pagamento';
        const fullError = errorData.details 
          ? `${errorMessage}\n\nDetalhes: ${errorData.details}`
          : errorMessage;
        console.error('❌ Erro na resposta da Edge Function:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(fullError);
      }

      const data = await response.json();
      console.log('✅ Dados recebidos da Edge Function:', {
        preferenceId: data.preferenceId,
        hasInitPoint: !!data.initPoint,
        hasSandboxInitPoint: !!data.sandboxInitPoint,
      });
      
      // A nova função retorna initPoint ou sandboxInitPoint
      const checkoutUrl = data.initPoint || data.sandboxInitPoint;
      
      if (checkoutUrl) {
        console.log('🔄 Redirecionando para checkout:', checkoutUrl);
        // Redirecionar para o checkout do Mercado Pago
        window.location.href = checkoutUrl;
      } else {
        console.error('❌ URL de checkout não encontrada na resposta:', data);
        throw new Error('URL de checkout não retornada pela função de pagamento');
      }
    } catch (error) {
      console.error('Erro no checkout:', error);
      throw error;
    } finally {
      setIsCheckingOut(false);
    }
  }, [items]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        getItemQuantity,
        clearCart,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        total,
        itemCount,
        checkout,
        isCheckingOut,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};



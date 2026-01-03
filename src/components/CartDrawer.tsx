import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Trash2, ShoppingBag, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const CartDrawer = () => {
  const { items, isCartOpen, closeCart, updateQuantity, removeItem, getTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setLoading(true);
    const supabase = getSupabaseClient();

    if (!supabase) {
      toast({
        title: 'Erro',
        description: 'Não foi possível conectar ao servidor',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      // Para simplificar, vamos usar o primeiro bar cadastrado
      // Em produção, o bar seria determinado pela rota /bar/:slug
      const { data: bars } = await supabase.from('bars').select('id').eq('active', true).limit(1);
      
      if (!bars || bars.length === 0) {
        toast({
          title: 'Erro',
          description: 'Nenhum estabelecimento disponível',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const barId = bars[0].id;
      const total = getTotal();

      // Criar o pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          bar_id: barId,
          total_amount: total,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Inserir itens do pedido
      const orderItems = items.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Chamar a edge function para criar o pagamento MP
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
        body: {
          order_id: order.id,
          items: items.map(item => ({
            id: item.id,
            title: item.name,
            quantity: item.quantity,
            unit_price: item.price,
          })),
          back_urls: {
            success: `${window.location.origin}/menu?status=success`,
            failure: `${window.location.origin}/menu?status=failure`,
            pending: `${window.location.origin}/menu?status=pending`,
          },
          auto_return: 'approved',
        },
      });

      if (paymentError) {
        console.error('Erro ao criar pagamento:', paymentError);
        throw paymentError;
      }

      if (paymentData?.init_point) {
        // Redirecionar para o Mercado Pago
        clearCart();
        closeCart();
        window.location.href = paymentData.init_point;
      } else {
        throw new Error('URL de pagamento não retornada');
      }
    } catch (error: any) {
      console.error('Erro no checkout:', error);
      toast({
        title: 'Erro no checkout',
        description: error.message || 'Não foi possível processar o pagamento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:max-w-lg bg-background border-l border-border/50 flex flex-col">
        <SheetHeader className="border-b border-border/30 pb-4">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Seu Carrinho
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <AnimatePresence mode="popLayout">
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-muted-foreground"
              >
                <ShoppingBag className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-lg">Seu carrinho está vazio</p>
                <p className="text-sm">Adicione itens do cardápio</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-3 p-3 rounded-lg bg-card border border-border/30"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{item.name}</h4>
                      <p className="text-sm text-primary font-semibold">
                        R$ {item.price.toFixed(2)}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 ml-auto text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {items.length > 0 && (
          <SheetFooter className="border-t border-border/30 pt-4 flex-col gap-3">
            <div className="flex justify-between items-center w-full">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="text-xl font-bold text-primary">
                R$ {getTotal().toFixed(2)}
              </span>
            </div>
            
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={clearCart}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Finalizar Pedido'
                )}
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
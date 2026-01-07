import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Trash2, ShoppingBag, X, Loader2, CreditCard, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Link, useParams } from 'react-router-dom';
import { useBar } from '@/hooks/useBar';
import { useAuth } from '@/contexts/AuthContext';

const CartDrawer = () => {
  const { items, isOpen, closeCart, updateQuantity, removeItem, total, clearCart, checkout, isCheckingOut } = useCart();
  const { toast } = useToast();
  const { slug } = useParams<{ slug?: string }>();
  const { bar: barBySlug, loading: barLoading } = useBar(slug || undefined);
  const { barId: authBarId } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'checkout'>('pix');
  
  // Determinar barId: prioridade para bar da URL (slug), senão usar do auth
  const currentBarId = barBySlug?.id || authBarId;

  const handleCheckout = async () => {
    if (barLoading) {
      toast({
        title: 'Aguarde',
        description: 'Carregando informações do estabelecimento...',
        variant: 'default',
      });
      return;
    }

    if (!currentBarId) {
      console.error('BarId não encontrado:', { slug, barBySlug, authBarId });
      toast({
        title: 'Erro',
        description: 'Não foi possível identificar o estabelecimento. Por favor, acesse o cardápio através de um link válido do estabelecimento.',
        variant: 'destructive',
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Carrinho vazio',
        description: 'Adicione itens ao carrinho antes de finalizar o pedido.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Iniciando checkout com barId:', currentBarId, 'método:', paymentMethod);
      await checkout(currentBarId, paymentMethod);
    } catch (error: any) {
      console.error('Erro no checkout:', error);
      const errorMessage = error?.message || 'Não foi possível processar o pagamento. Tente novamente.';
      toast({
        title: 'Erro ao processar pagamento',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
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
                R$ {total.toFixed(2)}
              </span>
            </div>

            {/* Seleção de método de pagamento */}
            <div className="w-full space-y-2">
              <Label className="text-sm font-medium">Forma de pagamento</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as 'pix' | 'checkout')}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pix" id="pix" />
                  <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer">
                    <QrCode className="h-4 w-4" />
                    PIX
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="checkout" id="checkout" />
                  <Label htmlFor="checkout" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="h-4 w-4" />
                    Cartão
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={clearCart}
                disabled={isCheckingOut}
              >
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleCheckout}
                disabled={isCheckingOut || !currentBarId || items.length === 0 || barLoading}
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : !currentBarId ? (
                  'Aguardando estabelecimento...'
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
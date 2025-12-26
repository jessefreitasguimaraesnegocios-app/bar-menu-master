import { useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCart } from '@/contexts/CartContext';
import { useBar } from '@/contexts/BarContext';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { createPayment } from '@/services/paymentService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const CartDrawer = () => {
  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems, clearCart } = useCart();
  const { getCurrentBarId } = useBar();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  const handleCheckout = async () => {
    const barId = getCurrentBarId();
    
    if (!barId) {
      toast({
        title: 'Erro',
        description: 'Bar não identificado. Por favor, selecione um bar.',
        variant: 'destructive',
      });
      return;
    }

    if (items.length === 0) {
      return;
    }

    setIsProcessing(true);

    try {
      const paymentData = await createPayment(items, barId);
      
      // Redirecionar para o checkout do Mercado Pago
      // Usar sandbox_init_point em desenvolvimento se disponível
      const checkoutUrl = paymentData.sandbox_init_point || paymentData.init_point;
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error('Erro ao criar pagamento:', error);
      toast({
        title: 'Erro ao processar pagamento',
        description: error.message || 'Não foi possível criar o pagamento. Tente novamente.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Carrinho de compras"
        >
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="glass border-border/50 w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl">Carrinho</SheetTitle>
          <SheetDescription>
            {totalItems > 0
              ? `${totalItems} ${totalItems === 1 ? 'item' : 'itens'} no carrinho`
              : 'Seu carrinho está vazio'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg mb-2">Seu carrinho está vazio</p>
              <p className="text-muted-foreground/70 text-sm">
                Adicione itens do cardápio para começar
              </p>
            </div>
          ) : (
            <>
              {/* Lista de Itens */}
              <div className="space-y-4">
                {items.map((cartItem) => (
                  <div
                    key={cartItem.item.id}
                    className="flex gap-4 p-4 rounded-lg glass border border-border/50"
                  >
                    {/* Imagem */}
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                      <img
                        src={cartItem.item.image}
                        alt={cartItem.item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Informações do Item */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1 truncate">{cartItem.item.name}</h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        R$ {cartItem.item.price.toFixed(2)}
                      </p>

                      {/* Controles de Quantidade */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {cartItem.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 ml-auto text-destructive hover:text-destructive"
                          onClick={() => removeItem(cartItem.item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Total e Ações */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-primary">R$ {totalPrice.toFixed(2)}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={clearCart}
                    disabled={items.length === 0}
                  >
                    Limpar Carrinho
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleCheckout}
                    disabled={items.length === 0 || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      'Finalizar Pagamento'
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;


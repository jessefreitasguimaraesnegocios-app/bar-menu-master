import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getOrderDetails } from '@/services/paymentService';
import { useCart } from '@/contexts/CartContext';

interface OrderDetails {
  order: {
    id: string;
    status: string;
    total_amount: number;
    created_at: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    subtotal: number;
    menu_items: {
      name: string;
      image: string;
    };
  }>;
  payment: any;
}

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const orderId = searchParams.get('order_id');
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('ID do pedido não fornecido');
      setLoading(false);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const details = await getOrderDetails(orderId);
        setOrderDetails(details);
        
        // Limpar carrinho após pagamento bem-sucedido
        if (details.order.status === 'approved') {
          clearCart();
        }
      } catch (err: any) {
        console.error('Erro ao buscar detalhes do pedido:', err);
        setError(err.message || 'Erro ao carregar detalhes do pedido');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, clearCart]);

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Processando Pagamento | Cantim</title>
        </Helmet>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="pt-24 pb-16">
            <div className="container mx-auto px-4">
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Processando pagamento...</p>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  if (error || !orderDetails) {
    return (
      <>
        <Helmet>
          <title>Erro no Pagamento | Cantim</title>
        </Helmet>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="pt-24 pb-16">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl mx-auto text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h1 className="text-3xl font-bold text-destructive">Erro</h1>
                  <p className="text-muted-foreground">{error || 'Pedido não encontrado'}</p>
                  <Button onClick={() => navigate('/menu')}>
                    Voltar ao Cardápio
                  </Button>
                </motion.div>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  const isApproved = orderDetails.order.status === 'approved';

  return (
    <>
      <Helmet>
        <title>Pagamento {isApproved ? 'Aprovado' : 'Processando'} | Cantim</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="text-center space-y-4">
                  {isApproved ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', duration: 0.5 }}
                      className="flex justify-center"
                    >
                      <div className="rounded-full bg-primary/10 p-4">
                        <CheckCircle2 className="h-16 w-16 text-primary" />
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex justify-center">
                      <Loader2 className="h-16 w-16 text-primary animate-spin" />
                    </div>
                  )}
                  <h1 className="font-serif text-4xl font-bold">
                    {isApproved ? 'Pagamento Aprovado!' : 'Pagamento em Processamento'}
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    {isApproved
                      ? 'Seu pedido foi confirmado e está sendo preparado.'
                      : 'Aguardando confirmação do pagamento...'}
                  </p>
                </div>

                {/* Order Details */}
                <div className="glass border border-border/50 rounded-xl p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-4">Detalhes do Pedido</h2>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Número do Pedido:</span>
                        <span className="font-mono">{orderDetails.order.id.substring(0, 8)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="capitalize">{orderDetails.order.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Data:</span>
                        <span>{new Date(orderDetails.order.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Items */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Itens do Pedido</h3>
                    <div className="space-y-4">
                      {orderDetails.items.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <img
                            src={item.menu_items.image}
                            alt={item.menu_items.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item.menu_items.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity}x R$ {item.price.toFixed(2)}
                            </p>
                          </div>
                          <p className="font-semibold">
                            R$ {item.subtotal.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Total */}
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-primary">
                      R$ {orderDetails.order.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate('/menu')}
                  >
                    Continuar Comprando
                  </Button>
                  {!isApproved && (
                    <Button
                      className="flex-1"
                      onClick={() => {
                        if (orderId) {
                          window.location.reload();
                        }
                      }}
                    >
                      Atualizar Status
                    </Button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default PaymentSuccess;


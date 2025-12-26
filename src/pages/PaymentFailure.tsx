import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { getOrderDetails, checkPaymentStatus } from '@/services/paymentService';

const PaymentFailure = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order_id');
  const [orderStatus, setOrderStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('ID do pedido não fornecido');
      setLoading(false);
      return;
    }

    const fetchOrderStatus = async () => {
      try {
        const status = await checkPaymentStatus(orderId);
        setOrderStatus(status);
      } catch (err: any) {
        console.error('Erro ao buscar status do pedido:', err);
        setError(err.message || 'Erro ao carregar status do pedido');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderStatus();
  }, [orderId]);

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Verificando Pagamento | Cantim</title>
        </Helmet>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="pt-24 pb-16">
            <div className="container mx-auto px-4">
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Verificando status do pagamento...</p>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Pagamento Não Aprovado | Cantim</title>
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
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                    className="flex justify-center"
                  >
                    <div className="rounded-full bg-destructive/10 p-4">
                      <XCircle className="h-16 w-16 text-destructive" />
                    </div>
                  </motion.div>
                  <h1 className="font-serif text-4xl font-bold text-destructive">
                    Pagamento Não Aprovado
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    O pagamento não pôde ser processado. Por favor, tente novamente.
                  </p>
                </div>

                {/* Order Info */}
                {orderStatus && (
                  <div className="glass border border-border/50 rounded-xl p-6 space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Número do Pedido:</span>
                        <span className="font-mono">{orderStatus.id.substring(0, 8)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="capitalize">{orderStatus.status}</span>
                      </div>
                      {orderStatus.total_amount && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valor:</span>
                          <span>R$ {orderStatus.total_amount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="glass border border-destructive/50 bg-destructive/10 rounded-xl p-4">
                    <p className="text-destructive">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-4">
                  <Button
                    className="w-full"
                    onClick={() => navigate('/menu')}
                  >
                    Voltar ao Cardápio
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // Limpar carrinho e voltar para o cardápio
                      navigate('/menu');
                    }}
                  >
                    Tentar Novamente
                  </Button>
                </div>

                {/* Help Text */}
                <div className="text-center text-sm text-muted-foreground space-y-2">
                  <p>
                    Se você já realizou o pagamento, aguarde alguns instantes.
                    O status será atualizado automaticamente.
                  </p>
                  <p>
                    Em caso de dúvidas, entre em contato conosco.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default PaymentFailure;


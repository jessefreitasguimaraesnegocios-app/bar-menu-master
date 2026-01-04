import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHat, Clock, Package, RefreshCw, Filter } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrders, type OrderStatus } from '@/hooks/useOrders';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import OrderCard from '@/components/OrderCard';
import { Skeleton } from '@/components/ui/skeleton';

const StaffPortal = () => {
  const navigate = useNavigate();
  const { isOwner, barId, user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Determinar quais status buscar baseado na aba ativa
  const getStatusFilter = (): OrderStatus[] | undefined => {
    switch (activeTab) {
      case 'pending':
        return ['pending', 'approved'];
      case 'preparing':
        return ['preparing'];
      case 'ready':
        return ['ready'];
      default:
        return undefined; // Todos os status
    }
  };

  const { orders, loading, error, refetch, updateOrderStatus } = useOrders({
    barId: barId || undefined,
    status: getStatusFilter(),
    enabled: !!barId,
  });

  // Verificar acesso
  useEffect(() => {
    if (user) {
      const timeoutId = setTimeout(() => {
        if (!isOwner && !barId) {
          toast({
            title: 'Acesso negado',
            description: 'Apenas proprietários podem acessar o painel do staff.',
            variant: 'destructive',
          });
          navigate('/');
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [user, isOwner, barId, navigate, toast]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdatingOrderId(orderId);
      await updateOrderStatus(orderId, newStatus);
      toast({
        title: 'Status atualizado',
        description: `Pedido atualizado para "${getStatusLabel(newStatus)}"`,
      });
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível atualizar o status do pedido',
        variant: 'destructive',
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusLabel = (status: OrderStatus): string => {
    const labels: Record<OrderStatus, string> = {
      pending: 'Pendente',
      approved: 'Aprovado',
      preparing: 'Preparando',
      ready: 'Pronto',
      rejected: 'Rejeitado',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado',
    };
    return labels[status];
  };

  // Contar pedidos por status
  const pendingCount = orders.filter((o) => o.status === 'pending' || o.status === 'approved').length;
  const preparingCount = orders.filter((o) => o.status === 'preparing').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;

  if (!barId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">
                  Carregando informações do estabelecimento...
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Painel do Staff | Cantim</title>
        <meta name="description" content="Visualize e gerencie pedidos em tempo real" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
                <ChefHat className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Painel do Staff</span>
              </div>

              <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
                Pedidos em <span className="text-primary glow-text">Tempo Real</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6">
                Visualize e gerencie todos os pedidos do seu estabelecimento
              </p>

              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={loading}
                className="mb-4"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
            >
              <Card className="glass border-yellow-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {pendingCount}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass border-orange-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ChefHat className="h-4 w-4" />
                    Preparando
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {preparingCount}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass border-green-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Prontos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {readyCount}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Todos ({orders.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pendentes ({pendingCount})
                </TabsTrigger>
                <TabsTrigger value="preparing" className="flex items-center gap-2">
                  <ChefHat className="h-4 w-4" />
                  Preparando ({preparingCount})
                </TabsTrigger>
                <TabsTrigger value="ready" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Prontos ({readyCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4">
                {error && (
                  <Card className="border-destructive">
                    <CardContent className="pt-6">
                      <p className="text-destructive">
                        {error.message || 'Erro ao carregar pedidos'}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="glass">
                        <CardHeader>
                          <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-20 w-full mb-2" />
                          <Skeleton className="h-20 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <Card className="glass">
                    <CardContent className="pt-12 pb-12 text-center">
                      <ChefHat className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-lg font-semibold mb-2">Nenhum pedido encontrado</p>
                      <p className="text-muted-foreground">
                        {activeTab === 'all'
                          ? 'Ainda não há pedidos registrados'
                          : `Não há pedidos com status "${getStatusLabel(activeTab as OrderStatus)}"`}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onStatusChange={handleStatusChange}
                        isUpdating={updatingOrderId === order.id}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </>
  );
};

export default StaffPortal;


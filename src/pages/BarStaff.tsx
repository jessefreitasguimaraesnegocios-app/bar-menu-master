import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient } from '@/lib/supabase';
import { Clock, ChefHat, CheckCircle2, Package, RefreshCw, Truck, History, Search, Calendar } from 'lucide-react';
import { format, startOfDay, endOfDay, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type KitchenStatus = 'pending' | 'preparing' | 'ready' | 'delivered';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  subtotal: number;
  menu_item: {
    name: string;
    image: string;
  };
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  kitchen_status: KitchenStatus;
  customer_name: string | null;
  notes: string | null;
  created_at: string;
  order_items: OrderItem[];
}

const statusConfig: Record<KitchenStatus, { label: string; icon: typeof Clock; color: string; bgColor: string }> = {
  pending: {
    label: 'Pendente',
    icon: Clock,
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    bgColor: 'bg-amber-500/10',
  },
  preparing: {
    label: 'Preparando',
    icon: ChefHat,
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    bgColor: 'bg-blue-500/10',
  },
  ready: {
    label: 'Pronto',
    icon: CheckCircle2,
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    bgColor: 'bg-green-500/10',
  },
  delivered: {
    label: 'Entregue',
    icon: Truck,
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    bgColor: 'bg-purple-500/10',
  },
};

const BarStaff = () => {
  const { slug } = useParams<{ slug: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [bar, setBar] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const supabase = getSupabaseClient();

  useEffect(() => {
    fetchBar();
  }, [slug]);

  useEffect(() => {
    if (bar) {
      fetchOrders();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [bar]);

  useEffect(() => {
    if (bar && activeTab === 'history') {
      fetchHistoryOrders();
    }
  }, [bar, activeTab]);

  const fetchBar = async () => {
    if (!supabase || !slug) return;

    try {
      const { data, error } = await supabase
        .from('bars')
        .select('id, name')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      setBar(data);
    } catch (error) {
      console.error('Erro ao buscar bar:', error);
      toast({
        title: 'Erro',
        description: 'Bar não encontrado',
        variant: 'destructive',
      });
    }
  };

  const fetchOrders = async () => {
    if (!supabase || !bar) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          kitchen_status,
          customer_name,
          notes,
          created_at,
          order_items (
            id,
            quantity,
            price,
            subtotal,
            bar_menu_items (
              name,
              image
            )
          )
        `)
        .eq('bar_id', bar.id)
        .in('kitchen_status', ['pending', 'preparing', 'ready'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const transformedOrders = (data || []).map((order: any) => ({
        ...order,
        order_items: order.order_items?.map((item: any) => ({
          ...item,
          menu_item: item.bar_menu_items || { name: 'Item', image: '' },
        })) || [],
      }));
      
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryOrders = async () => {
    if (!supabase || !bar) return;

    setHistoryLoading(true);
    try {
      const today = new Date();
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          kitchen_status,
          customer_name,
          notes,
          created_at,
          order_items (
            id,
            quantity,
            price,
            subtotal,
            bar_menu_items (
              name,
              image
            )
          )
        `)
        .eq('bar_id', bar.id)
        .gte('created_at', startOfDay(today).toISOString())
        .lte('created_at', endOfDay(today).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedOrders = (data || []).map((order: any) => ({
        ...order,
        order_items: order.order_items?.map((item: any) => ({
          ...item,
          menu_item: item.bar_menu_items || { name: 'Item', image: '' },
        })) || [],
      }));
      
      setHistoryOrders(transformedOrders);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!supabase || !bar) return;

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `bar_id=eq.${bar.id}`,
        },
        (payload) => {
          console.log('Realtime update:', payload);
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateKitchenStatus = async (orderId: string, newStatus: KitchenStatus) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ kitchen_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: `Pedido movido para ${statusConfig[newStatus].label}`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
        variant: 'destructive',
      });
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}min`;
  };

  const filteredOrders = useMemo(() => {
    if (activeTab === 'history') return [];
    return orders.filter(order => order.kitchen_status === activeTab);
  }, [orders, activeTab]);

  const filteredHistoryOrders = useMemo(() => {
    let filtered = historyOrders;
    
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.order_items.some(item => 
          item.menu_item?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.kitchen_status === statusFilter);
    }
    
    return filtered;
  }, [historyOrders, searchTerm, statusFilter]);

  const orderCounts = {
    pending: orders.filter(o => o.kitchen_status === 'pending').length,
    preparing: orders.filter(o => o.kitchen_status === 'preparing').length,
    ready: orders.filter(o => o.kitchen_status === 'ready').length,
  };

  const historyStats = useMemo(() => {
    const total = historyOrders.length;
    const delivered = historyOrders.filter(o => o.kitchen_status === 'delivered').length;
    const totalRevenue = historyOrders
      .filter(o => o.kitchen_status === 'delivered')
      .reduce((sum, o) => sum + o.total_amount, 0);
    return { total, delivered, totalRevenue };
  }, [historyOrders]);

  if (!bar && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Bar não encontrado</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Cozinha - {bar?.name || 'Carregando...'}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <main className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ChefHat className="h-8 w-8 text-primary" />
              <div>
                <h1 className="font-serif text-2xl font-bold">{bar?.name}</h1>
                <p className="text-sm text-muted-foreground">Painel da Cozinha</p>
              </div>
            </div>
            <Button variant="outline" onClick={fetchOrders} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>

          {/* Status Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full max-w-xl">
              <TabsTrigger value="pending" className="gap-1 text-xs sm:text-sm">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Pendentes</span>
                {orderCounts.pending > 0 && (
                  <Badge variant="secondary" className="ml-1">{orderCounts.pending}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="preparing" className="gap-1 text-xs sm:text-sm">
                <ChefHat className="h-4 w-4" />
                <span className="hidden sm:inline">Preparando</span>
                {orderCounts.preparing > 0 && (
                  <Badge variant="secondary" className="ml-1">{orderCounts.preparing}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="ready" className="gap-1 text-xs sm:text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span className="hidden sm:inline">Prontos</span>
                {orderCounts.ready > 0 && (
                  <Badge variant="secondary" className="ml-1">{orderCounts.ready}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1 text-xs sm:text-sm">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Histórico</span>
              </TabsTrigger>
            </TabsList>

            {/* Active Orders Grid */}
            {activeTab !== 'history' && (
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                  >
                    <Package className="h-16 w-16 mb-4 opacity-30" />
                    <p className="text-lg">Nenhum pedido {statusConfig[activeTab as KitchenStatus]?.label.toLowerCase()}</p>
                  </motion.div>
                ) : (
                  <motion.div
                    layout
                    className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                  >
                    {filteredOrders.map((order) => {
                      const StatusIcon = statusConfig[order.kitchen_status].icon;
                      return (
                        <motion.div
                          key={order.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card className={`border-2 ${statusConfig[order.kitchen_status].bgColor} overflow-hidden`}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-mono">
                                  #{order.id.slice(0, 8).toUpperCase()}
                                </CardTitle>
                                <Badge className={statusConfig[order.kitchen_status].color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig[order.kitchen_status].label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {getTimeAgo(order.created_at)}
                                {order.customer_name && (
                                  <>
                                    <span>•</span>
                                    <span>{order.customer_name}</span>
                                  </>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2">
                                {order.order_items?.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-3 p-2 rounded-lg bg-background/50"
                                  >
                                    {item.menu_item?.image && (
                                      <img
                                        src={item.menu_item.image}
                                        alt={item.menu_item?.name}
                                        className="w-10 h-10 object-cover rounded"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">
                                        {item.menu_item?.name || 'Item'}
                                      </p>
                                    </div>
                                    <Badge variant="outline" className="text-lg font-bold">
                                      x{item.quantity}
                                    </Badge>
                                  </div>
                                ))}
                              </div>

                              {order.notes && (
                                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                  <p className="text-sm text-amber-400">📝 {order.notes}</p>
                                </div>
                              )}

                              <div className="flex gap-2">
                                {order.kitchen_status === 'pending' && (
                                  <Button
                                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                                    onClick={() => updateKitchenStatus(order.id, 'preparing')}
                                  >
                                    <ChefHat className="h-4 w-4 mr-2" />
                                    Preparar
                                  </Button>
                                )}
                                {order.kitchen_status === 'preparing' && (
                                  <Button
                                    className="flex-1 bg-green-500 hover:bg-green-600"
                                    onClick={() => updateKitchenStatus(order.id, 'ready')}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Pronto
                                  </Button>
                                )}
                                {order.kitchen_status === 'ready' && (
                                  <Button
                                    className="flex-1 bg-purple-500 hover:bg-purple-600"
                                    onClick={() => updateKitchenStatus(order.id, 'delivered')}
                                  >
                                    <Truck className="h-4 w-4 mr-2" />
                                    Entregar
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{historyStats.total}</div>
                      <p className="text-sm text-muted-foreground">Pedidos hoje</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-500/10">
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-purple-400">{historyStats.delivered}</div>
                      <p className="text-sm text-muted-foreground">Entregues</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-500/10">
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-green-400">
                        R$ {historyStats.totalRevenue.toFixed(2)}
                      </div>
                      <p className="text-sm text-muted-foreground">Faturamento</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por ID, cliente ou item..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="preparing">Preparando</SelectItem>
                      <SelectItem value="ready">Prontos</SelectItem>
                      <SelectItem value="delivered">Entregues</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* History List */}
                {historyLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : filteredHistoryOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Calendar className="h-16 w-16 mb-4 opacity-30" />
                    <p className="text-lg">Nenhum pedido encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredHistoryOrders.map((order) => {
                      const StatusIcon = statusConfig[order.kitchen_status].icon;
                      return (
                        <Card key={order.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-sm">
                                  #{order.id.slice(0, 8).toUpperCase()}
                                </span>
                                <Badge className={statusConfig[order.kitchen_status].color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig[order.kitchen_status].label}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">R$ {order.total_amount.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(parseISO(order.created_at), "HH:mm", { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {order.order_items?.map((item) => (
                                <Badge key={item.id} variant="outline" className="text-xs">
                                  {item.quantity}x {item.menu_item?.name || 'Item'}
                                </Badge>
                              ))}
                            </div>
                            {order.customer_name && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Cliente: {order.customer_name}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </Tabs>
        </div>
      </main>
    </>
  );
};

export default BarStaff;

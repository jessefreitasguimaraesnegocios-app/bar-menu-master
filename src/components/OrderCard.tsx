import { motion } from 'framer-motion';
import { Clock, CheckCircle2, ChefHat, Package, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Order, OrderStatus } from '@/hooks/useOrders';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
  isUpdating?: boolean;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pendente',
    color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/50',
    icon: <Clock className="h-4 w-4" />,
  },
  approved: {
    label: 'Aprovado',
    color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/50',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  preparing: {
    label: 'Preparando',
    color: 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/50',
    icon: <ChefHat className="h-4 w-4" />,
  },
  ready: {
    label: 'Pronto',
    color: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50',
    icon: <Package className="h-4 w-4" />,
  },
  rejected: {
    label: 'Rejeitado',
    color: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/50',
    icon: <XCircle className="h-4 w-4" />,
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/50',
    icon: <XCircle className="h-4 w-4" />,
  },
  refunded: {
    label: 'Reembolsado',
    color: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/50',
    icon: <XCircle className="h-4 w-4" />,
  },
};

const OrderCard = ({ order, onStatusChange, isUpdating = false }: OrderCardProps) => {
  const statusInfo = statusConfig[order.status];
  const timeAgo = formatDistanceToNow(new Date(order.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const getNextStatus = (): OrderStatus | null => {
    switch (order.status) {
      case 'pending':
      case 'approved':
        return 'preparing';
      case 'preparing':
        return 'ready';
      default:
        return null;
    }
  };

  const nextStatus = getNextStatus();
  const canUpdate = nextStatus !== null && (order.status === 'pending' || order.status === 'approved' || order.status === 'preparing');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
    >
      <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={statusInfo.color}>
                  <span className="mr-1">{statusInfo.icon}</span>
                  {statusInfo.label}
                </Badge>
                <span className="text-sm text-muted-foreground">#{order.id.slice(0, 8)}</span>
              </div>
              <p className="text-sm text-muted-foreground">{timeAgo}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                R$ {order.total_amount.toFixed(2)}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Itens do pedido */}
          <div className="space-y-2">
            {order.order_items && order.order_items.length > 0 ? (
              order.order_items.map((item) => {
                const menuItem = (item as any).menu_items || (item as any).menu_item;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                  >
                    {menuItem?.image && (
                      <img
                        src={menuItem.image}
                        alt={menuItem.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {menuItem?.name || 'Item não encontrado'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity}x R$ {item.price.toFixed(2)} = R$ {item.subtotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">Carregando itens...</p>
            )}
          </div>

          {/* Informações do cliente */}
          {(order.customer_name || order.customer_phone) && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-sm font-medium mb-1">Cliente:</p>
              {order.customer_name && (
                <p className="text-sm text-muted-foreground">{order.customer_name}</p>
              )}
              {order.customer_phone && (
                <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
              )}
            </div>
          )}

          {/* Notas */}
          {order.notes && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-sm font-medium mb-1">Observações:</p>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}

          {/* Botões de ação */}
          {canUpdate && (
            <div className="pt-2 border-t border-border/50">
              <Button
                onClick={() => nextStatus && onStatusChange(order.id, nextStatus)}
                disabled={isUpdating}
                className="w-full"
                variant={order.status === 'preparing' ? 'default' : 'outline'}
              >
                {order.status === 'pending' || order.status === 'approved'
                  ? 'Iniciar Preparação'
                  : order.status === 'preparing'
                  ? 'Marcar como Pronto'
                  : 'Atualizar Status'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OrderCard;


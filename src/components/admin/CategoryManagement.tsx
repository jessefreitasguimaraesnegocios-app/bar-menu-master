import { useState, useEffect, useMemo } from 'react';
import { Loader2, CheckCircle2, XCircle, Package, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient } from '@/lib/supabase';
import { categories, Category } from '@/data/menuData';
import { useBarCategories } from '@/hooks/useBarCategories';
import { useCustomCategories } from '@/hooks/useCustomCategories';

interface Bar {
  id: string;
  name: string;
}

interface CategoryManagementProps {
  bars: Bar[];
}

type CategoryStatus = 'unavailable' | 'available' | 'in_use';

const CategoryManagement = ({ bars }: CategoryManagementProps) => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [expandedBars, setExpandedBars] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { getAllCategoriesForBar, setCategoryStatus: saveCategoryStatus } = useBarCategories();
  const { customCategories } = useCustomCategories();

  // Combinar categorias padrão com customizadas
  const allCategories = useMemo(() => {
    const defaultCats = categories.map(cat => ({
      id: cat.id,
      label: cat.label,
      icon: cat.icon,
    }));
    const customCats = customCategories.map(cat => ({
      id: cat.id,
      label: cat.label,
      icon: cat.icon,
    }));
    return [...defaultCats, ...customCats];
  }, [customCategories]);

  useEffect(() => {
    if (bars.length > 0) {
      fetchAvailability();
    }
  }, [bars.length]);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      // As configurações são carregadas do localStorage via hook useBarCategories
      // Não precisamos fazer fetch aqui, apenas marcar como carregado
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching category availability:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a disponibilidade das categorias.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const cycleCategoryStatus = (barId: string, category: Category) => {
    // Prevenir múltiplos cliques simultâneos
    const saveKey = `${barId}-${category}`;
    if (isSaving === saveKey) return;
    
    setIsSaving(saveKey);
    
    try {
      // Calcular o próximo status baseado no estado atual
      const barCategories = getAllCategoriesForBar(barId);
      const currentStatus = barCategories[category as string] || 'unavailable';
      const statusCycle: CategoryStatus[] = ['unavailable', 'available', 'in_use'];
      const currentIndex = statusCycle.indexOf(currentStatus);
      const nextIndex = (currentIndex + 1) % statusCycle.length;
      const nextStatus = statusCycle[nextIndex];

      // Salvar no hook (que salva no localStorage)
      saveCategoryStatus(barId, category as string, nextStatus);
      
      // Log para debug
      console.log(`Category ${category} for bar ${barId}: ${currentStatus} -> ${nextStatus}`);

      const bar = bars.find((b) => b.id === barId);
      const categoryLabel = allCategories.find((c) => c.id === category)?.label || category;
      
      let statusMessage = '';
      switch (nextStatus) {
        case 'unavailable':
          statusMessage = 'indisponível';
          break;
        case 'available':
          statusMessage = 'disponível para adicionar';
          break;
        case 'in_use':
          statusMessage = 'em uso (aparece para o bar)';
          break;
      }
      
      toast({
        title: 'Status atualizado',
        description: `${categoryLabel} agora está ${statusMessage} para ${bar?.name}`,
      });

      // TODO: Salvar no banco quando a tabela bar_category_availability for criada
      // Por enquanto, apenas atualizamos o estado local
    } catch (error: any) {
      console.error('Error updating category status:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    } finally {
      // Pequeno delay para garantir que o estado foi atualizado
      setTimeout(() => setIsSaving(null), 300);
    }
  };

  const toggleBar = (barId: string) => {
    setExpandedBars(prev => ({
      ...prev,
      [barId]: !prev[barId],
    }));
  };

  const getStatusConfig = (status: CategoryStatus) => {
    switch (status) {
      case 'unavailable':
        return {
          label: 'Indisponível',
          bgColor: 'bg-gray-100/5',
          borderColor: 'border-gray-300/30',
          textColor: 'text-gray-500',
          icon: XCircle,
          iconColor: 'text-gray-400',
        };
      case 'available':
        return {
          label: 'Disponível',
          bgColor: 'bg-blue-500/5',
          borderColor: 'border-blue-500/30',
          textColor: 'text-blue-600',
          icon: Circle,
          iconColor: 'text-blue-500',
        };
      case 'in_use':
        return {
          label: 'Em uso',
          bgColor: 'bg-green-500/5',
          borderColor: 'border-green-500/30',
          textColor: 'text-green-600',
          icon: CheckCircle2,
          iconColor: 'text-green-500',
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold mb-2">Gerenciar Categorias</h2>
        <p className="text-muted-foreground">
          Controle quais categorias estão disponíveis para cada bar
        </p>
      </div>

      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle>Disponibilidade de Categorias por Bar</CardTitle>
          <CardDescription>
            Clique em um bar para ver e gerenciar suas categorias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {bars.map((bar) => {
              const isExpanded = expandedBars[bar.id];
              const barCategories = getAllCategoriesForBar(bar.id);
              const inUseCount = Object.values(barCategories).filter((s) => s === 'in_use').length;
              const availableCount = Object.values(barCategories).filter((s) => s === 'available').length;
              const unavailableCount = Object.values(barCategories).filter((s) => s === 'unavailable').length;

              return (
                <div key={bar.id} className="border rounded-lg overflow-hidden">
                  {/* Header do Bar - sempre visível */}
                  <button
                    onClick={() => toggleBar(bar.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <h3 className="font-semibold text-lg">{bar.name}</h3>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      {inUseCount} em uso • {availableCount} disponíveis • {unavailableCount} indisponíveis
                    </Badge>
                  </button>

                  {/* Categorias - apenas quando expandido */}
                  {isExpanded && (
                    <div className="p-4 pt-0 border-t bg-muted/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                        {allCategories.map((category) => {
                          const status = barCategories[category.id] || 'unavailable';
                          const saving = isSaving === `${bar.id}-${category.id}`;
                          const config = getStatusConfig(status);
                          const StatusIcon = config.icon;

                          return (
                            <Button
                              key={category.id}
                              variant="ghost"
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                cycleCategoryStatus(bar.id, category.id);
                              }}
                              disabled={saving}
                              className={`h-auto p-4 rounded-lg border-2 transition-all justify-start items-start cursor-pointer ${
                                config.borderColor
                              } ${config.bgColor} hover:opacity-80 hover:scale-[1.02]`}
                            >
                              <div className="w-full">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl">{category.icon}</span>
                                    <span className="font-medium">{category.label}</span>
                                  </div>
                                  {saving ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                  ) : (
                                    <StatusIcon className={`h-5 w-5 ${config.iconColor}`} />
                                  )}
                                </div>
                                <div className={`text-sm font-medium ${config.textColor} text-left`}>
                                  {config.label}
                                </div>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {bars.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum bar cadastrado ainda.</p>
              <p className="text-sm mt-2">
                Cadastre bares primeiro para gerenciar categorias.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle>Sobre o Gerenciamento de Categorias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              • <strong>Indisponível</strong>: A categoria não está disponível para este bar e não aparecerá.
            </p>
            <p>
              • <strong>Disponível</strong>: A categoria está disponível e pode ser adicionada ao bar.
            </p>
            <p>
              • <strong>Em uso</strong>: A categoria está ativa e aparecerá no cardápio do bar para os clientes.
            </p>
            <p className="mt-3 pt-3 border-t">
              💡 <strong>Dica:</strong> Clique na categoria para alternar entre os estados (Indisponível → Disponível → Em uso).
            </p>
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-semibold text-primary mb-1">
                ⚡ Importante:
              </p>
              <p className="text-xs text-muted-foreground">
                Apenas categorias com status <strong>"Em uso"</strong> aparecerão no cardápio do bar para os clientes. 
                Categorias "Disponíveis" ou "Indisponíveis" não serão exibidas publicamente.
              </p>
            </div>
            <p className="text-xs mt-4 text-muted-foreground/70">
              Nota: Para persistência completa, será necessário criar uma tabela{' '}
              <code>bar_category_availability</code> no banco de dados.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryManagement;


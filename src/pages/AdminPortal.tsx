import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  Settings,
  Package,
  LayoutDashboard,
  Plus,
  Edit3,
  Trash2,
  Loader2,
  ShoppingBag,
  Palette,
  RefreshCw,
  Type,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient } from '@/lib/supabase';
import { useMenuItems } from '@/hooks/useMenuItems';
import { categories as categoryList, Category } from '@/data/menuData';
import BarFormDialog from '@/components/admin/BarFormDialog';
import BarSettingsDialog from '@/components/admin/BarSettingsDialog';
import CategoryManagement from '@/components/admin/CategoryManagement';
import MenuItemManagement from '@/components/admin/MenuItemManagement';
import CategoryManagerDialog from '@/components/admin/CategoryManagerDialog';

interface Bar {
  id: string;
  name: string;
  mp_user_id: string | null;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
  mp_access_token?: string | null;
  mp_refresh_token?: string | null;
  mp_oauth_connected_at?: string | null;
  // Configurações de estilo (será expandido)
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  logo_url?: string;
}

const AdminPortal = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bars, setBars] = useState<Bar[]>([]);
  const [loadingBars, setLoadingBars] = useState(true);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [isBarFormOpen, setIsBarFormOpen] = useState(false);
  const [isBarSettingsOpen, setIsBarSettingsOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const { isAdmin, user, signInAsAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items: menuItems } = useMenuItems();

  // Verificar callback OAuth na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthStatus = urlParams.get('oauth');
    const barId = urlParams.get('bar_id');
    const errorMessage = urlParams.get('message');
    
    if (oauthStatus === 'success' && barId) {
      toast({
        title: 'Mercado Pago conectado!',
        description: 'A conta do Mercado Pago foi conectada com sucesso.',
      });
      fetchBars(true);
      // Limpar URL params
      window.history.replaceState({}, '', '/admin');
    } else if (oauthStatus === 'error') {
      toast({
        title: 'Erro ao conectar Mercado Pago',
        description: errorMessage || 'Não foi possível conectar a conta do Mercado Pago.',
        variant: 'destructive',
      });
      // Limpar URL params
      window.history.replaceState({}, '', '/admin');
    }
  }, [toast]);

  useEffect(() => {
    // A proteção de rota agora é feita pelo ProtectedRoute no App.tsx
    // Este useEffect apenas gerencia o estado de login e carrega dados
    if (user && isAdmin) {
      setIsLoginMode(false);
      fetchBars(true);
    } else if (!user) {
      setIsLoginMode(true);
    } else if (user && !isAdmin) {
      // Se chegou aqui e não é admin, o ProtectedRoute já deveria ter redirecionado
      // Mas garantimos o redirecionamento como fallback apenas após um delay
      // para evitar redirecionamento durante verificação de autenticação
      const timeoutId = setTimeout(() => {
        if (user && !isAdmin) {
          navigate('/');
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [user, isAdmin, navigate]);

  // Recarregar lista de bares quando a aba "bars" ou "dashboard" for selecionada
  // Sempre forçar refresh ao mudar de aba para garantir dados atualizados
  useEffect(() => {
    if ((activeTab === 'bars' || activeTab === 'dashboard') && user && isAdmin) {
      fetchBars(true); // Forçar refresh
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchBars = async (forceRefresh = false) => {
    setLoadingBars(true);
    const client = getSupabaseClient();
    if (!client) {
      setLoadingBars(false);
      return;
    }

    try {
      // Buscar TODOS os bares diretamente do Supabase (sem cache, sem filtros)
      // Usar timestamp para evitar cache do navegador/Supabase
      const timestamp = Date.now();
      const { data, error } = await client
        .from('bars')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar bares:', error);
        console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      // Sempre atualizar o estado com os dados mais recentes do banco
      // Se não houver dados, definir como array vazio
      const updatedBars = data || [];
      
      // Verificar diferenças para logging
      const previousCount = bars.length;
      const currentCount = updatedBars.length;
      const activeCount = updatedBars.filter(b => b.is_active === true).length;
      
      console.log(`✅ Bares sincronizados do Supabase: ${activeCount} ativos de ${currentCount} total (timestamp: ${timestamp})`);
      
      if (previousCount !== currentCount) {
        console.log(`📊 Mudança detectada: ${previousCount} → ${currentCount} bares`);
      }
      
      // Atualizar estado com dados frescos do banco
      setBars(updatedBars);
      
      // Mostrar notificação se houve mudança significativa
      if (forceRefresh && previousCount > currentCount) {
        const diff = previousCount - currentCount;
        if (diff > 0) {
          toast({
            title: 'Lista sincronizada',
            description: `${diff} bar(es) removido(s) da lista.`,
          });
        }
      }
    } catch (error: any) {
      console.error('❌ Error fetching bars:', error);
      toast({
        title: 'Erro ao carregar bares',
        description: error.message || 'Não foi possível carregar os bares cadastrados. Verifique a conexão.',
        variant: 'destructive',
      });
      // Em caso de erro, manter o estado anterior para não perder os dados visíveis
    } finally {
      setLoadingBars(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      await signInAsAdmin(loginEmail, loginPassword);
      toast({
        title: 'Login realizado com sucesso',
        description: 'Bem-vindo, administrador!',
      });
      setIsLoginMode(false);
      fetchBars(true);
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer login',
        description: error.message || 'Email ou senha incorretos',
        variant: 'destructive',
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleDeleteBar = async (barId: string, barName: string) => {
    if (!confirm(`Tem certeza que deseja DELETAR permanentemente o bar "${barName}"?\n\nEsta ação não pode ser desfeita e irá remover o bar do banco de dados!`)) {
      return;
    }

    try {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('Supabase não está conectado');
      }

      // Verificar se é admin
      const { data: { user } } = await client.auth.getUser();
      if (!user || user.user_metadata?.role !== 'admin') {
        throw new Error('Apenas administradores podem deletar bares');
      }

      // Deletar permanentemente do banco de dados do Supabase
      console.log(`🗑️ Deletando bar ${barId} (${barName}) do banco de dados...`);
      
      // Primeiro, verificar se o bar existe
      const { data: existingBar, error: checkError } = await client
        .from('bars')
        .select('id, name')
        .eq('id', barId)
        .single();

      if (checkError || !existingBar) {
        throw new Error(`Bar não encontrado: ${barName}`);
      }

      // Deletar permanentemente
      // Tentar deletar sem select primeiro (mais rápido)
      const { error: deleteError } = await client
        .from('bars')
        .delete()
        .eq('id', barId);

      if (deleteError) {
        console.error('❌ Erro ao deletar bar:', deleteError);
        console.error('Código do erro:', deleteError.code);
        console.error('Detalhes do erro:', JSON.stringify(deleteError, null, 2));
        
        // Se for erro de permissão, tentar verificar role novamente
        if (deleteError.code === '42501' || deleteError.message?.includes('permission') || deleteError.message?.includes('policy')) {
          const { data: { user: currentUser } } = await client.auth.getUser();
          console.error('Usuário atual:', {
            id: currentUser?.id,
            role: currentUser?.user_metadata?.role,
            email: currentUser?.email
          });
          throw new Error(`Permissão negada (RLS). Verifique se você é admin. Role atual: ${currentUser?.user_metadata?.role || 'não definido'}`);
        }
        
        throw new Error(`Erro ao deletar: ${deleteError.message || 'Erro desconhecido'}`);
      }

      // Verificar se realmente foi deletado fazendo uma busca
      const { data: verifyData, error: verifyError } = await client
        .from('bars')
        .select('id')
        .eq('id', barId)
        .single();

      if (verifyError && verifyError.code !== 'PGRST116') {
        // PGRST116 = not found (esperado após delete)
        console.warn('⚠️ Erro ao verificar exclusão:', verifyError);
      } else if (verifyData) {
        // Bar ainda existe (problema!)
        console.error('❌ Bar ainda existe após tentativa de exclusão!');
        throw new Error('Falha na exclusão: o bar ainda existe no banco de dados');
      } else {
        console.log('✅ Bar confirmado como deletado (não encontrado na verificação)');
      }

      // Remover do estado local imediatamente antes de recarregar
      setBars(prevBars => prevBars.filter(b => b.id !== barId));

      toast({
        title: 'Bar deletado permanentemente',
        description: `${barName} foi removido permanentemente do banco de dados.`,
      });

      // Aguardar um pouco e então forçar atualização completa do banco
      setTimeout(async () => {
        await fetchBars(true);
      }, 500);
      
    } catch (error: any) {
      console.error('❌ Erro completo ao deletar bar:', error);
      toast({
        title: 'Erro ao deletar bar',
        description: error.message || 'Não foi possível deletar o bar. Verifique se você tem permissão de admin e se as políticas RLS estão configuradas corretamente.',
        variant: 'destructive',
      });
    }
  };

  const handleEditBar = (bar: Bar) => {
    setSelectedBar(bar);
    setIsBarFormOpen(true);
  };

  const handleBarSettings = (bar: Bar) => {
    setSelectedBar(bar);
    setIsBarSettingsOpen(true);
  };

  // Filtrar apenas bares ativos - sempre sincronizado com o banco
  const activeBars = bars.filter((bar) => bar.is_active === true);
  const totalMenuItems = menuItems.length;
  const itemsByCategory = categoryList.reduce((acc, cat) => {
    acc[cat.id] = menuItems.filter((item) => item.category === cat.id).length;
    return acc;
  }, {} as Record<Category, number>);

  if (isLoginMode) {
    return (
      <>
        <Helmet>
          <title>Login Administrador | Cantim</title>
        </Helmet>

        <div className="min-h-screen bg-background">
          <Header />
          <main className="pt-24 pb-16">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
                <Card className="w-full max-w-md glass border-border/50">
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-serif text-center">
                      Login Administrador
                    </CardTitle>
                    <CardDescription className="text-center">
                      Acesse o painel administrativo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-email">Email</Label>
                        <Input
                          id="admin-email"
                          type="email"
                          placeholder="admin@email.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          disabled={loginLoading}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="admin-password">Senha</Label>
                        <Input
                          id="admin-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          disabled={loginLoading}
                          required
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={loginLoading}>
                        {loginLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Entrando...
                          </>
                        ) : (
                          'Entrar como Administrador'
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
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
        <title>Central Administrativa | Cantim</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-4xl font-serif font-bold mb-2">
                Central Administrativa
              </h1>
              <p className="text-muted-foreground">
                Gerencie bares, categorias, produtos e configurações do sistema
              </p>
            </motion.div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-8">
                <TabsTrigger value="dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="bars">
                  <Building2 className="h-4 w-4 mr-2" />
                  Bares
                </TabsTrigger>
                <TabsTrigger value="categories">
                  <Package className="h-4 w-4 mr-2" />
                  Categorias
                </TabsTrigger>
                <TabsTrigger value="products">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Produtos
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </TabsTrigger>
              </TabsList>

              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                  <Card className="glass border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Bares Ativos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-primary">{activeBars.length}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Total: {bars.length}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="glass border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                        Produtos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-primary">{totalMenuItems}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Itens no cardápio
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="glass border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Categorias
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-primary">{categoryList.length}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Disponíveis
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="glass border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                          Sistema Ativo
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="glass border-border/50">
                    <CardHeader>
                      <CardTitle>Ações Rápidas</CardTitle>
                      <CardDescription>
                        Acesso rápido às principais funcionalidades
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Button
                          variant="outline"
                          className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-accent"
                          onClick={() => {
                            setSelectedBar(null);
                            setIsBarFormOpen(true);
                          }}
                        >
                          <Plus className="h-5 w-5 text-primary" />
                          <div className="text-left">
                            <div className="font-semibold">Cadastrar Bar</div>
                            <div className="text-sm text-muted-foreground">
                              Adicionar novo estabelecimento
                            </div>
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-accent"
                          onClick={() => setIsCategoryManagerOpen(true)}
                        >
                          <Package className="h-5 w-5 text-primary" />
                          <div className="text-left">
                            <div className="font-semibold">Gerenciar Categorias</div>
                            <div className="text-sm text-muted-foreground">
                              Criar e editar categorias do cardápio
                            </div>
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-accent"
                          onClick={() => setActiveTab('categories')}
                        >
                          <Package className="h-5 w-5 text-primary" />
                          <div className="text-left">
                            <div className="font-semibold">Disponibilidade</div>
                            <div className="text-sm text-muted-foreground">
                              Controlar categorias por bar
                            </div>
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-accent"
                          onClick={() => setActiveTab('products')}
                        >
                          <ShoppingBag className="h-5 w-5 text-primary" />
                          <div className="text-left">
                            <div className="font-semibold">Gerenciar Produtos</div>
                            <div className="text-sm text-muted-foreground">
                              Criar e editar itens do menu
                            </div>
                          </div>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Statistics by Category */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="glass border-border/50">
                    <CardHeader>
                      <CardTitle>Produtos por Categoria</CardTitle>
                      <CardDescription>
                        Distribuição de itens no sistema
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {categoryList.map((category) => (
                          <div
                            key={category.id}
                            className="text-center p-4 rounded-lg border border-border/50"
                          >
                            <div className="text-3xl mb-2">{category.icon}</div>
                            <div className="font-semibold">{category.label}</div>
                            <div className="text-2xl font-bold text-primary mt-1">
                              {itemsByCategory[category.id] || 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Bares Tab */}
              <TabsContent value="bars" className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-serif font-bold mb-2">Gerenciar Bares</h2>
                    <p className="text-muted-foreground">
                      Cadastre e gerencie estabelecimentos do sistema ({activeBars.length} ativos / {bars.length} total)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        console.log('🔄 Forçando atualização da lista de bares do Supabase...');
                        fetchBars(true); // Forçar refresh completo
                      }}
                      disabled={loadingBars}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loadingBars ? 'animate-spin' : ''}`} />
                      {loadingBars ? 'Sincronizando...' : 'Sincronizar'}
                    </Button>
                    <Button onClick={() => {
                      setSelectedBar(null);
                      setIsBarFormOpen(true);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Cadastrar Bar
                    </Button>
                  </div>
                </div>

                {loadingBars ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bars.map((bar) => (
                      <Card key={bar.id} className="glass border-border/50">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                {bar.name}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                ID MP: {bar.mp_user_id}
                              </CardDescription>
                              {bar.mp_access_token && (
                                <div className="flex items-center gap-1 mt-1">
                                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                                  <span className="text-xs text-green-600">
                                    OAuth Conectado
                                  </span>
                                </div>
                              )}
                            </div>
                            <Badge variant={bar.is_active ? 'default' : 'secondary'}>
                              {bar.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 mb-4">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Comissão: </span>
                              <span className="font-semibold">
                                {(bar.commission_rate * 100).toFixed(2)}%
                              </span>
                            </div>
                            {bar.mp_oauth_connected_at && (
                              <div className="text-xs text-muted-foreground">
                                OAuth: {new Date(bar.mp_oauth_connected_at).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                            <div className="text-sm text-muted-foreground">
                              Cadastrado em:{' '}
                              {new Date(bar.created_at).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleEditBar(bar)}
                            >
                              <Edit3 className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleBarSettings(bar)}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Config
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteBar(bar.id, bar.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Categorias Tab */}
              <TabsContent value="categories">
                <CategoryManagement bars={activeBars} />
              </TabsContent>

              {/* Produtos Tab */}
              <TabsContent value="products">
                <MenuItemManagement bars={activeBars} />
              </TabsContent>

              {/* Configurações Tab */}
              <TabsContent value="settings">
                <Card className="glass border-border/50">
                  <CardHeader>
                    <CardTitle>Configurações do Sistema</CardTitle>
                    <CardDescription>
                      Configurações globais da plataforma
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Em desenvolvimento - Configurações globais serão adicionadas em breve.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <BarFormDialog
        open={isBarFormOpen}
        onOpenChange={setIsBarFormOpen}
        bar={selectedBar}
        onSuccess={() => fetchBars(true)}
      />

      <BarSettingsDialog
        open={isBarSettingsOpen}
        onOpenChange={setIsBarSettingsOpen}
        bar={selectedBar}
        onSuccess={() => fetchBars(true)}
      />

      <CategoryManagerDialog
        open={isCategoryManagerOpen}
        onOpenChange={setIsCategoryManagerOpen}
      />
    </>
  );
};

export default AdminPortal;


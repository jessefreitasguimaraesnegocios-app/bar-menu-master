import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient } from '@/lib/supabase';
import { Building2, Plus, Settings, CreditCard, Percent, Trash2, Edit, Users } from 'lucide-react';

interface Bar {
  id: string;
  name: string;
  slug: string;
  mp_user_id: string | null;
  commission_rate: number;
  active: boolean;
  created_at: string;
}

const Admin = () => {
  const [bars, setBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBar, setEditingBar] = useState<Bar | null>(null);
  const [platformCommission, setPlatformCommission] = useState(5);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    mp_user_id: '',
    commission_rate: 5,
  });

  const supabase = getSupabaseClient();

  useEffect(() => {
    fetchBars();
    fetchPlatformSettings();
  }, []);

  const fetchBars = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('bars')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBars(data || []);
    } catch (error) {
      console.error('Erro ao buscar bares:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os bares',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformSettings = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('commission_rate')
        .maybeSingle();

      if (data) {
        setPlatformCommission(data.commission_rate * 100);
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    try {
      const barData = {
        name: formData.name,
        slug: formData.slug.toLowerCase().replace(/\s+/g, '-'),
        mp_user_id: formData.mp_user_id || null,
        commission_rate: formData.commission_rate / 100,
        active: true,
      };

      if (editingBar) {
        const { error } = await supabase
          .from('bars')
          .update(barData)
          .eq('id', editingBar.id);

        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Bar atualizado com sucesso' });
      } else {
        const { error } = await supabase.from('bars').insert(barData);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Bar criado com sucesso' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchBars();
    } catch (error: any) {
      console.error('Erro ao salvar bar:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o bar',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (bar: Bar) => {
    setEditingBar(bar);
    setFormData({
      name: bar.name,
      slug: bar.slug,
      mp_user_id: bar.mp_user_id || '',
      commission_rate: bar.commission_rate * 100,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!supabase || !confirm('Tem certeza que deseja excluir este bar?')) return;

    try {
      const { error } = await supabase.from('bars').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Bar excluído com sucesso' });
      fetchBars();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir o bar',
        variant: 'destructive',
      });
    }
  };

  const updatePlatformCommission = async () => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({ id: 1, commission_rate: platformCommission / 100 });

      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Comissão atualizada com sucesso' });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar a comissão',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', slug: '', mp_user_id: '', commission_rate: 5 });
    setEditingBar(null);
  };

  return (
    <>
      <Helmet>
        <title>Admin - Cantim</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />

      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-3 mb-8">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="font-serif text-3xl font-bold">Painel Administrativo</h1>
          </div>

          <Tabs defaultValue="bars" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="bars" className="gap-2">
                <Building2 className="h-4 w-4" />
                Bares
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Pagamentos
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Percent className="h-4 w-4" />
                Comissão
              </TabsTrigger>
            </TabsList>

            {/* Bares Tab */}
            <TabsContent value="bars">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Bares / Estabelecimentos</CardTitle>
                    <CardDescription>
                      Gerencie os bares cadastrados na plataforma
                    </CardDescription>
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                  }}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Bar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingBar ? 'Editar Bar' : 'Novo Bar'}
                        </DialogTitle>
                        <DialogDescription>
                          Preencha as informações do estabelecimento
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome do Bar</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Bar do João"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="slug">Slug (URL)</Label>
                          <Input
                            id="slug"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            placeholder="Ex: bar-do-joao"
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            URL: cantim.app/{formData.slug || 'slug-do-bar'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mp_user_id">ID do Mercado Pago (Vendedor)</Label>
                          <Input
                            id="mp_user_id"
                            value={formData.mp_user_id}
                            onChange={(e) => setFormData({ ...formData, mp_user_id: e.target.value })}
                            placeholder="Ex: 123456789"
                          />
                          <p className="text-xs text-muted-foreground">
                            ID da conta Mercado Pago do bar para receber pagamentos
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="commission">Comissão (%)</Label>
                          <Input
                            id="commission"
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={formData.commission_rate}
                            onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })}
                          />
                        </div>
                        <DialogFooter>
                          <Button type="submit">
                            {editingBar ? 'Salvar Alterações' : 'Criar Bar'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : bars.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>Nenhum bar cadastrado</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Slug</TableHead>
                          <TableHead>MP ID</TableHead>
                          <TableHead>Comissão</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bars.map((bar) => (
                          <TableRow key={bar.id}>
                            <TableCell className="font-medium">{bar.name}</TableCell>
                            <TableCell className="text-muted-foreground">/{bar.slug}</TableCell>
                            <TableCell>{bar.mp_user_id || '-'}</TableCell>
                            <TableCell>{(bar.commission_rate * 100).toFixed(1)}%</TableCell>
                            <TableCell>
                              <Badge variant={bar.active ? 'default' : 'secondary'}>
                                {bar.active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(bar)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(bar.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pagamentos Tab */}
            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Pagamentos</CardTitle>
                  <CardDescription>
                    Visualize todos os pagamentos processados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Histórico de pagamentos em breve</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Configurações Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Comissão</CardTitle>
                  <CardDescription>
                    Defina a porcentagem da plataforma sobre cada venda
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="platform-commission">Comissão da Plataforma (%)</Label>
                    <div className="flex gap-4 items-center">
                      <Input
                        id="platform-commission"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={platformCommission}
                        onChange={(e) => setPlatformCommission(parseFloat(e.target.value))}
                        className="w-32"
                      />
                      <Button onClick={updatePlatformCommission}>
                        Salvar
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Esta é a porcentagem que você receberá de cada venda. O restante vai para o bar.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                    <h4 className="font-medium mb-2">Exemplo de Split</h4>
                    <p className="text-sm text-muted-foreground">
                      Para uma venda de <strong>R$ 100,00</strong>:
                    </p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• Sua comissão: <strong className="text-primary">R$ {(100 * platformCommission / 100).toFixed(2)}</strong></li>
                      <li>• Bar recebe: <strong>R$ {(100 - 100 * platformCommission / 100).toFixed(2)}</strong></li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
};

export default Admin;

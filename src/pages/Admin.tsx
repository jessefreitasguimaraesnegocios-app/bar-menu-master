import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient } from '@/lib/supabase';
import { categories, Category } from '@/data/menuData';
import { Building2, Plus, Settings, CreditCard, Percent, Trash2, Edit, UtensilsCrossed, ExternalLink } from 'lucide-react';

interface Bar {
  id: string;
  name: string;
  slug: string;
  mp_user_id: string | null;
  commission_rate: number;
  active: boolean;
  created_at: string;
}

interface BarMenuItem {
  id: string;
  bar_id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  is_popular: boolean;
  is_new: boolean;
  is_active: boolean;
}

const Admin = () => {
  const [bars, setBars] = useState<Bar[]>([]);
  const [menuItems, setMenuItems] = useState<BarMenuItem[]>([]);
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBarDialogOpen, setIsBarDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingBar, setEditingBar] = useState<Bar | null>(null);
  const [editingItem, setEditingItem] = useState<BarMenuItem | null>(null);
  const [platformCommission, setPlatformCommission] = useState(5);
  const { toast } = useToast();

  // Bar form state
  const [barFormData, setBarFormData] = useState({
    name: '',
    slug: '',
    mp_user_id: '',
    commission_rate: 5,
  });

  // Item form state
  const [itemFormData, setItemFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'cocktails' as Category,
    image: '',
    is_popular: false,
    is_new: false,
  });

  const supabase = getSupabaseClient();

  useEffect(() => {
    fetchBars();
    fetchPlatformSettings();
  }, []);

  useEffect(() => {
    if (selectedBar) {
      fetchMenuItems(selectedBar.id);
    }
  }, [selectedBar]);

  const fetchBars = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('bars')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBars(data || []);
      if (data && data.length > 0 && !selectedBar) {
        setSelectedBar(data[0]);
      }
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

  const fetchMenuItems = async (barId: string) => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('bar_menu_items')
        .select('*')
        .eq('bar_id', barId)
        .order('category')
        .order('name');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
    }
  };

  const fetchPlatformSettings = async () => {
    if (!supabase) return;
    
    try {
      const { data } = await supabase
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

  const handleBarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    try {
      const barData = {
        name: barFormData.name,
        slug: barFormData.slug.toLowerCase().replace(/\s+/g, '-'),
        mp_user_id: barFormData.mp_user_id || null,
        commission_rate: barFormData.commission_rate / 100,
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

      setIsBarDialogOpen(false);
      resetBarForm();
      fetchBars();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o bar',
        variant: 'destructive',
      });
    }
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !selectedBar) return;

    try {
      const itemData = {
        bar_id: selectedBar.id,
        name: itemFormData.name,
        description: itemFormData.description,
        price: itemFormData.price,
        category: itemFormData.category,
        image: itemFormData.image,
        is_popular: itemFormData.is_popular,
        is_new: itemFormData.is_new,
        is_active: true,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('bar_menu_items')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Item atualizado com sucesso' });
      } else {
        const { error } = await supabase.from('bar_menu_items').insert(itemData);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Item criado com sucesso' });
      }

      setIsItemDialogOpen(false);
      resetItemForm();
      fetchMenuItems(selectedBar.id);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o item',
        variant: 'destructive',
      });
    }
  };

  const handleEditBar = (bar: Bar) => {
    setEditingBar(bar);
    setBarFormData({
      name: bar.name,
      slug: bar.slug,
      mp_user_id: bar.mp_user_id || '',
      commission_rate: bar.commission_rate * 100,
    });
    setIsBarDialogOpen(true);
  };

  const handleEditItem = (item: BarMenuItem) => {
    setEditingItem(item);
    setItemFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category,
      image: item.image || '',
      is_popular: item.is_popular,
      is_new: item.is_new,
    });
    setIsItemDialogOpen(true);
  };

  const handleDeleteBar = async (id: string) => {
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

  const handleDeleteItem = async (id: string) => {
    if (!supabase || !confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      const { error } = await supabase.from('bar_menu_items').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Item excluído com sucesso' });
      if (selectedBar) fetchMenuItems(selectedBar.id);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir o item',
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

  const resetBarForm = () => {
    setBarFormData({ name: '', slug: '', mp_user_id: '', commission_rate: 5 });
    setEditingBar(null);
  };

  const resetItemForm = () => {
    setItemFormData({ name: '', description: '', price: 0, category: 'cocktails', image: '', is_popular: false, is_new: false });
    setEditingItem(null);
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
            <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
              <TabsTrigger value="bars" className="gap-2">
                <Building2 className="h-4 w-4" />
                Bares
              </TabsTrigger>
              <TabsTrigger value="items" className="gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                Cardápio
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
                    <CardDescription>Gerencie os bares cadastrados</CardDescription>
                  </div>
                  <Dialog open={isBarDialogOpen} onOpenChange={(open) => {
                    setIsBarDialogOpen(open);
                    if (!open) resetBarForm();
                  }}>
                    <DialogTrigger asChild>
                      <Button><Plus className="h-4 w-4 mr-2" />Adicionar Bar</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingBar ? 'Editar Bar' : 'Novo Bar'}</DialogTitle>
                        <DialogDescription>Preencha as informações do estabelecimento</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleBarSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome do Bar</Label>
                          <Input id="name" value={barFormData.name} onChange={(e) => setBarFormData({ ...barFormData, name: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="slug">Slug (URL)</Label>
                          <Input id="slug" value={barFormData.slug} onChange={(e) => setBarFormData({ ...barFormData, slug: e.target.value })} required />
                          <p className="text-xs text-muted-foreground">URL: /bar/{barFormData.slug || 'slug'}</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mp_user_id">ID Mercado Pago</Label>
                          <Input id="mp_user_id" value={barFormData.mp_user_id} onChange={(e) => setBarFormData({ ...barFormData, mp_user_id: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="commission">Comissão (%)</Label>
                          <Input id="commission" type="number" min="0" max="100" step="0.1" value={barFormData.commission_rate} onChange={(e) => setBarFormData({ ...barFormData, commission_rate: parseFloat(e.target.value) })} />
                        </div>
                        <DialogFooter>
                          <Button type="submit">{editingBar ? 'Salvar' : 'Criar'}</Button>
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
                            <TableCell>
                              <a href={`/bar/${bar.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                                /{bar.slug}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </TableCell>
                            <TableCell>{bar.mp_user_id || '-'}</TableCell>
                            <TableCell>{(bar.commission_rate * 100).toFixed(1)}%</TableCell>
                            <TableCell>
                              <Badge variant={bar.active ? 'default' : 'secondary'}>
                                {bar.active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleEditBar(bar)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteBar(bar.id)} className="text-destructive hover:text-destructive">
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

            {/* Items Tab */}
            <TabsContent value="items">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Cardápio por Bar</CardTitle>
                      <CardDescription>Gerencie os itens de cada bar</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Select value={selectedBar?.id} onValueChange={(id) => setSelectedBar(bars.find(b => b.id === id) || null)}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Selecione um bar" />
                        </SelectTrigger>
                        <SelectContent>
                          {bars.map((bar) => (
                            <SelectItem key={bar.id} value={bar.id}>{bar.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Dialog open={isItemDialogOpen} onOpenChange={(open) => {
                        setIsItemDialogOpen(open);
                        if (!open) resetItemForm();
                      }}>
                        <DialogTrigger asChild>
                          <Button disabled={!selectedBar}><Plus className="h-4 w-4 mr-2" />Adicionar Item</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Item'}</DialogTitle>
                            <DialogDescription>Preencha as informações do item</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleItemSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="item-name">Nome</Label>
                                <Input id="item-name" value={itemFormData.name} onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })} required />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="item-price">Preço (R$)</Label>
                                <Input id="item-price" type="number" min="0" step="0.01" value={itemFormData.price} onChange={(e) => setItemFormData({ ...itemFormData, price: parseFloat(e.target.value) })} required />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="item-category">Categoria</Label>
                              <Select value={itemFormData.category} onValueChange={(v) => setItemFormData({ ...itemFormData, category: v as Category })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="item-description">Descrição</Label>
                              <Textarea id="item-description" value={itemFormData.description} onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="item-image">URL da Imagem</Label>
                              <Input id="item-image" value={itemFormData.image} onChange={(e) => setItemFormData({ ...itemFormData, image: e.target.value })} placeholder="https://..." />
                            </div>
                            <div className="flex gap-6">
                              <div className="flex items-center gap-2">
                                <Switch id="is-popular" checked={itemFormData.is_popular} onCheckedChange={(v) => setItemFormData({ ...itemFormData, is_popular: v })} />
                                <Label htmlFor="is-popular">Popular</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch id="is-new" checked={itemFormData.is_new} onCheckedChange={(v) => setItemFormData({ ...itemFormData, is_new: v })} />
                                <Label htmlFor="is-new">Novo</Label>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="submit">{editingItem ? 'Salvar' : 'Criar'}</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!selectedBar ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>Selecione um bar para gerenciar o cardápio</p>
                    </div>
                  ) : menuItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>Nenhum item cadastrado neste bar</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Imagem</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {menuItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                              ) : (
                                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                  <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>
                              {categories.find(c => c.id === item.category)?.icon} {categories.find(c => c.id === item.category)?.label}
                            </TableCell>
                            <TableCell>R$ {item.price.toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {item.is_popular && <Badge variant="default">Popular</Badge>}
                                {item.is_new && <Badge variant="secondary">Novo</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleEditItem(item)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} className="text-destructive hover:text-destructive">
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
                  <CardDescription>Visualize todos os pagamentos processados</CardDescription>
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
                  <CardDescription>Defina a porcentagem da plataforma sobre cada venda</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="platform-commission">Comissão da Plataforma (%)</Label>
                    <div className="flex gap-4 items-center">
                      <Input id="platform-commission" type="number" min="0" max="100" step="0.1" value={platformCommission} onChange={(e) => setPlatformCommission(parseFloat(e.target.value))} className="w-32" />
                      <Button onClick={updatePlatformCommission}>Salvar</Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Esta é a porcentagem que você receberá de cada venda.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                    <h4 className="font-medium mb-2">Exemplo de Split</h4>
                    <p className="text-sm text-muted-foreground">Para uma venda de <strong>R$ 100,00</strong>:</p>
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
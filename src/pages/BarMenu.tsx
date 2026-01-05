import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import MenuCard from '@/components/MenuCard';
import ItemDetailModal from '@/components/ItemDetailModal';
import { getSupabaseClient } from '@/lib/supabase';
import { MenuItem, Category } from '@/data/menuData';
import { motion } from 'framer-motion';
import { Beer, UtensilsCrossed } from 'lucide-react';

interface Bar {
  id: string;
  name: string;
  slug: string;
}

const BarMenu = () => {
  const { slug } = useParams<{ slug: string }>();
  const [bar, setBar] = useState<Bar | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [notFound, setNotFound] = useState(false);

  const supabase = getSupabaseClient();

  useEffect(() => {
    const fetchBarAndMenu = async () => {
      if (!supabase || !slug) {
        setLoading(false);
        return;
      }

      try {
        // Buscar bar pelo slug
        const { data: barData, error: barError } = await supabase
          .from('bars')
          .select('*')
          .eq('slug', slug)
          .eq('active', true)
          .single();

        if (barError || !barData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setBar(barData);

        // Buscar itens do menu do bar
        const { data: items, error: itemsError } = await supabase
          .from('bar_menu_items')
          .select('*')
          .eq('bar_id', barData.id)
          .eq('is_active', true)
          .order('category')
          .order('name');

        if (!itemsError && items) {
          setMenuItems(items.map(item => ({
            ...item,
            isPopular: item.is_popular,
            isNew: item.is_new,
          })));
        }
      } catch (error) {
        console.error('Erro ao buscar cardápio:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBarAndMenu();
  }, [slug, supabase]);

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <Beer className="h-20 w-20 mx-auto mb-6 text-muted-foreground opacity-30" />
            <h1 className="font-serif text-3xl font-bold mb-4">Bar não encontrado</h1>
            <p className="text-muted-foreground">
              O estabelecimento que você está procurando não existe ou não está ativo.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{bar?.name || 'Cardápio'} - Cantim</title>
        <meta name="description" content={`Cardápio do ${bar?.name}. Veja nossos drinks, cervejas, petiscos e pratos.`} />
      </Helmet>

      <Header />

      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Bar Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <UtensilsCrossed className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Cardápio Digital</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-2">
              {bar?.name}
            </h1>
            <p className="text-muted-foreground">
              Explore nosso cardápio e faça seu pedido
            </p>
          </motion.div>

          {/* Search and Filter */}
          <div className="flex flex-col gap-4 mb-8">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <CategoryFilter
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>

          {/* Menu Items */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Beer className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">
                {menuItems.length === 0
                  ? 'Nenhum item no cardápio ainda'
                  : 'Nenhum item encontrado para sua busca'}
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredItems.map((item, index) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  index={index}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </motion.div>
          )}
        </div>
      </main>

      <ItemDetailModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
};

export default BarMenu;





import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import Header from '@/components/Header';
import MenuCard from '@/components/MenuCard';
import CategoryFilter from '@/components/CategoryFilter';
import SearchBar from '@/components/SearchBar';
import ItemDetailModal from '@/components/ItemDetailModal';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useMenuItems } from '@/hooks/useMenuItems';
import { MenuItem, Category } from '@/data/menuData';
import { menuItems as fallbackMenuItems } from '@/data/menuData';

const Menu = () => {
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  
  // Buscar itens do Supabase (ou usar fallback se não estiver conectado)
  const { items: supabaseItems, loading } = useMenuItems();
  
  // Usar itens do Supabase se disponíveis, senão usar fallback
  const menuItems = supabaseItems.length > 0 ? supabaseItems : fallbackMenuItems;

  // Filtrar itens populares para o carrossel
  const popularItems = useMemo(() => {
    return menuItems.filter((item) => item.isPopular);
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ingredients?.some((ing) =>
          ing.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, menuItems]);

  return (
    <>
      <Helmet>
        <title>Cardápio | Cantim</title>
        <meta name="description" content="Veja nosso cardápio completo de coquetéis artesanais, vinhos finos, destilados premium e pratos gourmet. Encontre sua próxima bebida ou refeição favorita." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-24 pb-16">
          {/* Hero Section */}
          <section className="py-16 relative">
            <div className="absolute inset-0 bg-gradient-glow opacity-50" />
            <div className="container mx-auto px-4 relative">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
              >
                <h1 className="font-serif text-5xl md:text-6xl font-bold mb-4">
                  Nosso <span className="text-primary glow-text">Cardápio</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  De coquetéis clássicos a delícias culinárias, cada item é preparado com carinho
                </p>
              </motion.div>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex justify-center mb-10"
              >
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
              </motion.div>

              {/* Category Filter */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <CategoryFilter
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                />
              </motion.div>
            </div>
          </section>

          {/* Carrossel de Itens Mais Pedidos */}
          {popularItems.length > 0 && (
            <section className="container mx-auto px-4 mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Star className="w-6 h-6 text-primary fill-primary" />
                  <h2 className="font-serif text-3xl md:text-4xl font-bold">
                    Mais <span className="text-primary">Pedidos</span>
                  </h2>
                </div>
                <p className="text-muted-foreground text-lg">
                  Os favoritos dos nossos clientes
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {popularItems.map((item, index) => (
                      <CarouselItem key={item.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                        <MenuCard
                          item={item}
                          index={index}
                          onClick={() => setSelectedItem(item)}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-0 md:-left-12" />
                  <CarouselNext className="right-0 md:-right-12" />
                </Carousel>
              </motion.div>
            </section>
          )}

          {/* Menu Grid */}
          <section className="container mx-auto px-4">
            {loading && supabaseItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <p className="text-muted-foreground text-lg">
                  Carregando cardápio...
                </p>
              </motion.div>
            ) : filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((item, index) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    index={index}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <p className="text-muted-foreground text-lg">
                  Nenhum item encontrado para sua busca.
                </p>
              </motion.div>
            )}
          </section>
        </main>

        {/* Item Detail Modal */}
        <ItemDetailModal
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      </div>
    </>
  );
};

export default Menu;

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useMenuItems } from '@/hooks/useMenuItems';
import { menuItems as fallbackMenuItems } from '@/data/menuData';

interface FeaturedSectionProps {
  barSlug?: string; // Slug do bar para rotas dinâmicas
}

const FeaturedSection = ({ barSlug }: FeaturedSectionProps = {}) => {
  // Buscar itens do Supabase (ou usar fallback se não estiver conectado)
  const { items: supabaseItems } = useMenuItems();
  
  // Usar itens do Supabase se disponíveis, senão usar fallback
  const menuItems = supabaseItems.length > 0 ? supabaseItems : fallbackMenuItems;
  
  const popularItems = menuItems.filter((item) => item.isPopular).slice(0, 4);

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-4">
            <Star className="w-4 h-4" />
            Favoritos dos Clientes
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Mais Pedidos
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Descubra o que faz nossos clientes voltarem sempre
          </p>
        </motion.div>

        {/* Featured Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative h-80 rounded-2xl overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                
                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-primary text-sm font-medium mb-2 block">
                    R$ {item.price.toFixed(2)}
                  </span>
                  <h3 className="font-serif text-xl font-semibold mb-2">
                    {item.name}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Hover Glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-glow" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;

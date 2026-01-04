import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import heroBackground from '@/assets/cantim-logo.png';
import { useBackgroundImages } from '@/hooks/useBackgroundImages';
import { useAuth } from '@/contexts/AuthContext';

interface HeroSectionProps {
  barName?: string; // Nome do bar (para rotas dinâmicas)
}

const HeroSection = ({ barName }: HeroSectionProps = {}) => {
  const { images } = useBackgroundImages();
  const { isOwner } = useAuth();
  const { slug } = useParams<{ slug?: string }>();
  const backgroundImage = images.hero || heroBackground;
  
  // Determinar nome do estabelecimento
  const establishmentName = barName || 'Cantim';
  const menuLink = slug ? `/bar/${slug}/menu` : '/menu';

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={backgroundImage}
          alt="Cantim Restaurante Bar"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(32_80%_50%/0.08),transparent_70%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Restaurante Bar</span>
          </motion.div>

          {/* Headline */}
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            <span className="block">Sabor e</span>
            <span className="block text-primary glow-text">Tradição</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            Experimente coquetéis artesanais, vinhos finos e uma culinária excepcional em um ambiente de elegância atemporal.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to={menuLink}>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-medium rounded-full shadow-glow transition-all duration-300 hover:shadow-[0_0_60px_hsl(32_80%_50%/0.3)]"
              >
                Ver Cardápio
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            {isOwner && (
              <Link to="/owner">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-border/50 hover:border-primary/50 hover:bg-primary/5 px-8 py-6 text-lg font-medium rounded-full"
                >
                  Portal do Dono
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2"
          >
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="w-1 h-2 rounded-full bg-primary"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

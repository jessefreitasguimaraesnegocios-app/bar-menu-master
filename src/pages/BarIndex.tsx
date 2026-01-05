import { Helmet } from 'react-helmet-async';
import { useParams, Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import FeaturedSection from '@/components/FeaturedSection';
import { useBar } from '@/hooks/useBar';
import { Loader2 } from 'lucide-react';

const BarIndex = () => {
  const { slug } = useParams<{ slug: string }>();
  const { bar, loading, error } = useBar(slug);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !bar) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Helmet>
        <title>{bar.name} | Restaurante Bar</title>
        <meta name="description" content={`Experimente coquetéis artesanais, vinhos finos e uma culinária excepcional no ${bar.name}. Veja nosso cardápio de bebidas artesanais e pratos gourmet.`} />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <HeroSection barName={bar.name} />
          <FeaturedSection barSlug={slug} />
          
          {/* Footer */}
          <footer className="py-12 border-t border-border/50">
            <div className="container mx-auto px-4 text-center">
              <p className="text-muted-foreground text-sm">
                © 2024 {bar.name}. Todos os direitos reservados.
              </p>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
};

export default BarIndex;











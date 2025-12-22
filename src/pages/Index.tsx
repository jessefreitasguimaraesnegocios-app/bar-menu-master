import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import FeaturedSection from '@/components/FeaturedSection';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Cantim | Restaurante Bar</title>
        <meta name="description" content="Experimente coquetéis artesanais, vinhos finos e uma culinária excepcional no Cantim. Veja nosso cardápio de bebidas artesanais e pratos gourmet." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <HeroSection />
          <FeaturedSection />
          
          {/* Footer */}
          <footer className="py-12 border-t border-border/50">
            <div className="container mx-auto px-4 text-center">
              <p className="text-muted-foreground text-sm">
                © 2024 Cantim Restaurante Bar. Todos os direitos reservados.
              </p>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
};

export default Index;

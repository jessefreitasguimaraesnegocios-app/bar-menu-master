import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import FeaturedSection from '@/components/FeaturedSection';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>The Golden Pour | Craft Cocktails & Fine Dining</title>
        <meta name="description" content="Experience handcrafted cocktails, fine wines, and exceptional cuisine at The Golden Pour. Browse our menu of artisan drinks and gourmet food." />
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
                © 2024 The Golden Pour. All rights reserved.
              </p>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
};

export default Index;

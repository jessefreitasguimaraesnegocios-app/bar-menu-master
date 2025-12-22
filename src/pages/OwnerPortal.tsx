import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Lock, Database, ImagePlus, Edit3, Trash2, Plus, Shield } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const OwnerPortal = () => {
  return (
    <>
      <Helmet>
        <title>Portal do Dono | Cantim</title>
        <meta name="description" content="Gerencie o cardápio do seu bar, adicione novos itens, atualize preços e faça upload de imagens. Portal seguro para proprietários." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16 pt-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Portal de Gerenciamento Seguro</span>
              </div>
              
              <h1 className="font-serif text-5xl md:text-6xl font-bold mb-4">
                Portal do <span className="text-primary glow-text">Dono</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Gerencie seu cardápio, atualize itens e mantenha seu bar funcionando perfeitamente
              </p>
            </motion.div>

            {/* Feature Cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
            >
              <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="font-serif text-xl">Adicionar Itens</CardTitle>
                  <CardDescription>
                    Crie novos itens do cardápio com descrições, preços e categorias
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Edit3 className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="font-serif text-xl">Editar Cardápio</CardTitle>
                  <CardDescription>
                    Atualize itens existentes, altere preços e modifique descrições
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <ImagePlus className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="font-serif text-xl">Upload de Imagens</CardTitle>
                  <CardDescription>
                    Adicione fotos incríveis para exibir suas bebidas e pratos
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Trash2 className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="font-serif text-xl">Remover Itens</CardTitle>
                  <CardDescription>
                    Arquive ou delete itens que não estão mais disponíveis
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Database className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="font-serif text-xl">Categorias</CardTitle>
                  <CardDescription>
                    Organize itens em coquetéis, cervejas, vinhos, destilados e comidas
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="font-serif text-xl">Acesso Seguro</CardTitle>
                  <CardDescription>
                    Protegido com autenticação para garantir que apenas donos possam gerenciar
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>

            {/* CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <Card className="glass border-primary/20 max-w-2xl mx-auto glow-border">
                <CardContent className="pt-8 pb-8">
                  <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-serif text-2xl font-semibold mb-3">
                    Backend Necessário
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Para habilitar recursos de gerenciamento de cardápio como adicionar, editar e deletar itens com autenticação segura, conecte ao Lovable Cloud.
                  </p>
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-medium rounded-full shadow-glow"
                  >
                    Conectar Backend
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </>
  );
};

export default OwnerPortal;

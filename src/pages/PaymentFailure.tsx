import { Helmet } from 'react-helmet-async';
import { XCircle, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const PaymentFailure = () => {
  return (
    <>
      <Helmet>
        <title>Pagamento Não Concluído | Cantim</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <Card className="max-w-md mx-auto glass border-destructive/20">
              <CardContent className="pt-12 pb-12 text-center">
                <div className="flex justify-center mb-6">
                  <div className="rounded-full bg-red-500/20 p-4">
                    <XCircle className="h-16 w-16 text-red-500" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold mb-4">Pagamento Não Concluído</h1>
                <p className="text-muted-foreground mb-8">
                  Houve um problema ao processar o seu pagamento. Por favor, tente novamente ou use outro método de pagamento.
                </p>
                <Link to="/">
                  <Button size="lg" className="w-full">
                    <Home className="mr-2 h-5 w-5" />
                    Voltar ao Início
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
};

export default PaymentFailure;










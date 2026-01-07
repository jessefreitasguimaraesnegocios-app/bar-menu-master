import { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import { Copy, Check, Loader2, Smartphone, ExternalLink, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient } from '@/lib/supabase';

interface PIXPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode: string;
  qrCodeBase64?: string;
  paymentId: string;
  orderId: string;
  amount: number;
  onPaymentSuccess?: () => void;
}

const PIXPaymentModal = ({
  open,
  onOpenChange,
  qrCode,
  qrCodeBase64,
  paymentId,
  orderId,
  amount,
  onPaymentSuccess,
}: PIXPaymentModalProps) => {
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasDetectedPaymentRef = useRef(false);

  // Função para copiar código PIX
  const handleCopyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast({
        title: 'Código PIX copiado!',
        description: 'Cole no aplicativo do seu banco para pagar.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o código PIX.',
        variant: 'destructive',
      });
    }
  };

  // Função para verificar status do pagamento
  const checkPaymentStatus = async (): Promise<boolean> => {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      // Verificar se o order foi atualizado com status approved
      const { data, error } = await client
        .from('orders')
        .select('status, mp_payment_id')
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Erro ao verificar pagamento:', error);
        return false;
      }

      // Verificar se o pagamento foi aprovado
      return data?.status === 'approved' || data?.status === 'paid';
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      return false;
    }
  };

  // Polling para verificar pagamento
  useEffect(() => {
    if (!open || !paymentId || hasDetectedPaymentRef.current) {
      return;
    }

    setIsChecking(true);
    let pollCount = 0;
    const maxPolls = 300; // 5 minutos (polling a cada 1 segundo)

    const startPolling = () => {
      pollingIntervalRef.current = setInterval(async () => {
        pollCount++;
        
        const isPaid = await checkPaymentStatus();
        
        if (isPaid) {
          hasDetectedPaymentRef.current = true;
          setIsChecking(false);
          
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          toast({
            title: 'Pagamento confirmado!',
            description: 'Seu pagamento foi aprovado com sucesso.',
          });

          // Chamar callback de sucesso
          if (onPaymentSuccess) {
            onPaymentSuccess();
          }

          // Fechar modal após um pequeno delay
          setTimeout(() => {
            onOpenChange(false);
          }, 2000);
        } else if (pollCount >= maxPolls) {
          // Parar polling após 5 minutos
          setIsChecking(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      }, 1000); // Verificar a cada 1 segundo
    };

    // Iniciar polling após um pequeno delay
    const timeoutId = setTimeout(startPolling, 2000);

    return () => {
      clearTimeout(timeoutId);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [open, paymentId, orderId, onOpenChange, onPaymentSuccess, toast]);

  // Resetar estado quando modal fechar
  useEffect(() => {
    if (!open) {
      hasDetectedPaymentRef.current = false;
      setIsChecking(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento PIX</DialogTitle>
          <DialogDescription>
            Escaneie o QR Code ou copie o código para pagar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Valor */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Valor a pagar</p>
            <p className="text-3xl font-bold text-primary">
              R$ {amount.toFixed(2).replace('.', ',')}
            </p>
          </div>

          {/* Instruções */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex items-start gap-2">
              <Smartphone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1 text-sm">
                <p className="font-medium">Como pagar:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Abra o app do seu banco</li>
                  <li>Escaneie o QR Code ou cole o código PIX</li>
                  <li>Confirme o pagamento</li>
                </ol>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-dashed">
            <div className="p-4 bg-white rounded">
              {qrCodeBase64 ? (
                <img 
                  src={`data:image/png;base64,${qrCodeBase64}`} 
                  alt="QR Code PIX"
                  className="w-64 h-64"
                />
              ) : (
                <QRCode
                  value={qrCode}
                  size={256}
                  level="H"
                  style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                  viewBox="0 0 256 256"
                />
              )}
            </div>
          </div>

          {/* Status de verificação */}
          {isChecking && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Aguardando confirmação do pagamento...</span>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={handleCopyPixCode}
              className="w-full"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Código copiado!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar código PIX
                </>
              )}
            </Button>
          </div>

          {/* Aviso */}
          <p className="text-xs text-center text-muted-foreground">
            Não feche esta janela até confirmar o pagamento
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PIXPaymentModal;


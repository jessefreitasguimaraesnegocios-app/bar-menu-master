import { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import { Copy, Check, Loader2, Smartphone, ExternalLink } from 'lucide-react';
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

interface MercadoPagoQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authUrl: string;
  barId: string;
  onSuccess?: () => void;
}

const MercadoPagoQRDialog = ({
  open,
  onOpenChange,
  authUrl,
  barId,
  onSuccess,
}: MercadoPagoQRDialogProps) => {
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasDetectedConnectionRef = useRef(false);

  // Função para copiar URL
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(authUrl);
      setCopied(true);
      toast({
        title: 'URL copiada!',
        description: 'A URL foi copiada para a área de transferência.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar a URL.',
        variant: 'destructive',
      });
    }
  };

  // Função para verificar se o bar foi conectado
  const checkBarConnection = async (): Promise<boolean> => {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      const { data, error } = await client
        .from('bars')
        .select('mp_oauth_connected_at')
        .eq('id', barId)
        .single();

      if (error) {
        console.error('Erro ao verificar conexão:', error);
        return false;
      }

      // Verificar se o bar tem mp_oauth_connected_at (indica que OAuth foi concluído)
      return !!data?.mp_oauth_connected_at;
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      return false;
    }
  };

  // Polling para verificar conexão
  useEffect(() => {
    if (!open || !barId || hasDetectedConnectionRef.current) {
      return;
    }

    setIsChecking(true);
    let pollCount = 0;
    const maxPolls = 60; // 3 minutos (polling a cada 3 segundos)

    const startPolling = () => {
      pollingIntervalRef.current = setInterval(async () => {
        pollCount++;
        
        const isConnected = await checkBarConnection();
        
        if (isConnected) {
          hasDetectedConnectionRef.current = true;
          setIsChecking(false);
          
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          toast({
            title: 'Mercado Pago conectado!',
            description: 'A conta do Mercado Pago foi conectada com sucesso.',
          });

          // Chamar callback de sucesso
          if (onSuccess) {
            onSuccess();
          }

          // Fechar modal após um pequeno delay
          setTimeout(() => {
            onOpenChange(false);
          }, 1500);
        } else if (pollCount >= maxPolls) {
          // Parar polling após 3 minutos
          setIsChecking(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      }, 3000); // Verificar a cada 3 segundos
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
  }, [open, barId, onOpenChange, onSuccess, toast]);

  // Resetar estado quando modal fechar
  useEffect(() => {
    if (!open) {
      hasDetectedConnectionRef.current = false;
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
          <DialogTitle>Conectar Mercado Pago</DialogTitle>
          <DialogDescription>
            Escaneie o QR Code com seu celular para conectar sua conta do Mercado Pago
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instruções */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex items-start gap-2">
              <Smartphone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1 text-sm">
                <p className="font-medium">Passo a passo:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Abra a câmera do seu celular</li>
                  <li>Escaneie o QR Code abaixo</li>
                  <li>Faça login na sua conta do Mercado Pago</li>
                  <li>Autorize o aplicativo</li>
                </ol>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-dashed">
            <div className="p-4 bg-white rounded">
              <QRCode
                value={authUrl}
                size={256}
                level="H"
                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                viewBox="0 0 256 256"
              />
            </div>
          </div>

          {/* Status de verificação */}
          {isChecking && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Aguardando autorização...</span>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={handleCopyUrl}
              className="w-full"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  URL copiada!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar URL
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => window.open(authUrl, '_blank')}
              className="w-full"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir no navegador
            </Button>
          </div>

          {/* Aviso */}
          <p className="text-xs text-center text-muted-foreground">
            Não feche esta janela até completar a autorização no celular
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MercadoPagoQRDialog;


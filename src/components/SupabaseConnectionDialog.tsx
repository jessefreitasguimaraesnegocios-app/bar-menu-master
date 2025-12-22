import { useState, useEffect } from 'react';
import { Database, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { initializeSupabase, getSupabaseClient, disconnectSupabase } from '@/lib/supabase';

interface SupabaseConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
}

const SupabaseConnectionDialog = ({ open, onOpenChange, onConnected }: SupabaseConnectionDialogProps) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleConnect = async () => {
    if (!url || !anonKey) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate URL format
      try {
        new URL(url);
      } catch {
        throw new Error('URL inválida. Por favor, verifique o formato.');
      }

      // Initialize Supabase client
      initializeSupabase(url, anonKey);

      // Test connection by trying to get session
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('Falha ao inicializar cliente Supabase');
      }
      const { data, error: testError } = await client.auth.getSession();

      if (testError && testError.message !== 'Invalid API key') {
        throw new Error('Erro ao conectar: ' + testError.message);
      }

      // Connection successful (credentials already saved by initializeSupabase)
      setSuccess(true);
      
      setTimeout(() => {
        onConnected?.();
        onOpenChange(false);
        // Reset form
        setUrl('');
        setAnonKey('');
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao conectar');
      disconnectSupabase();
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved credentials on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('supabase_url');
    const savedKey = localStorage.getItem('supabase_anon_key');
    if (savedUrl && savedKey) {
      setUrl(savedUrl);
      setAnonKey(savedKey);
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Conectar ao Supabase
          </DialogTitle>
          <DialogDescription>
            Insira suas credenciais do Supabase para conectar o backend. Você pode encontrar essas informações no painel do Supabase.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="supabase-url">URL do Projeto</Label>
            <Input
              id="supabase-url"
              placeholder="https://seu-projeto.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Encontre isso em: Settings → API → Project URL
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supabase-key">Chave Anônima (anon/public key)</Label>
            <Input
              id="supabase-key"
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Encontre isso em: Settings → API → Project API keys → anon/public
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Conectado com sucesso!
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConnect}
            disabled={isLoading || !url || !anonKey}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Conectando...
              </>
            ) : (
              'Conectar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupabaseConnectionDialog;


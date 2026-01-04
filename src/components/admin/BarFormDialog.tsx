import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus, Link2, CheckCircle2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient } from '@/lib/supabase';

// Schema base
const baseBarSchema = z.object({
  barName: z.string().min(1, 'Nome do bar é obrigatório'),
  commissionRate: z.number().min(0).max(100),
});

// Schema para criação (com email e senha)
const createBarSchema = baseBarSchema.extend({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

// Schema para edição (sem email e senha)
const editBarSchema = baseBarSchema;

// Tipo unificado
type BarFormData = {
  barName: string;
  commissionRate: number;
  email?: string;
  password?: string;
};

interface Bar {
  id: string;
  name: string;
  mp_user_id: string | null;
  commission_rate: number;
  mp_access_token?: string | null;
  mp_refresh_token?: string | null;
  mp_oauth_connected_at?: string | null;
}

interface BarFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bar?: Bar | null;
  onSuccess: () => void;
}

const BarFormDialog = ({ open, onOpenChange, bar, onSuccess }: BarFormDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnectingOAuth, setIsConnectingOAuth] = useState(false);
  const { toast } = useToast();
  const isEditMode = !!bar;
  
  const isOAuthConnected = !!(bar?.mp_access_token && bar?.mp_user_id);

  // Usar schema diferente para criação e edição
  const schema = isEditMode ? editBarSchema : createBarSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<BarFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      commissionRate: 5,
      barName: '',
      ...(isEditMode ? {} : { email: '', password: '' }),
    },
  });

  useEffect(() => {
    if (bar && open) {
      // Modo edição - não precisa de email/password
      setValue('barName', bar.name);
      setValue('commissionRate', bar.commission_rate * 100);
    } else if (!bar && open) {
      // Modo criação - precisa de email/password
      reset({
        barName: '',
        email: '',
        password: '',
        commissionRate: 5,
      });
    }
  }, [bar, open, setValue, reset]);

  const handleConnectOAuth = async () => {
    if (isEditMode && !bar) {
      toast({
        title: 'Erro',
        description: 'Bar não encontrado para conexão OAuth.',
        variant: 'destructive',
      });
      return;
    }

    setIsConnectingOAuth(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const mpClientId = import.meta.env.VITE_MP_CLIENT_ID;
      
      // IMPORTANTE: O redirect_uri DEVE ser exatamente o mesmo configurado no Mercado Pago Dashboard
      // Se não estiver configurado no .env, usar o padrão
      let redirectUri = import.meta.env.VITE_MP_REDIRECT_URI;
      if (!redirectUri && supabaseUrl) {
        redirectUri = `${supabaseUrl}/functions/v1/mp-oauth-callback`;
      }
      
      // Validações
      if (!supabaseUrl) {
        throw new Error('VITE_SUPABASE_URL não está configurado no arquivo .env');
      }
      
      if (!mpClientId) {
        throw new Error('VITE_MP_CLIENT_ID não está configurado no arquivo .env');
      }
      
      if (!redirectUri) {
        throw new Error('redirect_uri não pôde ser determinado. Configure VITE_MP_REDIRECT_URI no .env ou VITE_SUPABASE_URL');
      }

      // State contém o bar_id para identificar após o callback
      const state = isEditMode && bar ? bar.id : 'new';

      console.log('🔐 Iniciando fluxo OAuth do Mercado Pago:', {
        clientId: mpClientId.substring(0, 10) + '...',
        redirectUri,
        state,
        barId: isEditMode && bar ? bar.id : 'new'
      });

      // URL de autorização do Mercado Pago
      // IMPORTANTE: Esta URL deve abrir a tela de login do bar no Mercado Pago
      // O bar faz login, autoriza, e o MP redireciona para o redirect_uri com code e state
      // 
      // Para Brasil: https://auth.mercadopago.com.br/authorization
      // Para Argentina: https://auth.mercadopago.com.ar/authorization
      // Geral (redireciona automaticamente): https://auth.mercadopago.com/authorization
      const mpAuthBaseUrl = import.meta.env.VITE_MP_AUTH_URL || 'https://auth.mercadopago.com/authorization';
      const authUrl = new URL(mpAuthBaseUrl);
      authUrl.searchParams.set('client_id', mpClientId.trim());
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('platform_id', 'mp');
      authUrl.searchParams.set('redirect_uri', redirectUri.trim());
      authUrl.searchParams.set('state', state);
      // Scope necessário para OAuth do Mercado Pago (offline_access permite refresh_token)
      authUrl.searchParams.set('scope', 'offline_access read write');

      console.log('🔐 URL de autorização gerada:', authUrl.toString());
      console.log('🔐 Parâmetros da URL:', {
        client_id: mpClientId.substring(0, 10) + '...',
        response_type: 'code',
        platform_id: 'mp',
        redirect_uri: redirectUri,
        state: state,
        scope: 'offline_access read write'
      });

      // IMPORTANTE: Redirecionar para a tela de login do Mercado Pago
      // O usuário (bar) faz login, autoriza, e o MP redireciona de volta para o redirect_uri
      window.location.href = authUrl.toString();
      
      // Não definir isConnectingOAuth como false aqui, pois o usuário será redirecionado
      // Se houver erro antes do redirect, será capturado no catch abaixo
    } catch (error: any) {
      console.error('❌ Erro ao iniciar OAuth:', error);
      setIsConnectingOAuth(false);
      toast({
        title: 'Erro ao conectar',
        description: error.message || 'Não foi possível iniciar a conexão OAuth. Verifique as configurações no arquivo .env',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: BarFormData) => {
    setIsLoading(true);
    try {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('Supabase não está conectado');
      }

      // Validar se é admin
      const { data: { user } } = await client.auth.getUser();
      if (!user || user.user_metadata?.role !== 'admin') {
        throw new Error('Apenas administradores podem gerenciar bares');
      }

      if (isEditMode && bar) {
        // Editar bar existente
        const commissionRateDecimal = data.commissionRate / 100;

        const { error } = await client
          .from('bars')
          .update({
            name: data.barName,
            commission_rate: commissionRateDecimal,
          })
          .eq('id', bar.id);

        if (error) throw error;

        toast({
          title: 'Bar atualizado com sucesso!',
          description: `${data.barName} foi atualizado.`,
        });
      } else {
        // Criar novo bar
        if (!data.password || data.password.length < 6) {
          throw new Error('Senha é obrigatória para novos bares e deve ter no mínimo 6 caracteres');
        }

        const commissionRateDecimal = data.commissionRate / 100;

        // Salvar sessão atual do admin
        const adminSessionBefore = await client.auth.getSession();
        const adminAccessToken = adminSessionBefore.data.session?.access_token;
        const adminRefreshToken = adminSessionBefore.data.session?.refresh_token;

        // Gerar slug único do nome do bar
        const generateSlug = (name: string): string => {
          return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
            .trim()
            .replace(/\s+/g, '-') // Substitui espaços por hífens
            .replace(/-+/g, '-'); // Remove hífens duplicados
        };

        let baseSlug = generateSlug(data.barName);
        let slug = baseSlug;
        let slugCounter = 1;

        // Verificar se o slug já existe e gerar um único
        while (true) {
          const { data: existingBar } = await client
            .from('bars')
            .select('id')
            .eq('slug', slug)
            .single();

          if (!existingBar) break;
          slug = `${baseSlug}-${slugCounter}`;
          slugCounter++;
        }

        // Criar o bar (sem mp_user_id - será conectado via OAuth depois)
        const { data: barData, error: barError } = await client
          .from('bars')
          .insert({
            name: data.barName,
            slug: slug,
            commission_rate: commissionRateDecimal,
            is_active: true,
          })
          .select()
          .single();

        if (barError) throw barError;

        // Criar itens padrão do menu para o novo bar
        // As configurações padrão são criadas automaticamente via trigger
        try {
          const defaultMenuItems = [
            {
              name: 'Água Mineral',
              description: 'Água mineral natural',
              price: 5.00,
              category: 'bebidas',
              image: 'https://images.unsplash.com/photo-1548839140-5a059f162b1e?w=400',
              bar_id: barData.id,
            },
            {
              name: 'Refrigerante',
              description: 'Refrigerante gelado',
              price: 8.00,
              category: 'bebidas',
              image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400',
              bar_id: barData.id,
            },
          ];

          await client
            .from('menu_items')
            .insert(defaultMenuItems);
        } catch (defaultItemsError) {
          console.warn('Erro ao criar itens padrão do menu:', defaultItemsError);
          // Não falhar a criação do bar se os itens padrão falharem
        }

        // Criar usuário
        const { data: authData, error: authError } = await client.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              role: 'owner',
              bar_id: barData.id,
            },
          },
        });

        if (authError) {
          // Remover bar se falhar ao criar usuário
          await client.from('bars').delete().eq('id', barData.id);

          if (
            authError.message?.includes('already registered') ||
            authError.message?.includes('already exists') ||
            authError.message?.includes('User already registered')
          ) {
            throw new Error('Este email já está cadastrado. Use outro email.');
          }

          throw authError;
        }

        // Restaurar sessão do admin imediatamente após criar o usuário
        // Isso é crítico para evitar que o admin seja deslogado
        if (adminAccessToken && adminRefreshToken) {
          try {
            // Usar uma abordagem mais direta para restaurar a sessão
            const { error: sessionError } = await client.auth.setSession({
              access_token: adminAccessToken,
              refresh_token: adminRefreshToken,
            });
            
            if (sessionError) {
              console.warn('Erro ao restaurar sessão do admin:', sessionError);
              // Tentar uma segunda vez após um pequeno delay
              await new Promise(resolve => setTimeout(resolve, 200));
              const { error: retryError } = await client.auth.setSession({
                access_token: adminAccessToken,
                refresh_token: adminRefreshToken,
              });
              
              if (retryError) {
                console.error('Erro ao restaurar sessão após retry:', retryError);
              }
            }
            
            // Aguardar um pouco para garantir que a sessão foi totalmente restaurada
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Verificar se a sessão foi restaurada corretamente
            const { data: { user: restoredUser } } = await client.auth.getUser();
            if (restoredUser?.user_metadata?.role !== 'admin') {
              console.warn('Atenção: Sessão do admin não foi restaurada corretamente após criar bar');
            }
          } catch (sessionError) {
            console.error('Erro crítico ao restaurar sessão do admin:', sessionError);
          }
        }

        toast({
          title: 'Bar cadastrado com sucesso!',
          description: `${data.barName} foi cadastrado e o usuário foi criado.`,
        });
      }

      // Resetar formulário primeiro
      reset();
      
      // Fechar o dialog
      onOpenChange(false);
      
      // Recarregar lista de bares (isso não deve causar redirect)
      // Usar setTimeout pequeno para garantir que o dialog fechou primeiro
      setTimeout(() => {
        onSuccess();
      }, 100);
    } catch (error: any) {
      console.error('Error saving bar:', error);
      toast({
        title: `Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} bar`,
        description: error.message || `Não foi possível ${isEditMode ? 'atualizar' : 'cadastrar'} o bar.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Bar' : 'Cadastrar Novo Bar'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Atualize as informações do estabelecimento'
              : 'Adicione um novo estabelecimento ao sistema'}
          </DialogDescription>
        </DialogHeader>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            console.log('📝 Form submit iniciado');
            console.log('Modo:', isEditMode ? 'Edição' : 'Criação');
            console.log('Erros do formulário:', errors);
            handleSubmit(
              (data) => {
                console.log('✅ Validação passou, dados:', data);
                onSubmit(data);
              },
              (errors) => {
                console.error('❌ Erros de validação:', errors);
                toast({
                  title: 'Erro de validação',
                  description: 'Por favor, preencha todos os campos obrigatórios corretamente.',
                  variant: 'destructive',
                });
              }
            )(e);
          }} 
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="barName">Nome do Bar *</Label>
            <Input
              id="barName"
              placeholder="Ex: Bar do João"
              {...register('barName')}
              disabled={isLoading}
            />
            {errors.barName && (
              <p className="text-sm text-destructive">{errors.barName.message}</p>
            )}
          </div>

          {!isEditMode && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email do Dono *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="dono@bar.com"
                  {...register('email')}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
            </>
          )}

          {/* Status e Conexão Mercado Pago */}
          <div className="space-y-2">
            <Label>Conexão Mercado Pago</Label>
            
            {isEditMode ? (
              <>
                {isOAuthConnected ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                          Conectado
                        </span>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        User ID: {bar.mp_user_id}
                      </p>
                      {bar.mp_oauth_connected_at && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Conectado em: {new Date(bar.mp_oauth_connected_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleConnectOAuth}
                      disabled={isLoading || isConnectingOAuth}
                      className="w-full"
                    >
                      {isConnectingOAuth ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        <>
                          <Link2 className="mr-2 h-4 w-4" />
                          Reautorizar Mercado Pago
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm text-red-800 dark:text-red-200">
                          Não conectado
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleConnectOAuth}
                      disabled={isLoading || isConnectingOAuth}
                      className="w-full"
                    >
                      {isConnectingOAuth ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        <>
                          <Link2 className="mr-2 h-4 w-4" />
                          Conectar Mercado Pago
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-3 bg-muted border rounded-md">
                <p className="text-sm text-muted-foreground">
                  A conexão com o Mercado Pago pode ser configurada após criar o bar.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="commissionRate">Taxa de Comissão (%) *</Label>
            <Input
              id="commissionRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="5"
              {...register('commissionRate', { valueAsNumber: true })}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Valor entre 0 e 100 (ex: 5 para 5%)
            </p>
            {errors.commissionRate && (
              <p className="text-sm text-destructive">
                {errors.commissionRate.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? 'Salvando...' : 'Cadastrando...'}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {isEditMode ? 'Salvar' : 'Cadastrar'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BarFormDialog;



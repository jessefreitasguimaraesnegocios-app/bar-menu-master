import { useState, useEffect } from 'react';
import { Loader2, Palette, Type, Image as ImageIcon, Webhook, ToggleLeft, ToggleRight } from 'lucide-react';
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

interface Bar {
  id: string;
  name: string;
  mp_user_id: string;
  commission_rate: number;
}

interface BarSettings {
  id?: string;
  bar_id: string;
  webhook_kitchen_url?: string | null;
  webhook_bartender_url?: string | null;
  webhook_waiter_url?: string | null;
  webhook_kitchen_enabled?: boolean;
  webhook_bartender_enabled?: boolean;
  webhook_waiter_enabled?: boolean;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  logo_url?: string;
}

interface BarSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bar: Bar | null;
  onSuccess: () => void;
}

const BarSettingsDialog = ({ open, onOpenChange, bar, onSuccess }: BarSettingsDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [formData, setFormData] = useState({
    webhook_kitchen_url: '',
    webhook_bartender_url: '',
    webhook_waiter_url: '',
    webhook_kitchen_enabled: false,
    webhook_bartender_enabled: false,
    webhook_waiter_enabled: false,
    primary_color: '#d97706',
    secondary_color: '#92400e',
    font_family: 'Inter',
    logo_url: '',
  });
  const { toast } = useToast();

  // Buscar configurações existentes quando o dialog abrir
  useEffect(() => {
    const fetchSettings = async () => {
      if (!bar || !open) return;

      setLoadingSettings(true);
      try {
        const client = getSupabaseClient();
        if (!client) {
          throw new Error('Supabase não está conectado');
        }

        const { data, error } = await client
          .from('bar_settings')
          .select('*')
          .eq('bar_id', bar.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = nenhum registro encontrado (normal se for novo)
          console.error('Error fetching settings:', error);
        }

        if (data) {
          setFormData({
            webhook_kitchen_url: data.webhook_kitchen_url || '',
            webhook_bartender_url: data.webhook_bartender_url || '',
            webhook_waiter_url: data.webhook_waiter_url || '',
            webhook_kitchen_enabled: data.webhook_kitchen_enabled || false,
            webhook_bartender_enabled: data.webhook_bartender_enabled || false,
            webhook_waiter_enabled: data.webhook_waiter_enabled || false,
            primary_color: data.primary_color || '#d97706',
            secondary_color: data.secondary_color || '#92400e',
            font_family: data.font_family || 'Inter',
            logo_url: data.logo_url || '',
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, [bar, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bar) return;

    setIsLoading(true);
    try {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('Supabase não está conectado');
      }

      // Verificar se é admin ou owner
      const { data: { user } } = await client.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const userRole = user.user_metadata?.role;
      const userBarId = user.user_metadata?.bar_id;

      // Verificar permissão: admin pode salvar qualquer bar, owner só pode salvar seu próprio bar
      if (userRole !== 'admin' && (userRole !== 'owner' || userBarId !== bar.id)) {
        throw new Error('Você não tem permissão para salvar as configurações deste bar');
      }

      console.log('💾 Salvando configurações do bar:', {
        bar_id: bar.id,
        bar_name: bar.name,
        user_role: userRole,
        user_bar_id: userBarId
      });

      // Usar upsert para criar ou atualizar configurações
      const { data, error } = await client
        .from('bar_settings')
        .upsert({
          bar_id: bar.id,
          webhook_kitchen_url: formData.webhook_kitchen_url || null,
          webhook_bartender_url: formData.webhook_bartender_url || null,
          webhook_waiter_url: formData.webhook_waiter_url || null,
          webhook_kitchen_enabled: formData.webhook_kitchen_enabled,
          webhook_bartender_enabled: formData.webhook_bartender_enabled,
          webhook_waiter_enabled: formData.webhook_waiter_enabled,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          font_family: formData.font_family,
          logo_url: formData.logo_url || null,
        }, {
          onConflict: 'bar_id'
        })
        .select();

      if (error) {
        console.error('❌ Erro ao salvar configurações:', error);
        console.error('Detalhes:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('✅ Configurações salvas com sucesso:', data);

      toast({
        title: 'Configurações salvas!',
        description: `As configurações de ${bar.name} foram atualizadas com sucesso.`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('❌ Error saving settings:', error);
      toast({
        title: 'Erro ao salvar configurações',
        description: error.message || 'Não foi possível salvar as configurações. Verifique se você tem permissão de admin.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!bar) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações - {bar.name}</DialogTitle>
          <DialogDescription>
            Configure webhooks, aparência e outras opções deste estabelecimento
          </DialogDescription>
        </DialogHeader>

        {loadingSettings ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Webhooks */}
          <div className="space-y-4 border-b pb-4">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Webhooks de Notificação</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure URLs para receber notificações quando pedidos são criados ou atualizados
            </p>

            {/* Webhook Cozinha */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="webhook_kitchen">Cozinha</Label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, webhook_kitchen_enabled: !formData.webhook_kitchen_enabled })}
                  className="flex items-center gap-2"
                >
                  {formData.webhook_kitchen_enabled ? (
                    <ToggleRight className="h-5 w-5 text-primary" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-sm">{formData.webhook_kitchen_enabled ? 'Habilitado' : 'Desabilitado'}</span>
                </button>
              </div>
              <Input
                id="webhook_kitchen"
                type="url"
                value={formData.webhook_kitchen_url}
                onChange={(e) => setFormData({ ...formData, webhook_kitchen_url: e.target.value })}
                disabled={isLoading || !formData.webhook_kitchen_enabled}
                placeholder="https://seu-servidor.com/webhook/cozinha"
              />
            </div>

            {/* Webhook Barman */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="webhook_bartender">Barman</Label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, webhook_bartender_enabled: !formData.webhook_bartender_enabled })}
                  className="flex items-center gap-2"
                >
                  {formData.webhook_bartender_enabled ? (
                    <ToggleRight className="h-5 w-5 text-primary" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-sm">{formData.webhook_bartender_enabled ? 'Habilitado' : 'Desabilitado'}</span>
                </button>
              </div>
              <Input
                id="webhook_bartender"
                type="url"
                value={formData.webhook_bartender_url}
                onChange={(e) => setFormData({ ...formData, webhook_bartender_url: e.target.value })}
                disabled={isLoading || !formData.webhook_bartender_enabled}
                placeholder="https://seu-servidor.com/webhook/barman"
              />
            </div>

            {/* Webhook Garçom */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="webhook_waiter">Garçom</Label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, webhook_waiter_enabled: !formData.webhook_waiter_enabled })}
                  className="flex items-center gap-2"
                >
                  {formData.webhook_waiter_enabled ? (
                    <ToggleRight className="h-5 w-5 text-primary" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-sm">{formData.webhook_waiter_enabled ? 'Habilitado' : 'Desabilitado'}</span>
                </button>
              </div>
              <Input
                id="webhook_waiter"
                type="url"
                value={formData.webhook_waiter_url}
                onChange={(e) => setFormData({ ...formData, webhook_waiter_url: e.target.value })}
                disabled={isLoading || !formData.webhook_waiter_enabled}
                placeholder="https://seu-servidor.com/webhook/garcom"
              />
            </div>
          </div>

          {/* Cores */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Cores</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Cor Primária</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) =>
                      setFormData({ ...formData, primary_color: e.target.value })
                    }
                    disabled={isLoading}
                    className="w-20 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) =>
                      setFormData({ ...formData, primary_color: e.target.value })
                    }
                    disabled={isLoading}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary_color">Cor Secundária</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary_color"
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) =>
                      setFormData({ ...formData, secondary_color: e.target.value })
                    }
                    disabled={isLoading}
                    className="w-20 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={formData.secondary_color}
                    onChange={(e) =>
                      setFormData({ ...formData, secondary_color: e.target.value })
                    }
                    disabled={isLoading}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tipografia */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Type className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Tipografia</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="font_family">Família de Fonte</Label>
              <select
                id="font_family"
                value={formData.font_family}
                onChange={(e) =>
                  setFormData({ ...formData, font_family: e.target.value })
                }
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Poppins">Poppins</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Playfair Display">Playfair Display</option>
              </select>
            </div>
          </div>

          {/* Logo */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Logo</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url">URL do Logo</Label>
              <Input
                id="logo_url"
                type="url"
                value={formData.logo_url}
                onChange={(e) =>
                  setFormData({ ...formData, logo_url: e.target.value })
                }
                disabled={isLoading}
                placeholder="https://exemplo.com/logo.png"
              />
              {formData.logo_url && (
                <div className="mt-2">
                  <img
                    src={formData.logo_url}
                    alt="Preview do logo"
                    className="h-20 object-contain rounded border border-border/50 p-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
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
                  Salvando...
                </>
              ) : (
                'Salvar Configurações'
              )}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BarSettingsDialog;


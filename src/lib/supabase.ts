import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export const initializeSupabase = (url: string, anonKey: string): SupabaseClient => {
  supabaseClient = createClient(url, anonKey);
  // Save to localStorage for persistence
  if (typeof window !== 'undefined') {
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_anon_key', anonKey);
  }
  return supabaseClient;
};

export const getSupabaseClient = (): SupabaseClient | null => {
  // Sempre tentar buscar das variáveis de ambiente primeiro (para produção)
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Se temos variáveis de ambiente, usar elas (prioridade máxima)
  if (envUrl && envAnonKey) {
    // Se já existe cliente mas com credenciais diferentes, recriar
    if (!supabaseClient || 
        (supabaseClient as any).supabaseUrl !== envUrl) {
      supabaseClient = createClient(envUrl, envAnonKey);
      if (typeof window !== 'undefined') {
        console.log('✅ Supabase conectado via variáveis de ambiente');
      }
    }
    return supabaseClient;
  }
  
  // Se já existe cliente criado, retornar
  if (supabaseClient) {
    return supabaseClient;
  }
  
  // Fallback: localStorage (para conexão manual)
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('supabase_url');
    const savedKey = localStorage.getItem('supabase_anon_key');
    
    if (savedUrl && savedKey) {
      supabaseClient = createClient(savedUrl, savedKey);
      console.log('✅ Supabase conectado via localStorage');
      return supabaseClient;
    }
  }
  
  // Log de debug em produção
  if (typeof window !== 'undefined') {
    console.warn('⚠️ Supabase não conectado. Variáveis de ambiente não encontradas.');
    console.warn('💡 Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Vercel (veja VERCEL_SETUP.md)');
  }
  
  return null;
};

export const isSupabaseConnected = (): boolean => {
  return supabaseClient !== null;
};

export const disconnectSupabase = (): void => {
  supabaseClient = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_anon_key');
  }
};


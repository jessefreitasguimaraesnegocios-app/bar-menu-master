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
  if (!supabaseClient) {
    // Prioridade 1: Variáveis de ambiente (recomendado)
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (envUrl && envAnonKey) {
      supabaseClient = createClient(envUrl, envAnonKey);
      return supabaseClient;
    }
    
    // Prioridade 2: localStorage (fallback para conexão manual)
    if (typeof window !== 'undefined') {
      const savedUrl = localStorage.getItem('supabase_url');
      const savedKey = localStorage.getItem('supabase_anon_key');
      
      if (savedUrl && savedKey) {
        supabaseClient = createClient(savedUrl, savedKey);
        return supabaseClient;
      }
    }
  }
  return supabaseClient;
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


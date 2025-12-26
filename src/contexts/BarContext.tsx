import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

interface BarContextType {
  barId: string | null;
  setBarId: (barId: string | null) => void;
  getCurrentBarId: () => string | null;
  isLoading: boolean;
}

const BarContext = createContext<BarContextType | undefined>(undefined);

export const BarProvider = ({ children }: { children: ReactNode }) => {
  const [barId, setBarIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função para buscar o primeiro bar ativo do banco de dados
  const fetchDefaultBar = async (): Promise<string | null> => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.warn('⚠️ Supabase não está conectado');
        return null;
      }

      console.log('🔍 Buscando bar ativo no banco de dados...');
      
      const { data, error } = await supabase
        .from('bars')
        .select('id, name')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle(); // Usar maybeSingle ao invés de single para não dar erro se não encontrar

      if (error) {
        console.error('❌ Erro ao buscar bar:', error);
        return null;
      }

      if (!data) {
        console.warn('⚠️ Nenhum bar ativo encontrado no banco de dados');
        return null;
      }

      console.log(`✅ Bar encontrado: ${data.name} (${data.id})`);
      return data.id;
    } catch (error) {
      console.error('❌ Erro ao buscar bar padrão:', error);
      return null;
    }
  };

  // Inicializar bar_id
  useEffect(() => {
    const initializeBarId = async () => {
      setIsLoading(true);
      
      if (typeof window !== 'undefined') {
        // 1. Verificar se há bar_id na URL (tem prioridade máxima)
        const urlParams = new URLSearchParams(window.location.search);
        const urlBarId = urlParams.get('bar_id');
        if (urlBarId) {
          setBarIdState(urlBarId);
          localStorage.setItem('bar_id', urlBarId);
          setIsLoading(false);
          return;
        }
        
        // 2. Verificar localStorage
        const savedBarId = localStorage.getItem('bar_id');
        if (savedBarId) {
          setBarIdState(savedBarId);
          setIsLoading(false);
          return;
        }
      }
      
      // 3. Buscar o primeiro bar ativo do banco de dados
      const defaultBarId = await fetchDefaultBar();
      if (defaultBarId) {
        setBarIdState(defaultBarId);
        if (typeof window !== 'undefined') {
          localStorage.setItem('bar_id', defaultBarId);
        }
      }
      
      setIsLoading(false);
    };

    initializeBarId();
  }, []);

  const setBarId = (newBarId: string | null) => {
    setBarIdState(newBarId);
    if (typeof window !== 'undefined') {
      if (newBarId) {
        localStorage.setItem('bar_id', newBarId);
      } else {
        localStorage.removeItem('bar_id');
      }
    }
  };

  const getCurrentBarId = (): string | null => {
    // Verificar URL primeiro (tem prioridade)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlBarId = urlParams.get('bar_id');
      if (urlBarId) {
        return urlBarId;
      }
    }
    
    // Retornar o estado atual
    return barId;
  };

  // Atualizar estado se bar_id mudar na URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlBarId = urlParams.get('bar_id');
      if (urlBarId && urlBarId !== barId) {
        setBarIdState(urlBarId);
        localStorage.setItem('bar_id', urlBarId);
      }
    }
  }, [barId]);

  return (
    <BarContext.Provider
      value={{
        barId,
        setBarId,
        getCurrentBarId,
        isLoading,
      }}
    >
      {children}
    </BarContext.Provider>
  );
};

export const useBar = () => {
  const context = useContext(BarContext);
  if (context === undefined) {
    throw new Error('useBar must be used within a BarProvider');
  }
  return context;
};




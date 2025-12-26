import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface BarContextType {
  barId: string | null;
  setBarId: (barId: string | null) => void;
  getCurrentBarId: () => string | null;
}

const BarContext = createContext<BarContextType | undefined>(undefined);

export const BarProvider = ({ children }: { children: ReactNode }) => {
  // Tentar carregar bar_id do localStorage ou usar padrão
  const [barId, setBarIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      // Verificar se há bar_id na URL
      const urlParams = new URLSearchParams(window.location.search);
      const urlBarId = urlParams.get('bar_id');
      if (urlBarId) {
        return urlBarId;
      }
      
      // Verificar localStorage
      const savedBarId = localStorage.getItem('bar_id');
      if (savedBarId) {
        return savedBarId;
      }
    }
    return null;
  });

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
      }
    }
  }, [barId]);

  return (
    <BarContext.Provider
      value={{
        barId,
        setBarId,
        getCurrentBarId,
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


import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

interface AuthContextType {
  isOwner: boolean;
  isAdmin: boolean;
  barId: string | null;
  signOut: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signInAsAdmin: (email: string, password: string) => Promise<void>;
  user: any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [barId, setBarId] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);

  const checkUserRole = (user: any) => {
    const role = user?.user_metadata?.role;
    const userBarId = user?.user_metadata?.bar_id;
    
    setIsAdmin(role === 'admin');
    setIsOwner(role === 'owner');
    setBarId(userBarId || null);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const client = getSupabaseClient();
      if (!client) {
        setIsOwner(false);
        return;
      }

      try {
        const { data: { user }, error } = await client.auth.getUser();
        if (user && !error) {
          setUser(user);
          checkUserRole(user);
        } else {
          setUser(null);
          setIsOwner(false);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setUser(null);
        setIsOwner(false);
        setIsAdmin(false);
      }
    };

    checkAuth();

    // Listener para mudanças de autenticação
    const client = getSupabaseClient();
    if (client) {
      const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          checkUserRole(session.user);
          
          // Se for owner sem bar_id, tentar buscar automaticamente
          if (session.user.user_metadata?.role === 'owner' && !session.user.user_metadata?.bar_id) {
            console.warn('Owner sem bar_id detectado, tentando buscar...');
            try {
              const { data: barsData } = await client
                .from('bars')
                .select('id, name')
                .limit(10);
              
              if (barsData && barsData.length === 1) {
                // Se houver apenas um bar, podemos assumir que é esse
                console.log('Apenas um bar encontrado, associando automaticamente:', barsData[0].id);
                // Nota: Não podemos atualizar user_metadata sem service role
                // Mas podemos usar o bar_id diretamente do banco
                setBarId(barsData[0].id);
              } else if (barsData && barsData.length > 1) {
                // Tentar encontrar pelo nome do bar que pode estar no email
                const emailParts = session.user.email?.split('@')[0].toLowerCase() || '';
                const matchingBar = barsData.find(bar => 
                  bar.name.toLowerCase().includes(emailParts) || 
                  emailParts.includes(bar.name.toLowerCase())
                );
                
                if (matchingBar) {
                  console.log('Bar encontrado pelo nome/email, associando:', matchingBar.id);
                  setBarId(matchingBar.id);
                }
              }
            } catch (error) {
              console.error('Erro ao buscar bar para owner:', error);
            }
          }
        } else {
          setUser(null);
          setIsOwner(false);
          setIsAdmin(false);
          setBarId(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

      if (data.user) {
        // Verificar se é admin antes de setar o usuário
        if (data.user.user_metadata?.role === 'admin') {
          await client.auth.signOut();
          throw new Error('Este usuário não existe');
        }
        
        // Se for owner e não tiver bar_id, tentar buscar pelo email
        if (data.user.user_metadata?.role === 'owner' && !data.user.user_metadata?.bar_id) {
          console.warn('Owner sem bar_id no user_metadata, tentando buscar no banco...');
          
          try {
            // Buscar bar pelo email do usuário (assumindo que o email está relacionado ao bar)
            // Ou buscar todos os bares e tentar associar
            const { data: barsData, error: barsError } = await client
              .from('bars')
              .select('id, name')
              .limit(100);
            
            if (!barsError && barsData && barsData.length > 0) {
              // Tentar encontrar o bar pelo nome (pode ser que o email contenha o nome do bar)
              // Ou simplesmente pegar o primeiro bar se houver apenas um
              // Por enquanto, vamos apenas logar para debug
              console.log('Bares encontrados:', barsData);
              
              // Se houver apenas um bar, podemos associar automaticamente
              // Mas isso é perigoso, então vamos apenas avisar
              if (barsData.length === 1) {
                console.warn('Apenas um bar encontrado. Considere atualizar o user_metadata manualmente.');
              }
            }
          } catch (searchError) {
            console.error('Erro ao buscar bar:', searchError);
          }
        }
        
        // Setar usuário e role
        setUser(data.user);
        checkUserRole(data.user);
        
        // Log detalhado para debug
        console.log('Login realizado:', {
          email: data.user.email,
          role: data.user.user_metadata?.role,
          bar_id: data.user.user_metadata?.bar_id,
          full_metadata: data.user.user_metadata,
        });
      }
  };

  const signInAsAdmin = async (email: string, password: string) => {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      setUser(data.user);
      checkUserRole(data.user);
      
      // Se não for admin, não deve fazer login aqui
      if (data.user.user_metadata?.role !== 'admin') {
        await client.auth.signOut();
        throw new Error('Apenas admins podem fazer login em /admin');
      }
    }
  };

  const signOut = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
      setUser(null);
      setIsOwner(false);
      setIsAdmin(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isOwner,
        isAdmin,
        barId,
        signOut,
        signIn,
        signInAsAdmin,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

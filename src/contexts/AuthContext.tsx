import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  isOwner: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkUser = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await client.auth.getSession();
      setUser(session?.user ?? null);
    } catch (error) {
      console.error('Error checking session:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();

    const client = getSupabaseClient();
    if (!client) return;

    // Escutar mudanças de autenticação
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase não está conectado');
    }

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Verificar se o usuário é owner
    if (data.user?.user_metadata?.role !== 'owner') {
      await client.auth.signOut();
      throw new Error('Acesso negado. Apenas proprietários podem fazer login.');
    }

    setUser(data.user);
  };

  const signOut = async () => {
    const client = getSupabaseClient();
    if (!client) return;

    await client.auth.signOut();
    setUser(null);
  };

  const isOwner = user?.user_metadata?.role === 'owner';

  return (
    <AuthContext.Provider value={{ user, isOwner, loading, signIn, signOut }}>
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





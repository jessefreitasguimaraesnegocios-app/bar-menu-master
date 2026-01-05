import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

export interface Bar {
  id: string;
  name: string;
  slug: string;
  mp_user_id: string;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useBar = (slug?: string) => {
  const [bar, setBar] = useState<Bar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBarBySlug = useCallback(async (barSlug: string) => {
    const client = getSupabaseClient();
    if (!client) {
      setError(new Error('Supabase client not available'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await client
        .from('bars')
        .select('*')
        .eq('slug', barSlug)
        .eq('is_active', true)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Nenhum bar encontrado
          setError(new Error('Estabelecimento não encontrado'));
        } else {
          throw fetchError;
        }
        setBar(null);
      } else {
        setBar(data as Bar);
      }
    } catch (err) {
      console.error('Error fetching bar by slug:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch bar'));
      setBar(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (slug) {
      fetchBarBySlug(slug);
    } else {
      setLoading(false);
      setBar(null);
    }
  }, [slug, fetchBarBySlug]);

  return {
    bar,
    loading,
    error,
    refetch: () => slug ? fetchBarBySlug(slug) : Promise.resolve(),
  };
};











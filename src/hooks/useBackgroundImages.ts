import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

type BackgroundImageType = 'hero' | 'menu' | 'featured';

interface BackgroundImageConfig {
  type: BackgroundImageType;
  image_url: string;
}

export const useBackgroundImages = (enablePolling: boolean = false) => {
  const [images, setImages] = useState<Record<BackgroundImageType, string | null>>({
    hero: null,
    menu: null,
    featured: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      const client = getSupabaseClient();
      if (!client) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await client
          .from('background_image_configs')
          .select('*');

        if (error) throw error;

        const imageMap: Record<BackgroundImageType, string | null> = {
          hero: null,
          menu: null,
          featured: null,
        };

        if (data) {
          data.forEach((config: BackgroundImageConfig) => {
            imageMap[config.type] = config.image_url;
          });
        }

        setImages(imageMap);
      } catch (error) {
        console.error('Error fetching background images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();

    // Polling apenas se habilitado (útil para páginas públicas)
    let interval: NodeJS.Timeout | null = null;
    if (enablePolling) {
      interval = setInterval(fetchImages, 30000); // 30 segundos (menos frequente)
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [enablePolling]);

  return { images, loading };
};


import { useState, useEffect } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/integrations/supabase/client';
import { Logger } from '@/services/Logger';

interface ProductImage {
  [productId: string]: string;
}

export const useOdooProductImages = (productIds: number[]) => {
  const [images, setImages] = useState<ProductImage>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productIds.length === 0) return;

    // Temporarily disable Odoo image API due to authentication issues
    // Use fallback images exclusively until the API is stable
    const skipImageFetch = true;

    if (skipImageFetch) {
      // Odoo image API disabled - using fallback images only
      setLoading(false);
      setImages({}); // Empty images will trigger fallback system
      return;
    }

    const fetchImages = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token || supabaseAnonKey;

        const response = await fetch(`${supabaseUrl}/functions/v1/product-images`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            product_ids: productIds,
            image_size: 'image_256'
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          Logger.warn(`Failed to fetch images (${response.status}): ${errorText}`);
          // Don't throw error, just continue with empty images
          return;
        }

        const data = await response.json();
        
        if (data.images) {
          // Convert base64 images to data URLs
          const processedImages: ProductImage = {};
          Object.entries(data.images).forEach(([id, base64Data]) => {
            if (base64Data && typeof base64Data === 'string') {
              // The API returns data:image/png;base64,{base64Data} format
              processedImages[id] = base64Data;
            }
          });
          setImages(processedImages);
        }
      } catch (err) {
        Logger.warn('Error fetching Odoo product images (using fallbacks):', err);
        // Don't set error state - just use fallbacks silently
        setImages({}); // Empty images object will trigger fallbacks
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [productIds]);

  return { images, loading, error };
};
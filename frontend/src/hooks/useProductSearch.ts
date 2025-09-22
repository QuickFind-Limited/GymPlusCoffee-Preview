import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: number;
  title: string;
  vendor: string;
  price_min: number | null;
  price_max: number | null;
  images?: Array<{
    src: string;
    alt: string | null;
    position: number;
  }>;
}

interface UseProductSearchReturn {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function useProductSearch(): UseProductSearchReturn {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Search products when debounced query changes
  useEffect(() => {
    const searchProducts = async () => {
      if (!debouncedQuery || debouncedQuery.trim().length === 0) {
        setProducts([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get current session for authentication
        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token || supabaseAnonKey;

        // Search using Odoo
        const searchResponse = await fetch(`${supabaseUrl}/functions/v1/product-search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            query: debouncedQuery,
            search_type: 'single'
          })
        });

        if (!searchResponse.ok) {
          throw new Error(`Search failed: ${searchResponse.statusText}`);
        }

        const data = await searchResponse.json();
        
        // If images are available separately, fetch them
        if (data.images_available && data.products?.length > 0) {
          const productIds = data.products.map((p: any) => p.id).filter(Boolean);
          
          const imageResponse = await fetch(`${supabaseUrl}/functions/v1/${data.image_endpoint}`, {
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
          
          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            
            // Merge images into products
            if (imageData.images) {
              data.products = data.products.map((product: any) => ({
                ...product,
                image_256: imageData.images[product.id] || null
              }));
            }
          }
        }

        // Transform Odoo products to match the expected interface
        const transformedProducts: Product[] = data.products?.map((product: any) => ({
          id: product.id,
          title: product.display_name || product.name,
          vendor: product.vendor || product.supplier_name || product.supplier || 'Unknown Supplier',
          price_min: product.list_price || null,
          price_max: product.list_price || null,
          images: product.image_256 ? [{
            src: product.image_256,
            alt: product.name,
            position: 1
          }] : []
        })) || [];

        setProducts(transformedProducts);
      } catch (err) {
        console.error('Search error:', err);
        setError(err as Error);
        toast({
          title: 'Search Error',
          description: 'Failed to search products. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    searchProducts();
  }, [debouncedQuery, toast]);

  return {
    products,
    isLoading,
    error,
    searchQuery,
    setSearchQuery
  };
}
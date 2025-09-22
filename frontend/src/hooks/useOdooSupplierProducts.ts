import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase, supabaseUrl } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { Logger } from '@/services/Logger';

export interface OdooSupplierProduct {
  id: number;
  product_id?: [number, string];
  product_name?: string;
  product_code?: string;
  min_qty?: number; // This is MOQ (Minimum Order Quantity)
  price?: number;
  delay?: number;
  currency_id?: [number, string];
  
  // Extended fields from product.product
  qty_available?: number;      // Current stock available
  virtual_available?: number;  // Forecasted availability
  
  // Custom fields (may need to be added to Odoo or fetched separately)
  minimum_level?: number;      // Reorder point
  pack_size?: number;          // Units per package
  
  product_details?: {
    id: number;
    name: string;
    default_code?: string;
    qty_available?: number;
    virtual_available?: number;
    list_price?: number;
  };
}

interface ProductsResponse {
  data: OdooSupplierProduct[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}



export const useOdooSupplierProducts = (supplierId: number | null, enabled: boolean = false) => {
  const { toast } = useToast();

  return useInfiniteQuery({
    queryKey: ['odoo-supplier-products', supplierId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!supplierId) return null;

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error('Authentication required');
        }

        // Build query parameters for products
        const queryParams = new URLSearchParams({
          supplierId: supplierId.toString(),
          offset: pageParam.toString(),
          limit: '50'
        });

        // Call the edge function for products
        const response = await fetch(
          `${supabaseUrl}/functions/v1/supplier-catalog?${queryParams}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch products');
        }

        const data: ProductsResponse = await response.json();
        return data;
      } catch (error) {
        Logger.error('Error fetching supplier products:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to fetch products',
          variant: 'destructive',
        });
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.hasMore) return undefined;
      return (lastPage.page + 1) * lastPage.pageSize;
    },
    initialPageParam: 0,
    enabled: !!supplierId && enabled,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
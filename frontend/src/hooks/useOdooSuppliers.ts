import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase, supabaseUrl } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { Logger } from '@/services/Logger';

interface OdooSupplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  street?: string;
  street2?: string;
  city?: string;
  zip?: string;
  state_id?: [number, string];
  country_id?: [number, string];
  supplier_rank: number;
  website?: string;
  comment?: string;
  partner_latitude?: number;
  partner_longitude?: number;
  products?: OdooSupplierProduct[];
  product_count?: number;
}

interface OdooSupplierProduct {
  id: number;
  product_id?: [number, string];
  product_name?: string;
  product_code?: string;
  min_qty?: number;
  price?: number;
  delay?: number;
  currency_id?: [number, string];
  product_details?: {
    id: number;
    name: string;
    default_code?: string;
    qty_available?: number;
    virtual_available?: number;
    list_price?: number;
  };
}

interface SuppliersResponse {
  suppliers: OdooSupplier[];
  pagination: {
    offset: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

interface UseOdooSuppliersOptions {
  search?: string;
  limit?: number;
  withProducts?: boolean;
}

export const useOdooSuppliers = (options: UseOdooSuppliersOptions = {}) => {
  const { toast } = useToast();
  const { search = '', limit = 50, withProducts = true } = options;

  return useInfiniteQuery({
    queryKey: ['odoo-suppliers', search, limit, withProducts],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        // Get session for authentication
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error('Authentication required');
        }

        // Build query parameters
        const queryParams = new URLSearchParams({
          offset: pageParam.toString(),
          limit: limit.toString(),
          withProducts: withProducts.toString(),
        });

        if (search) {
          queryParams.append('search', search);
        }

        // Call the edge function
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
          throw new Error(errorData.error || 'Failed to fetch suppliers');
        }

        const data: SuppliersResponse = await response.json();
        return data;
      } catch (error) {
        Logger.error('Error fetching Odoo suppliers:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to fetch suppliers',
          variant: 'destructive',
        });
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) return undefined;
      return lastPage.pagination.offset + lastPage.pagination.limit;
    },
    initialPageParam: 0,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Single supplier query for detailed view
export const useOdooSupplier = (supplierId: number | null) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['odoo-supplier', supplierId],
    queryFn: async () => {
      if (!supplierId) return null;

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error('Authentication required');
        }

        // For now, we'll use the suppliers endpoint with search
        // In the future, we might want a dedicated endpoint for single supplier
        const response = await fetch(
          `${supabaseUrl}/functions/v1/supplier-list-legacy?withProducts=true&limit=1`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              supplierId: supplierId
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch supplier');
        }

        const data: SuppliersResponse = await response.json();
        return data.suppliers[0] || null;
      } catch (error) {
        Logger.error('Error fetching Odoo supplier:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to fetch supplier',
          variant: 'destructive',
        });
        throw error;
      }
    },
    enabled: !!supplierId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
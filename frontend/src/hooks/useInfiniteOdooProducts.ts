import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/integrations/supabase/client';
import { Logger } from '@/services/Logger';

interface Product {
  id: string;
  name: string;
  vendor: string;
  price_min: number | null;
  price_max: number | null;
  product_type: string | null;
  body_html: string | null;
  handle: string | null;
  created_at: string;
  image: string | null;
  product_images?: {
    src: string;
    alt: string | null;
    position: number;
  }[];
}

interface UseInfiniteProductsParams {
  searchQuery?: string;
  vendor?: string | null;
  priceMin?: number;
  priceMax?: number;
  productType?: string | null;
  sortBy?: 'name' | 'price' | 'vendor' | 'created_at';
  pageSize?: number;
}

interface ProductsPage {
  products: Product[];
  nextPage: number | null;
  totalCount: number;
}

const fetchProducts = async ({
  pageParam = 0,
  searchQuery = '',
  vendor = null,
  priceMin = 0,
  priceMax = 1000000,
  productType = null,
  sortBy = 'name',
  pageSize = 20
}: UseInfiniteProductsParams & { pageParam?: number }): Promise<ProductsPage> => {
  try {
    // Get current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token || supabaseAnonKey;

    Logger.debug('Fetching products with params', { searchQuery, pageParam, pageSize, vendor, productType });

    // Always use product-catalog endpoint (it handles both search and listing)
    const requestBody = {
      offset: pageParam * pageSize,
      limit: pageSize,
      ...(searchQuery && searchQuery.trim() && { search: searchQuery.trim() }),
      ...(productType && { category: parseInt(productType) }),
      ...(vendor && { vendor: vendor })
    };

    Logger.debug('Using product-catalog endpoint', { endpoint: 'product-catalog', hasSearch: !!searchQuery });

    const searchResponse = await fetch(`${supabaseUrl}/functions/v1/product-catalog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(requestBody)
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      Logger.error('Search API error:', { status: searchResponse.status, error: errorText });
      throw new Error(`Search failed: ${searchResponse.statusText} - ${errorText}`);
    }

    const data = await searchResponse.json();
    Logger.debug('API Response received', { productsCount: data?.products?.length || 0, totalCount: data?.total_count });
    
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
      id: String(product.id),
      name: product.display_name || product.name || 'Unknown Product',
      vendor: product.vendor || product.supplier_name || product.supplier || 'Unknown Supplier',
      price_min: product.list_price || null,
      price_max: product.list_price || null,
      product_type: Array.isArray(product.categ_id) ? product.categ_id[1] : null,
      body_html: product.description_sale || null,
      handle: product.default_code || null,
      created_at: new Date().toISOString(), // Odoo doesn't expose creation date in search
      image: product.image_256 || null,
      product_images: product.image_256 ? [{
        src: product.image_256,
        alt: product.name,
        position: 1
      }] : []
    })) || [];

    // The endpoint now handles pagination server-side
    const hasMore = (pageParam + 1) * pageSize < (data.total_count || 0);

    Logger.debug('Products transformed', { count: transformedProducts.length, totalCount: data.total_count });

    return {
      products: transformedProducts,
      nextPage: hasMore ? pageParam + 1 : null,
      totalCount: data.total_count || 0
    };
  } catch (error) {
    Logger.error('Error fetching Odoo products:', error);
    throw new Error(`Failed to fetch products: ${error}`);
  }
};

export const useInfiniteOdooProducts = (params: UseInfiniteProductsParams) => {
  return useInfiniteQuery({
    queryKey: ['odoo-products', 'infinite', params],
    queryFn: ({ pageParam }) => fetchProducts({ ...params, pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};
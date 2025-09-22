import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      vendor,
      price_min,
      price_max,
      product_type,
      body_html,
      handle,
      created_at,
      image,
      product_images (
        src,
        alt,
        position
      )
    `, { count: 'exact' })
    .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);

  // Apply filters
  if (searchQuery) {
    query = query.ilike('name', `%${searchQuery}%`);
  }

  if (vendor) {
    query = query.eq('vendor', vendor);
  }

  if (priceMin > 0) {
    query = query.gte('price_min', priceMin);
  }

  if (priceMax < 1000000) {
    query = query.lte('price_max', priceMax);
  }

  if (productType) {
    query = query.eq('product_type', productType);
  }

  // Apply sorting
  switch (sortBy) {
    case 'name':
      query = query.order('name', { ascending: true });
      break;
    case 'price':
      query = query.order('price_min', { ascending: true, nullsFirst: false });
      break;
    case 'vendor':
      query = query.order('vendor', { ascending: true });
      break;
    case 'created_at':
      query = query.order('created_at', { ascending: false });
      break;
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  // Transform the data - with the new query structure, each product already has its images array
  const products: Product[] = (data || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    vendor: item.vendor,
    price_min: item.price_min,
    price_max: item.price_max,
    product_type: item.product_type,
    body_html: item.body_html,
    handle: item.handle,
    created_at: item.created_at,
    image: item.image,
    product_images: item.product_images || []
  }));
  
  // Sort images by position for each product
  products.forEach(product => {
    if (product.product_images && product.product_images.length > 0) {
      product.product_images.sort((a, b) => a.position - b.position);
    }
  });

  const hasMore = (pageParam + 1) * pageSize < (count || 0);

  return {
    products,
    nextPage: hasMore ? pageParam + 1 : null,
    totalCount: count || 0
  };
};

export const useInfiniteProducts = (params: UseInfiniteProductsParams) => {
  return useInfiniteQuery({
    queryKey: ['products', 'infinite', params],
    queryFn: ({ pageParam }) => fetchProducts({ ...params, pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};
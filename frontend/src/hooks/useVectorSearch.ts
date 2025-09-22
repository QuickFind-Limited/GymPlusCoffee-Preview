import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/integrations/supabase/client';
import { Logger } from '@/services/Logger';
import type { VectorSearchQuery, VectorSearchResponse, VectorProduct, SearchStrategy } from '@/types/search.types';
import { useToast } from '@/hooks/use-toast';

interface UseVectorSearchOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  onSuccess?: (data: VectorSearchResponse) => void;
  onError?: (error: Error) => void;
  debounceMs?: number;
  defaultStrategy?: SearchStrategy;
}

export function useVectorSearch(options: UseVectorSearchOptions = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [searchStrategy, setSearchStrategy] = useState<SearchStrategy>(options.defaultStrategy || 'hybrid');
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    embeddingTime: number;
    searchTime: number;
    totalTime: number;
    cacheHit: boolean;
  } | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    onSuccess,
    onError,
    debounceMs = 300
  } = options;

  // Debounce search query
  const setSearchQuery = useCallback((query: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);
  }, [debounceMs]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Main vector search query
  const searchQuery = useQuery<VectorSearchResponse, Error>({
    queryKey: ['vector-search', debouncedQuery, searchStrategy],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.trim().length === 0) {
        return {
          query: '',
          strategy: searchStrategy,
          total_results: 0,
          page: 1,
          per_page: 20,
          total_pages: 0,
          products: [],
          suggestions: [],
          performance: {
            embedding_time_ms: 0,
            search_time_ms: 0,
            total_time_ms: 0,
            cache_hit: false
          },
          debug: {
            embedding_generated: false,
            fallback_used: false
          }
        };
      }

      const response = await performVectorSearch(debouncedQuery, {
        strategy: searchStrategy,
        max_results: 20,
        page: 1,
        similarity_threshold: 0
      });
      
      if (response.performance) {
        setPerformanceMetrics({
          embeddingTime: response.performance.embedding_time_ms,
          searchTime: response.performance.search_time_ms,
          totalTime: response.performance.total_time_ms,
          cacheHit: response.performance.cache_hit
        });
      }

      return response;
    },
    enabled: enabled && debouncedQuery.length > 0,
    staleTime,
    gcTime: cacheTime,
    retry: 1
  });

  // Handle onSuccess and onError with useEffect
  useEffect(() => {
    if (searchQuery.data && onSuccess) {
      onSuccess(searchQuery.data);
    }
  }, [searchQuery.data, onSuccess]);

  useEffect(() => {
    if (searchQuery.error) {
      Logger.error('Vector search error:', searchQuery.error);
      toast({
        title: 'Search Error',
        description: 'Failed to search products. Please try again.',
        variant: 'destructive'
      });
      if (onError) {
        onError(searchQuery.error);
      }
    }
  }, [searchQuery.error, onError]);

  // Advanced search mutation for complex queries with filters
  const advancedSearchMutation = useMutation<VectorSearchResponse, Error, VectorSearchQuery>({
    mutationFn: async (searchQuery: VectorSearchQuery) => {
      const response = await performVectorSearch(searchQuery.query, searchQuery);
      
      if (response.performance) {
        setPerformanceMetrics({
          embeddingTime: response.performance.embedding_time_ms,
          searchTime: response.performance.search_time_ms,
          totalTime: response.performance.total_time_ms,
          cacheHit: response.performance.cache_hit
        });
      }

      return response;
    },
    onSuccess: (data, variables) => {
      // Cache the result
      queryClient.setQueryData(['vector-search', variables.query, variables.strategy], data);
      
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error) => {
      Logger.error('Advanced vector search error:', error);
      toast({
        title: 'Search Error',
        description: error.message || 'Failed to perform advanced search',
        variant: 'destructive'
      });
      if (onError) {
        onError(error);
      }
    }
  });

  // Helper function to search by vendor
  const searchByVendor = useCallback(async (vendor: string) => {
    const query: VectorSearchQuery = {
      query: `products from ${vendor}`,
      strategy: 'combined',
      filters: { vendor },
      max_results: 50,
      page: 1
    };
    
    return advancedSearchMutation.mutateAsync(query);
  }, [advancedSearchMutation]);

  // Helper function to search by product type
  const searchByProductType = useCallback(async (productType: string) => {
    const query: VectorSearchQuery = {
      query: productType,
      strategy: 'combined',
      filters: { product_type: productType },
      max_results: 50,
      page: 1
    };
    
    return advancedSearchMutation.mutateAsync(query);
  }, [advancedSearchMutation]);

  // Helper function to get similar products using semantic search
  const getSimilarProducts = useCallback(async (productTitle: string, productDescription?: string) => {
    const searchText = productDescription ? `${productTitle} ${productDescription}` : productTitle;
    const query: VectorSearchQuery = {
      query: searchText,
      strategy: 'semantic',
      max_results: 10,
      page: 1,
      similarity_threshold: 0
    };
    
    return advancedSearchMutation.mutateAsync(query);
  }, [advancedSearchMutation]);

  // Helper function to search with price range
  const searchWithPriceRange = useCallback(async (query: string, minPrice?: number, maxPrice?: number) => {
    const searchQuery: VectorSearchQuery = {
      query,
      strategy: searchStrategy,
      filters: {
        price_min: minPrice,
        price_max: maxPrice
      },
      max_results: 30,
      page: 1
    };
    
    return advancedSearchMutation.mutateAsync(searchQuery);
  }, [advancedSearchMutation, searchStrategy]);

  // Helper function to search with tags
  const searchWithTags = useCallback(async (query: string, tags: string[]) => {
    const searchQuery: VectorSearchQuery = {
      query,
      strategy: 'combined',
      filters: { tags },
      max_results: 30,
      page: 1
    };
    
    return advancedSearchMutation.mutateAsync(searchQuery);
  }, [advancedSearchMutation]);

  // Clear search results
  const clearSearch = useCallback(() => {
    setDebouncedQuery('');
    setPerformanceMetrics(null);
    queryClient.removeQueries({ queryKey: ['vector-search'] });
  }, [queryClient]);

  // Prefetch search results
  const prefetchSearch = useCallback(async (query: string, strategy: SearchStrategy = 'hybrid') => {
    await queryClient.prefetchQuery({
      queryKey: ['vector-search', query, strategy],
      queryFn: async () => {
        const response = await performVectorSearch(query, {
          strategy,
          max_results: 20,
          page: 1
        });
        return response;
      },
      staleTime
    });
  }, [queryClient, staleTime]);

  // Track search analytics
  const trackSearchAnalytics = useCallback(async (query: string, resultsCount: number, clickedProductId?: string) => {
    try {
      // This could be enhanced to store in a local analytics table
      // Track analytics data
    } catch (error) {
      Logger.error('Failed to track search analytics:', error);
    }
  }, [searchStrategy, performanceMetrics]);

  return {
    // Query state
    data: searchQuery.data,
    isLoading: searchQuery.isLoading,
    isError: searchQuery.isError,
    error: searchQuery.error,
    
    // Search functions
    setSearchQuery,
    setSearchStrategy,
    searchByVendor,
    searchByProductType,
    getSimilarProducts,
    searchWithPriceRange,
    searchWithTags,
    clearSearch,
    prefetchSearch,
    trackSearchAnalytics,
    
    // Advanced search mutation
    advancedSearch: advancedSearchMutation.mutate,
    advancedSearchAsync: advancedSearchMutation.mutateAsync,
    isAdvancedSearching: advancedSearchMutation.isPending,
    
    // Current search state
    currentQuery: debouncedQuery,
    searchStrategy,
    products: searchQuery.data?.products || [],
    totalCount: searchQuery.data?.total_results || 0,
    suggestions: searchQuery.data?.suggestions || [],
    performanceMetrics,
    
    // Debug information
    debugInfo: searchQuery.data?.debug || null
  };
}

// Hook for instant search in dialogs/dropdowns
export function useInstantVectorSearch(initialQuery: string = '') {
  const [query, setQuery] = useState(initialQuery);
  const [strategy, setStrategy] = useState<SearchStrategy>('hybrid');
  
  const searchHook = useVectorSearch({
    debounceMs: 150, // Faster debounce for instant search
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: query.length > 0,
    defaultStrategy: strategy
  });

  useEffect(() => {
    searchHook.setSearchQuery(query);
  }, [query, searchHook.setSearchQuery]);

  useEffect(() => {
    searchHook.setSearchStrategy(strategy);
  }, [strategy, searchHook.setSearchStrategy]);

  return {
    ...searchHook,
    query,
    setQuery,
    strategy,
    setStrategy
  };
}

// Core vector search function
async function performVectorSearch(
  query: string, 
  options: Partial<VectorSearchQuery>
): Promise<VectorSearchResponse> {
  try {
    // Get the current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    // Use session token if available, otherwise use anon key from environment
    const authToken = session?.access_token || supabaseAnonKey;

    // Prepare the request body for Odoo search
    const requestBody = {
      query,
      search_type: 'single' // Default to single keyword search for vector search compatibility
    };

    // Make the API call to the enhanced product search edge function
    const response = await fetch(`${supabaseUrl}/functions/v1/product-search-enhanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Odoo product search failed: ${response.statusText}`);
    }

    const data = await response.json();
    // 'Odoo product search API response:', data);
    
    // If images are available separately, fetch them
    if (data.images_available && data.products?.length > 0) {
      const productIds = data.products.map((p: any) => p.id).filter(Boolean);
      
      if (productIds.length > 0) {
        try {
          const imageResponse = await fetch(`${supabaseUrl}/functions/v1/${data.image_endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              product_ids: productIds,
              image_size: 'image_256' // Use smaller images for search results
            })
          });
          
          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            // 'Fetched product images:', imageData);
            
            // Merge images into products
            if (imageData.images) {
              data.products = data.products.map((product: any) => ({
                ...product,
                image_256: imageData.images[product.id] || null
              }));
            }
          } else {
            Logger.warn('Failed to fetch product images:', { error: imageResponse.statusText });
          }
        } catch (imageError) {
          Logger.warn('Error fetching product images:', imageError);
          // Continue without images rather than failing the entire search
        }
      }
    }
    
    // Transform Odoo products to match expected format
    const transformedProducts: VectorProduct[] = data.products?.map((product: any) => ({
      id: String(product.id),
      shopify_id: null, // Odoo products don't have Shopify IDs
      title: product.display_name || product.name || 'Unknown Product',
      handle: product.default_code || product.barcode || '',
      description: product.description_sale || product.description || '',
      vendor: product.vendor || product.supplier_name || product.supplier || 'Unknown Supplier',
      product_type: Array.isArray(product.categ_id) ? product.categ_id[1] : 'General',
      tags: [], // Odoo doesn't expose tags in the same way
      price_min: product.list_price || 0,
      price_max: product.list_price || 0,
      url: '', // No direct URL from Odoo
      similarity_score: product.relevance_score || 0,
      text_rank: 0, // Not used in Odoo search
      combined_score: product.relevance_score || 0,
      images: product.image_256 ? [{src: product.image_256}] : [],
      variants: [], // Simplified for now
      // Transform for compatibility with existing components
      name: product.display_name || product.name || 'Unknown Product',
      image: product.image_256 || '/placeholder.svg',
      supplier: product.supplier || product.supplier_name || product.vendor || 'Unknown Supplier',
      unitPrice: product.list_price ? `$${product.list_price.toFixed(2)}` : '$0.00',
      minQuantity: 1,
      quantity: product.requested_quantity || 1
    })) || [];

    return {
      query: data.query || query,
      strategy: 'odoo', // Indicate this is Odoo-based search
      filters: {},
      total_results: data.totalResults || transformedProducts.length,
      page: 1,
      per_page: transformedProducts.length,
      total_pages: 1,
      products: transformedProducts,
      suggestions: data.suggestions || [],
      performance: {
        embedding_time_ms: 0, // Not applicable for Odoo search
        search_time_ms: data.processingTime || 0,
        total_time_ms: data.processingTime || 0,
        cache_hit: false
      },
      debug: {
        embedding_generated: false, // Not used in Odoo search
        fallback_used: data.fallback_used || false
      }
    };
  } catch (error) {
    Logger.error('Odoo product search error:', error);
    throw new Error(error instanceof Error ? error.message : 'Odoo product search failed');
  }
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useRef, useEffect } from 'react';
import { searchClient } from '@/utils/searchClient';
import type { SearchQuery, SearchResponse, Product } from '@/types/search.types';
import { useToast } from '@/hooks/use-toast';

interface UseOpenAISearchOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  onSuccess?: (data: SearchResponse) => void;
  onError?: (error: Error) => void;
  debounceMs?: number;
}

export function useOpenAISearch(options: UseOpenAISearchOptions = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
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

  // Main search query
  const searchQuery = useQuery<SearchResponse, Error>({
    queryKey: ['product-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.trim().length === 0) {
        return {
          success: true,
          data: {
            products: [],
            totalCount: 0,
            query: '',
            suggestions: []
          }
        };
      }

      const searchQuery = searchClient.buildSearchQuery(debouncedQuery);
      const response = await searchClient.searchWithRetry(searchQuery, 2);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Search failed');
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
      console.error('Search error:', searchQuery.error);
      toast({
        title: 'Search Error',
        description: searchQuery.error.message || 'Failed to search products',
        variant: 'destructive'
      });
      if (onError) {
        onError(searchQuery.error);
      }
    }
  }, [searchQuery.error, onError]);

  // Advanced search mutation for complex queries
  const advancedSearchMutation = useMutation<SearchResponse, Error, SearchQuery>({
    mutationFn: async (searchQuery: SearchQuery) => {
      const response = await searchClient.searchProducts(searchQuery);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Advanced search failed');
      }
      
      return response;
    },
    onSuccess: (data, variables) => {
      // Cache the result
      queryClient.setQueryData(['product-search', variables.query], data);
      
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error) => {
      console.error('Advanced search error:', error);
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

  // Helper function to get products from a specific supplier
  const searchBySupplier = useCallback(async (supplier: string) => {
    const query: SearchQuery = {
      query: '',
      filters: { supplier },
      limit: 50
    };
    
    return advancedSearchMutation.mutateAsync(query);
  }, [advancedSearchMutation]);

  // Helper function to search by category
  const searchByCategory = useCallback(async (category: string) => {
    const query: SearchQuery = {
      query: '',
      filters: { category },
      limit: 50
    };
    
    return advancedSearchMutation.mutateAsync(query);
  }, [advancedSearchMutation]);

  // Helper function to get suggested products based on user behavior
  const getSuggestedProducts = useCallback(async () => {
    // This could be enhanced with user behavior data
    const query: SearchQuery = {
      query: 'popular trending',
      limit: 10
    };
    
    return advancedSearchMutation.mutateAsync(query);
  }, [advancedSearchMutation]);

  // Clear search results
  const clearSearch = useCallback(() => {
    setDebouncedQuery('');
    queryClient.removeQueries({ queryKey: ['product-search'] });
  }, [queryClient]);

  // Prefetch search results
  const prefetchSearch = useCallback(async (query: string) => {
    const searchQuery = searchClient.buildSearchQuery(query);
    
    await queryClient.prefetchQuery({
      queryKey: ['product-search', query],
      queryFn: async () => {
        const response = await searchClient.searchProducts(searchQuery);
        if (!response.success) {
          throw new Error(response.error?.message || 'Prefetch failed');
        }
        return response;
      },
      staleTime
    });
  }, [queryClient, staleTime]);

  return {
    // Query state
    data: searchQuery.data,
    isLoading: searchQuery.isLoading,
    isError: searchQuery.isError,
    error: searchQuery.error,
    
    // Search functions
    setSearchQuery,
    searchBySupplier,
    searchByCategory,
    getSuggestedProducts,
    clearSearch,
    prefetchSearch,
    
    // Advanced search mutation
    advancedSearch: advancedSearchMutation.mutate,
    advancedSearchAsync: advancedSearchMutation.mutateAsync,
    isAdvancedSearching: advancedSearchMutation.isPending,
    
    // Current search state
    currentQuery: debouncedQuery,
    products: searchQuery.data?.data?.products || [],
    totalCount: searchQuery.data?.data?.totalCount || 0,
    suggestions: searchQuery.data?.data?.suggestions || []
  };
}

// Hook for instant search in dialogs/dropdowns
export function useInstantSearch(initialQuery: string = '') {
  const [query, setQuery] = useState(initialQuery);
  
  const searchHook = useOpenAISearch({
    debounceMs: 150, // Faster debounce for instant search
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: query.length > 0
  });

  useEffect(() => {
    searchHook.setSearchQuery(query);
  }, [query, searchHook.setSearchQuery]);

  return {
    ...searchHook,
    query,
    setQuery
  };
}
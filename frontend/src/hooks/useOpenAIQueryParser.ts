import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase, supabaseUrl } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  ParsedQuery,
  QueryParserResponse,
  QueryParserError,
  UseOpenAIQueryParserOptions,
  UseOpenAIQueryParserReturn
} from '@/types/queryParser.types';

/**
 * Custom hook for parsing natural language product queries using OpenAI
 * Integrates with the parse-query edge function and provides debouncing,
 * retry logic, and seamless integration with vector search
 * 
 * @param options - Configuration options for the parser
 * @returns Parser functions and state
 */
export function useOpenAIQueryParser(options: UseOpenAIQueryParserOptions = {}): UseOpenAIQueryParserReturn {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [parsedData, setParsedData] = useState<ParsedQuery | null>(null);
  const [error, setError] = useState<QueryParserError | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [lastQuery, setLastQuery] = useState<string>('');
  
  // Refs for debouncing
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Extract options with defaults
  const {
    enabled = true,
    debounceMs = 300,
    retryCount = 2,
    retryDelay = 1000,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    onSuccess,
    onError,
    useFallback = true
  } = options;
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  // Parse query mutation with React Query v5
  const parseQueryMutation = useMutation<QueryParserResponse, QueryParserError, string>({
    mutationFn: async (query: string) => {
      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        const error = new Error('No authentication session found') as QueryParserError;
        error.code = 'INTERNAL_ERROR';
        error.status = 401;
        throw error;
      }
      
      // Call the parse-query edge function
      const response = await fetch(`${supabaseUrl}/functions/v1/search-query-parser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ query })
      });
      
      const data = await response.json();
      
      // Handle various error scenarios
      if (!response.ok) {
        const error = new Error(data.error || `Query parsing failed: ${response.statusText}`) as QueryParserError;
        error.status = response.status;
        
        // Map status codes to error codes
        switch (response.status) {
          case 429:
            error.code = 'RATE_LIMIT';
            error.details = { retry_after: data.retry_after };
            break;
          case 422:
            error.code = 'VALIDATION_ERROR';
            error.details = { validation_errors: data.validation_errors };
            break;
          case 408:
            error.code = 'TIMEOUT';
            break;
          case 503:
            error.code = 'SERVICE_UNAVAILABLE';
            break;
          default:
            error.code = 'INTERNAL_ERROR';
        }
        
        // Include fallback data if available
        if (data.fallback) {
          error.fallback = data.fallback;
        }
        
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      // Extract parsed data
      const parsed = data.data;
      
      if (parsed) {
        setParsedData(parsed);
        setError(null);
        setUsedFallback(!!data.fallback);
        
        // Cache the result
        queryClient.setQueryData(
          ['query-parser', lastQuery],
          { parsed, usedFallback: !!data.fallback }
        );
        
        // Call success callback
        if (onSuccess) {
          onSuccess(parsed);
        }
      } else {
        const error = new Error('No parsed data available') as QueryParserError;
        error.code = 'INTERNAL_ERROR';
        setError(error);
        setParsedData(null);
      }
    },
    onError: (error: QueryParserError) => {
      console.error('Query parsing error:', error);
      
      // Try to use fallback if available
      if (error.fallback && useFallback) {
        setParsedData(error.fallback);
        setUsedFallback(true);
        setError(null);
        
        toast({
          title: 'Using fallback parser',
          description: 'OpenAI is unavailable, using basic parsing',
          variant: 'default'
        });
        
        if (onSuccess) {
          onSuccess(error.fallback);
        }
      } else {
        setError(error);
        setParsedData(null);
        setUsedFallback(false);
        
        // Show appropriate error message
        let errorMessage = error.message;
        if (error.code === 'RATE_LIMIT') {
          errorMessage = 'Too many requests. Please try again later.';
        } else if (error.code === 'SERVICE_UNAVAILABLE') {
          errorMessage = 'Query parser service is temporarily unavailable.';
        }
        
        toast({
          title: 'Parsing Error',
          description: errorMessage,
          variant: 'destructive'
        });
        
        if (onError) {
          onError(error);
        }
      }
    },
    // React Query v5 retry configuration with exponential backoff
    retry: (failureCount, error) => {
      // Don't retry on validation errors or auth errors
      if (error.code === 'VALIDATION_ERROR' || error.status === 401) {
        return false;
      }
      
      // Retry up to retryCount times
      return failureCount < retryCount;
    },
    retryDelay: (failureCount) => {
      // Exponential backoff: 1s, 2s, 4s, etc.
      return Math.min(retryDelay * Math.pow(2, failureCount - 1), 30000);
    },
    gcTime: cacheTime
  });
  
  // Debounced parse function
  const parseQuery = useCallback((query: string) => {
    if (!enabled || !query || query.trim().length === 0) {
      return;
    }
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Store the query for later use
    setLastQuery(query);
    
    // Set up new debounced call
    debounceTimerRef.current = setTimeout(() => {
      // Check cache first
      const cachedData = queryClient.getQueryData<{ parsed: ParsedQuery; usedFallback: boolean }>(
        ['query-parser', query]
      );
      
      if (cachedData && cachedData.parsed) {
        setParsedData(cachedData.parsed);
        setUsedFallback(cachedData.usedFallback);
        setError(null);
        
        if (onSuccess) {
          onSuccess(cachedData.parsed);
        }
      } else {
        // Perform the mutation
        parseQueryMutation.mutate(query);
      }
    }, debounceMs);
  }, [enabled, debounceMs, parseQueryMutation, queryClient, onSuccess]);
  
  // Clear function
  const clearParsedData = useCallback(() => {
    setParsedData(null);
    setError(null);
    setUsedFallback(false);
    setLastQuery('');
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);
  
  // Retry function
  const retry = useCallback(() => {
    if (lastQuery) {
      parseQueryMutation.mutate(lastQuery);
    }
  }, [lastQuery, parseQueryMutation]);
  
  // Direct async parse function (no debouncing)
  const parseQueryAsync = useCallback(async (query: string): Promise<ParsedQuery> => {
    if (!enabled || !query || query.trim().length === 0) {
      throw new Error('Query is empty or parsing is disabled');
    }
    
    // Check cache first
    const cachedData = queryClient.getQueryData<{ parsed: ParsedQuery; usedFallback: boolean }>(
      ['query-parser', query]
    );
    
    if (cachedData && cachedData.parsed) {
      return cachedData.parsed;
    }
    
    // Use mutateAsync to get a promise
    const result = await parseQueryMutation.mutateAsync(query);
    
    // Extract the parsed data from the response
    const parsed = result.data || result.fallback;
    if (!parsed || typeof parsed === 'boolean') {
      throw new Error('Failed to parse query');
    }
    
    return parsed;
  }, [enabled, parseQueryMutation, queryClient]);

  return {
    parseQuery,
    parseQueryAsync,
    isParsing: parseQueryMutation.isPending,
    parsedData,
    error,
    clearParsedData,
    usedFallback,
    retry
  };
}

/**
 * Helper function to convert parsed query to vector search parameters
 * Now handles multiple products and returns an array of search params
 */
export function parsedQueryToVectorSearchParams(parsedQuery: ParsedQuery) {
  return parsedQuery.products.map(product => ({
    query: product.product_description,
    quantity: product.quantity, // Include quantity for later use
    filters: {},
    strategy: 'combined' as const, // Use combined strategy by default
    max_results: 1 // Get top 1 matches for better selection
  }));
}
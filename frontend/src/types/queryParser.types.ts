/**
 * Query Parser Types - Interfaces for OpenAI-powered query parsing
 * These types define the structure of parsed product search queries
 */

/**
 * Single product structure extracted from a query
 */
export interface ParsedProduct {
  /** Natural language description of the product for semantic search */
  product_description: string;
  
  /** Number of units needed (minimum 1) */
  quantity: number;
}

/**
 * Parsed query structure matching the edge function output
 * Now supports multiple products from a single query
 */
export interface ParsedQuery {
  /** Array of products extracted from the query (1-10 products) */
  products: ParsedProduct[];
}

/**
 * Response structure from the parse-query edge function
 */
export interface QueryParserResponse {
  /** Indicates if parsing was successful */
  success: boolean;
  
  /** Parsed query data when successful */
  data?: ParsedQuery;
  
  /** Whether fallback parser was used */
  fallback?: boolean;
  
  /** Error message if parsing failed */
  error?: string;
  
  /** OpenAI usage statistics */
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  
  /** Validation errors from Zod if applicable */
  details?: Array<{
    code: string;
    expected: string;
    received: string;
    path: string[];
    message: string;
  }>;
  
  /** Error code for specific error types */
  code?: string;
}

/**
 * Error structure for query parser failures
 */
export interface QueryParserError extends Error {
  /** HTTP status code from the edge function */
  status?: number;
  
  /** Error code for specific error types */
  code?: 'RATE_LIMIT' | 'VALIDATION_ERROR' | 'TIMEOUT' | 'SERVICE_UNAVAILABLE' | 'INTERNAL_ERROR';
  
  /** Fallback parsing result if available */
  fallback?: ParsedQuery;
  
  /** Additional error details */
  details?: Record<string, any>;
}

/**
 * Hook configuration options for useOpenAIQueryParser
 */
export interface UseOpenAIQueryParserOptions {
  /** Whether the parser should be enabled */
  enabled?: boolean;
  
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  
  /** Number of retry attempts for failed requests (default: 2) */
  retryCount?: number;
  
  /** Base delay for exponential backoff in ms (default: 1000) */
  retryDelay?: number;
  
  /** Stale time for React Query cache in ms (default: 5 minutes) */
  staleTime?: number;
  
  /** Cache time for React Query in ms (default: 10 minutes) */
  cacheTime?: number;
  
  /** Callback when parsing succeeds */
  onSuccess?: (data: ParsedQuery) => void;
  
  /** Callback when parsing fails */
  onError?: (error: QueryParserError) => void;
  
  /** Whether to use fallback parsing when OpenAI fails */
  useFallback?: boolean;
}

/**
 * Return type for the useOpenAIQueryParser hook
 */
export interface UseOpenAIQueryParserReturn {
  /** Function to parse a query string */
  parseQuery: (query: string) => void;
  
  /** Async function to parse a query string and return a promise */
  parseQueryAsync: (query: string) => Promise<ParsedQuery>;
  
  /** Loading state indicator */
  isParsing: boolean;
  
  /** Parsed query data */
  parsedData: ParsedQuery | null;
  
  /** Error state */
  error: QueryParserError | null;
  
  /** Function to clear parsed data and error state */
  clearParsedData: () => void;
  
  /** Whether the last result used fallback parsing */
  usedFallback: boolean;
  
  /** Function to manually retry the last failed query */
  retry: () => void;
}

/**
 * Integration data flow from parser to vector search
 */
export interface QueryParserToVectorSearchFlow {
  /** Original user query */
  originalQuery: string;
  
  /** Parsed query data */
  parsedQuery: ParsedQuery;
  
  /** Vector search parameters derived from parsed query */
  vectorSearchParams: {
    query: string;
    filters: {};
    strategy: 'semantic' | 'combined' | 'hybrid';
    max_results: number;
  };
}
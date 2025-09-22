export interface SearchQuery {
  query: string;
  filters?: {
    category?: string;
    supplier?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  };
  limit?: number;
  offset?: number;
}

export interface Product {
  id: string | number;
  name: string;
  description?: string;
  image: string;
  supplier: string;
  category?: string;
  unitPrice: string | number;
  minQuantity: number;
  quantity?: number;
  moq?: number; // Minimum Order Quantity from MOQ service
  moqApplied?: boolean; // Whether MOQ was applied to adjust quantity
  originalQuantity?: number; // Original requested quantity before MOQ adjustment
  inStock?: boolean;
  stockLevel?: number;
  tags?: string[];
  sku?: string;
  cartonSize?: number;
}

export interface SearchResult {
  products: Product[];
  totalCount: number;
  query: string;
  processingTime?: number;
  suggestions?: string[];
  filters?: {
    categories: string[];
    suppliers: string[];
    priceRange: {
      min: number;
      max: number;
    };
  };
}

export interface SearchError {
  code: string;
  message: string;
  details?: any;
}

export interface SearchResponse {
  success: boolean;
  data?: SearchResult;
  error?: SearchError;
}

// Supplier-specific product types for better type safety
export interface SupplierProduct extends Product {
  supplierCode: string;
  leadTime?: number;
  moq?: number; // Minimum Order Quantity
  availability?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'on_order';
  lastUpdated?: string;
}

// Order-related types
export interface OrderItem extends Product {
  orderedQuantity: number;
  totalPrice: number;
  notes?: string;
}

export interface OrderSummaryData {
  isSpecificOrder?: boolean;
  supplier?: string;
  products?: Product[];
  totalAmount?: number;
  estimatedDelivery?: string;
  // New intelligent search fields
  originalQuery?: string;
  parsedData?: any; // ParsedQuery type from queryParser.types.ts
  searchResults?: VectorProduct[];
  timestamp?: string;
  // MOQ processing information
  moqProcessingInfo?: {
    moqDataFetched: boolean;
    moqAdjustmentsMade: number;
    fallbackUsed: boolean;
    processingTime: number;
  };
}

// Vector Search Types
export type SearchStrategy = 'semantic' | 'combined' | 'hybrid';

export interface VectorSearchQuery {
  query: string;
  strategy?: SearchStrategy;
  filters?: {
    vendor?: string;
    product_type?: string;
    price_min?: number;
    price_max?: number;
    tags?: string[];
    availability?: boolean;
  };
  similarity_threshold?: number;
  max_results?: number;
  page?: number;
}

export interface VectorProduct {
  id: number;
  shopify_id?: number;
  title: string;
  handle: string;
  description?: string;
  vendor: string;
  product_type?: string;
  tags: string[];
  price_min?: number;
  price_max?: number;
  url?: string;
  similarity_score: number;
  text_rank?: number;
  combined_score?: number;
  images?: {
    src: string;
    alt?: string;
    position: number;
  }[];
  variants?: {
    id: number;
    title: string;
    price: number;
    available: boolean;
    sku?: string;
  }[];
  // Compatibility fields for existing components
  name: string;
  image: string;
  supplier: string;
  unitPrice: string;
  minQuantity: number;
  quantity: number;
  // MOQ-related fields
  moq?: number; // Minimum Order Quantity from Odoo
  moqApplied?: boolean; // Whether MOQ logic was applied
  originalQuantity?: number; // Original requested quantity
  moqSource?: 'odoo' | 'default' | 'fallback'; // Source of MOQ data
}

export interface VectorSearchResponse {
  query: string;
  strategy: string;
  filters?: any;
  total_results: number;
  page: number;
  per_page: number;
  total_pages: number;
  products: VectorProduct[];
  suggestions: string[];
  performance: {
    embedding_time_ms: number;
    search_time_ms: number;
    total_time_ms: number;
    cache_hit: boolean;
  };
  debug?: {
    embedding_generated: boolean;
    fallback_used: boolean;
    error?: string;
  };
}

// Search Analytics Types
export interface SearchAnalytics {
  query: string;
  strategy: SearchStrategy;
  resultsCount: number;
  clickedProductId?: string;
  performanceMetrics?: {
    embeddingTime: number;
    searchTime: number;
    totalTime: number;
    cacheHit: boolean;
  };
  timestamp: Date;
  sessionId?: string;
}

// Similar Products Types
export interface SimilarProductsRequest {
  productId: string | number;
  productTitle: string;
  productDescription?: string;
  maxResults?: number;
  similarityThreshold?: number;
}

export interface SimilarProductsResponse extends VectorSearchResponse {
  sourceProduct: {
    id: string | number;
    title: string;
  };
}
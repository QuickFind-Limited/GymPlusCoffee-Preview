import { supabase, supabaseUrl } from '@/integrations/supabase/client';
import type { SearchQuery, SearchResponse, Product } from '@/types/search.types';

const SEARCH_API_URL = '/api/openai-search';

export class SearchClient {
  private static instance: SearchClient;
  
  private constructor() {}
  
  static getInstance(): SearchClient {
    if (!SearchClient.instance) {
      SearchClient.instance = new SearchClient();
    }
    return SearchClient.instance;
  }

  async searchProducts(searchQuery: SearchQuery): Promise<SearchResponse> {
    try {
      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No authentication session found');
      }

      // Prepare the request body
      const requestBody = {
        query: searchQuery.query,
        filters: searchQuery.filters || {},
        limit: searchQuery.limit || 20,
        offset: searchQuery.offset || 0
      };

      // Make the API call to the edge function
      const response = await fetch(`${supabaseUrl}/functions/v1/ai-product-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform the response to match our expected format
      return {
        success: true,
        data: {
          products: this.transformProducts(data.products || []),
          totalCount: data.totalResults || 0,
          query: searchQuery.query,
          processingTime: data.processingTime,
          suggestions: data.suggestions || [],
          filters: data.filters
        }
      };
    } catch (error) {
      console.error('Search error:', error);
      return {
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: error instanceof Error ? error.message : 'An error occurred during search',
          details: error
        }
      };
    }
  }

  private transformProducts(rawProducts: any[]): Product[] {
    return rawProducts.map(product => ({
      id: String(product.id || Math.random().toString(36).substr(2, 9)),
      name: product.display_name || product.name || 'Unknown Product',
      description: product.description_sale || product.description || '',
      image: product.image_1920 ? `data:image/png;base64,${product.image_1920}` : '/placeholder.svg',
      supplier: product.supplier || product.supplier_name || product.vendor || 'Unknown Supplier',
      category: Array.isArray(product.categ_id) ? product.categ_id[1] : 'General',
      unitPrice: this.parsePrice(product.list_price),
      minQuantity: 1,
      quantity: product.requested_quantity || 1,
      inStock: (product.qty_available || 0) > 0,
      stockLevel: product.qty_available || 0,
      tags: [],
      sku: product.default_code || product.barcode || '',
      cartonSize: 1
    }));
  }

  private parsePrice(price: any): string {
    if (typeof price === 'string') {
      return price;
    }
    if (typeof price === 'number') {
      return `$${price.toFixed(2)}`;
    }
    return '$0.00';
  }

  // Method to search with automatic retries
  async searchWithRetry(
    searchQuery: SearchQuery, 
    maxRetries: number = 3
  ): Promise<SearchResponse> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await this.searchProducts(searchQuery);
        if (response.success) {
          return response;
        }
        lastError = new Error(response.error?.message || 'Search failed');
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
      }
      
      // Wait before retry with exponential backoff
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
    
    return {
      success: false,
      error: {
        code: 'MAX_RETRIES_EXCEEDED',
        message: lastError?.message || 'Search failed after multiple attempts',
        details: lastError
      }
    };
  }

  // Helper method to build search query from natural language
  buildSearchQuery(naturalLanguageQuery: string): SearchQuery {
    const query: SearchQuery = {
      query: naturalLanguageQuery
    };

    // Extract potential filters from the query
    const lowerQuery = naturalLanguageQuery.toLowerCase();
    
    // Check for supplier mentions
    const suppliers = ['impala', 'fashion forward', 'comme avant', 'nova brands', 'echo supply'];
    const mentionedSupplier = suppliers.find(s => lowerQuery.includes(s.toLowerCase()));
    if (mentionedSupplier) {
      query.filters = { ...query.filters, supplier: mentionedSupplier };
    }

    // Check for category mentions
    const categories = ['clothing', 'furniture', 'wine', 'electronics', 'home decor', 'fashion'];
    const mentionedCategory = categories.find(c => lowerQuery.includes(c.toLowerCase()));
    if (mentionedCategory) {
      query.filters = { ...query.filters, category: mentionedCategory };
    }

    // Check for stock requirements
    if (lowerQuery.includes('in stock') || lowerQuery.includes('available')) {
      query.filters = { ...query.filters, inStock: true };
    }

    return query;
  }
}

// Export a singleton instance
export const searchClient = SearchClient.getInstance();
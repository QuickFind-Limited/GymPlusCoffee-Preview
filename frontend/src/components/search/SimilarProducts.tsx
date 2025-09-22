import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useVectorSearch } from '@/hooks/useVectorSearch';
import type { VectorProduct } from '@/types/search.types';

interface SimilarProductsProps {
  productId: string | number;
  productTitle: string;
  productDescription?: string;
  maxResults?: number;
  onProductClick?: (product: VectorProduct) => void;
  className?: string;
}

export default function SimilarProducts({
  productId,
  productTitle,
  productDescription,
  maxResults = 6,
  onProductClick,
  className = ''
}: SimilarProductsProps) {
  const [similarProducts, setSimilarProducts] = useState<VectorProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getSimilarProducts } = useVectorSearch();

  useEffect(() => {
    if (productTitle) {
      loadSimilarProducts();
    }
  }, [productId, productTitle, productDescription]);

  const loadSimilarProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getSimilarProducts(productTitle, productDescription);
      
      if (response.products) {
        // Filter out the current product and limit results
        const filtered = response.products
          .filter(p => p.id !== productId)
          .slice(0, maxResults);
        setSimilarProducts(filtered);
      }
    } catch (err) {
      console.error('Failed to load similar products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load similar products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductClick = (product: VectorProduct) => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  const formatPrice = (price?: number): string => {
    if (!price) return 'Price unavailable';
    return `$${price.toFixed(2)}`;
  };

  const getSimilarityLabel = (score: number): { label: string; color: string } => {
    if (score >= 0.9) return { label: 'Very Similar', color: 'text-green-600' };
    if (score >= 0.8) return { label: 'Similar', color: 'text-blue-600' };
    if (score >= 0.7) return { label: 'Somewhat Similar', color: 'text-yellow-600' };
    return { label: 'Related', color: 'text-gray-600' };
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Sparkles className="mr-2 h-5 w-5" />
            Similar Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-gray-600">Finding similar products...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Sparkles className="mr-2 h-5 w-5" />
            Similar Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={loadSimilarProducts}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (similarProducts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Sparkles className="mr-2 h-5 w-5" />
            Similar Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600">No similar products found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Sparkles className="mr-2 h-5 w-5" />
          Similar Products
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({similarProducts.length} found)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {similarProducts.map((product) => {
            const similarity = getSimilarityLabel(product.similarity_score);
            return (
              <div
                key={product.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleProductClick(product)}
              >
                <div className="aspect-square bg-gray-100 rounded-md overflow-hidden mb-3">
                  <img
                    src={product.image || product.images?.[0]?.src || '/placeholder.svg'}
                    alt={product.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm line-clamp-2 text-gray-900">
                    {product.title}
                  </h4>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{product.vendor}</span>
                    <span className={`text-xs font-medium ${similarity.color}`}>
                      {similarity.label}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-gray-900">
                      {formatPrice(product.price_min)}
                    </span>
                    {product.url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(product.url, '_blank');
                        }}
                        className="p-1 h-auto"
                      >
                        <ExternalLink size={14} />
                      </Button>
                    )}
                  </div>
                  
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {product.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {product.tags.length > 2 && (
                        <span className="text-xs text-gray-400">
                          +{product.tags.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {similarProducts.length >= maxResults && (
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={loadSimilarProducts}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Load More Similar Products
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { getProductImage } from '@/services/productImageMapper';

interface Product {
  id: string;
  name: string;
  vendor: string;
  price_min: number | null;
  price_max: number | null;
  product_type: string | null;
  image: string | null;
  product_images?: {
    src: string;
    alt: string | null;
  }[];
}

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onClick }) => {
  const primaryImage = product.product_images?.[0];
  // Use existing image if available, otherwise use mapped image
  const imageUrl = primaryImage?.src || product.image || getProductImage(product.name, product.product_type);
  
  const formatPrice = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Price on request';
    if (min === max) return `$${min?.toFixed(2)}`;
    if (!max) return `From $${min?.toFixed(2)}`;
    return `$${min?.toFixed(2)} - $${max?.toFixed(2)}`;
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group relative"
      onClick={onClick}
    >
      <div className="aspect-square relative overflow-hidden bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={primaryImage?.alt || product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        <p className="text-xs text-muted-foreground mb-2">
          {product.vendor}
        </p>
        
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">
            {formatPrice(product.price_min, product.price_max)}
          </p>
          
          {product.product_type && (
            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {product.product_type}
            </span>
          )}
        </div>
      </CardContent>
      
      {/* Visual indicator for external link */}
      <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 text-gray-600 dark:text-gray-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
          />
        </svg>
      </div>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';

interface Product {
  id: number;
  title: string;
  vendor: string;
  price_min: number | null;
  price_max: number | null;
  images?: Array<{
    src: string;
    alt: string | null;
    position: number;
  }>;
}

interface ProductSearchCardProps {
  product: Product;
  onAddToOrder: (product: Product, quantity: number) => void;
}

export function ProductSearchCard({ product, onAddToOrder }: ProductSearchCardProps) {
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (value: number) => {
    if (value >= 1) {
      setQuantity(value);
    }
  };

  const handleAddToOrder = () => {
    onAddToOrder(product, quantity);
    setQuantity(1); // Reset quantity after adding
  };

  const primaryImage = product.images?.[0];
  const displayPrice = product.price_min ? `$${product.price_min.toFixed(2)}` : 'Price on request';

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="w-24 h-24 flex-shrink-0">
            {primaryImage ? (
              <img
                src={primaryImage.src}
                alt={primaryImage.alt || product.title}
                className="w-full h-full object-cover rounded-md"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                <span className="text-gray-400 text-xs">No image</span>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.title}</h3>
            <p className="text-xs text-muted-foreground mb-2">{product.vendor}</p>
            <p className="text-sm font-semibold">{displayPrice}</p>
          </div>

          {/* Quantity and Add Button */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => handleQuantityChange(quantity - 1)}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                className="w-16 h-8 text-center"
                min="1"
              />
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => handleQuantityChange(quantity + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <Button
              size="sm"
              onClick={handleAddToOrder}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              Add to Order
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
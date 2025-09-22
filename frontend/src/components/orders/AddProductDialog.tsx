import { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search } from 'lucide-react';
import { useProductSearch } from '@/hooks/useProductSearch';
import { ProductSearchCard } from './ProductSearchCard';
import { useToast } from '@/hooks/use-toast';

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

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProduct: (product: Product, quantity: number) => void;
}

export function AddProductDialog({ open, onOpenChange, onAddProduct }: AddProductDialogProps) {
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { products, isLoading, error, searchQuery, setSearchQuery } = useProductSearch();

  // Focus search input when dialog opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Clear search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open, setSearchQuery]);

  const handleAddProduct = (product: Product, quantity: number) => {
    onAddProduct(product, quantity);
    // Toast notification is now handled by parent component to include MOQ info
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Product to Order</DialogTitle>
          <DialogDescription>
            Search for products by name to add them to your order.
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Search Results */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-sm text-destructive">
              An error occurred while searching. Please try again.
            </div>
          )}

          {!isLoading && !error && searchQuery && products.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No products found matching "{searchQuery}"
            </div>
          )}

          {!isLoading && !error && searchQuery === '' && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Start typing to search for products
            </div>
          )}

          {!isLoading && !error && products.length > 0 && (
            <div className="space-y-3 py-4">
              {products.map((product) => (
                <ProductSearchCard
                  key={product.id}
                  product={product}
                  onAddToOrder={handleAddProduct}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
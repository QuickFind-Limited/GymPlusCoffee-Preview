
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ClipboardList, FileText, Truck, TrendingUp, Package, Loader2 } from 'lucide-react';
import { useInstantSearch } from '@/hooks/useOpenAISearch';
import { useNavigate } from 'react-router-dom';

interface SearchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const SearchDialog = ({ isOpen, onOpenChange }: SearchDialogProps) => {
  const navigate = useNavigate();
  const {
    query,
    setQuery,
    products,
    isLoading,
    suggestions
  } = useInstantSearch();

  // Static data for non-product searches
  const searchData = {
    orders: [
      "Bulk Pinot Noir Reserve Order",
      "Modern Interior Furniture from Impala", 
      "Sustainable Textile Collection",
      "Premium Footwear Stock Replenishment"
    ],
    invoices: [
      "INV-2024-001 - Pinot Noir Reserve Cases",
      "INV-2024-002 - Impala Furniture Collection",
      "INV-2024-003 - StyleFabrics Textile Order",
      "INV-2024-004 - Premium Footwear Stock"
    ],
    suppliers: [
      "Impala - Footwear & Furniture",
      "Comme Avant - Sustainable Materials", 
      "Fashion Forward - Apparel",
      "Nova Brands - Electronics",
      "Echo Supply - Office Equipment"
    ],
    analytics: [
      "Monthly Supplier Spend Analysis",
      "Inventory Turnover Report",
      "Seasonal Purchasing Trends",
      "Supplier Performance Metrics"
    ]
  };

  const handleSelect = (value: string, type: 'product' | 'order' | 'supplier' | 'other') => {
    // Handle selection
    
    if (type === 'product') {
      // Navigate to order summary with the search query
      navigate(`/order-summary?query=${encodeURIComponent(value)}`);
    } else if (type === 'supplier') {
      // Navigate to suppliers page
      navigate('/suppliers');
    } else if (type === 'order') {
      // Navigate to orders page
      navigate('/orders');
    }
    
    onOpenChange(false);
    setQuery('');
  };

  // Reset query when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen, setQuery]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden shadow-xl border border-gray-100/50 backdrop-blur-sm">
        <Command className="rounded-lg border-0 shadow-none">
          <div className="flex items-center border-b px-3">
            <CommandInput 
              placeholder="Search products, orders, suppliers..." 
              value={query}
              onValueChange={setQuery}
              className="border-0 focus:ring-0 text-sm pl-3"
            />
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
            )}
          </div>
          <CommandList className="max-h-[400px] overflow-y-auto">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              {query ? 'No results found. Try a different search term.' : 'Start typing to search...'}
            </CommandEmpty>
            
            {/* Product Search Results */}
            {products.length > 0 && (
              <CommandGroup heading="Products">
                {products.slice(0, 5).map((product) => (
                  <CommandItem
                    key={`product-${product.id}`}
                    onSelect={() => handleSelect(product.name, 'product')}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0">
                      {product.image && (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover rounded"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.supplier} • {product.unitPrice}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <CommandGroup heading="Suggestions">
                {suggestions.map((suggestion, index) => (
                  <CommandItem
                    key={`suggestion-${index}`}
                    onSelect={() => setQuery(suggestion)}
                    className="flex items-center gap-2 px-4 py-2 cursor-pointer"
                  >
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm italic">{suggestion}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {/* Static search results for other types */}
            {!query && (
              <>
                <CommandGroup heading="Recent Orders">
                  {searchData.orders.slice(0, 2).map((order, index) => (
                    <CommandItem
                      key={`order-${index}`}
                      onSelect={() => handleSelect(order, 'order')}
                      className="flex items-center gap-2 px-4 py-2 cursor-pointer"
                    >
                      <ClipboardList className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{order}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>

                <CommandGroup heading="Suppliers">
                  {searchData.suppliers.slice(0, 3).map((supplier, index) => (
                    <CommandItem
                      key={`supplier-${index}`}
                      onSelect={() => handleSelect(supplier, 'supplier')}
                      className="flex items-center gap-2 px-4 py-2 cursor-pointer"
                    >
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{supplier}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog;

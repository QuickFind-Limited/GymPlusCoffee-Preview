import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Header from '@/components/dashboard/Header';
import AppSidebar from '@/components/dashboard/AppSidebar';
import { Input } from '@/components/ui/input';
import { Search, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useInfiniteOdooProducts } from '@/hooks/useInfiniteOdooProducts';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductFilters } from '@/components/products/ProductFilters';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const ProductsCatalog = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedProductType, setSelectedProductType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'vendor' | 'created_at'>('name');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useInfiniteOdooProducts({
    searchQuery: debouncedSearchQuery,
    vendor: selectedVendor,
    priceMin: priceRange[0],
    priceMax: priceRange[1],
    productType: selectedProductType,
    sortBy
  });

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out",
          variant: "destructive",
        });
        return;
      }
      navigate('/auth');
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const allProducts = data?.pages.flatMap(page => page.products) || [];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-100 dark:bg-black">
        <AppSidebar onLogout={handleLogout} />
        <SidebarInset>
          <Header />
          
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              {/* Page Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Products Catalog
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Browse and manage your complete product inventory
                </p>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full"
                  />
                </div>
              </div>

              {/* Products Grid */}
              <div className="w-full">
                  {isLoading && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  )}

                  {isError && (
                    <div className="text-center py-12">
                      <p className="text-red-500">Error loading products. Please try again.</p>
                    </div>
                  )}

                  {!isLoading && !isError && allProducts.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No products found matching your criteria.</p>
                    </div>
                  )}

                  {!isLoading && !isError && allProducts.length > 0 && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {allProducts.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onClick={() => {
                              // Redirect to Odoo product page instead of internal route
                              if (!product.id) {
                                toast({
                                  title: "Error",
                                  description: "Product ID not found. Cannot open in Odoo.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              const odooUrl = `https://source-gym-plus-coffee.odoo.com/web#id=${product.id}&model=product.product&view_type=form`;
                              
                              try {
                                window.open(odooUrl, '_blank');
                                toast({
                                  title: "Opening in Odoo",
                                  description: "Product page is opening in a new tab",
                                });
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to open Odoo product page",
                                  variant: "destructive",
                                });
                              }
                            }}
                          />
                        ))}
                      </div>

                      {/* Load More Trigger */}
                      {hasNextPage && (
                        <div className="mt-8 text-center">
                          <Button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            variant="outline"
                            className="w-full max-w-xs"
                          >
                            {isFetchingNextPage ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Loading more...
                              </>
                            ) : (
                              'Load More Products'
                            )}
                          </Button>
                        </div>
                      )}

                      {!hasNextPage && allProducts.length > 0 && (
                        <div className="mt-8 text-center text-gray-500">
                          <p>You've reached the end of the catalog</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ProductsCatalog;
import React, { useState, useMemo } from 'react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/dashboard/AppSidebar";
import Header from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Package, Database, Edit, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useOdooSuppliers } from '@/hooks/useOdooSuppliers';
import { useOdooSupplierProducts, type OdooSupplierProduct } from '@/hooks/useOdooSupplierProducts';
import { useDebounce } from '@/hooks/use-debounce';
import { EditableMinLevel } from "@/components/suppliers/EditableMinLevel";


const Suppliers = () => {
  const [openSuppliers, setOpenSuppliers] = useState<Record<number, boolean>>({});
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 500);
  
  // Fetch suppliers from Odoo
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useOdooSuppliers({
    search: debouncedSearch,
    withProducts: true // Load with products for complete view
  });
  
  // Flatten suppliers from all pages
  const suppliers = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.suppliers);
  }, [data]);

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
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account."
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const toggleSupplier = (supplierId: number) => {
    setOpenSuppliers(prev => {
      // If the supplier is currently open, just close it
      if (prev[supplierId]) {
        // Clear selected supplier when closing
        setSelectedSupplierId(null);
        return {
          ...prev,
          [supplierId]: false
        };
      }
      
      // Otherwise, close all others and open this one
      const newState: Record<number, boolean> = {};
      suppliers.forEach(supplier => {
        newState[supplier.id] = supplier.id === supplierId;
      });
      
      // Set selected supplier for product fetching when opening
      setSelectedSupplierId(supplierId);
      
      return newState;
    });
  };
  
  // Fetch products for selected supplier
  const { 
    data: supplierProductsData, 
    isLoading: isLoadingProducts,
    fetchNextPage: fetchNextProductPage,
    hasNextPage: hasNextProductPage,
    isFetchingNextPage: isFetchingNextProductPage
  } = useOdooSupplierProducts(
    selectedSupplierId,
    !!selectedSupplierId && openSuppliers[selectedSupplierId]
  );

  // Flatten products from all pages
  const supplierProducts = useMemo(() => {
    if (!supplierProductsData?.pages) return [];
    return supplierProductsData.pages.flatMap(page => page?.data || []);
  }, [supplierProductsData]);

  // Get total product count and current count
  const totalProductCount = supplierProductsData?.pages?.[0]?.total || 0;
  const currentProductCount = supplierProducts.length;


  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar onLogout={handleLogout} />
        <SidebarInset className="flex-1">
          <Header />
            <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Suppliers</h1>
                <div className="flex items-center gap-3 mt-3">
                  <Badge variant="outline" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Database className="h-3 w-3" />
                    Data sourced from Odoo
                  </Badge>
                  {data && (
                    <Badge variant="secondary" className="text-xs">
                      {data.pages[0]?.pagination.total || 0} suppliers
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search suppliers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading suppliers...</span>
              </div>
            )}
            
            {isError && (
              <Card className="p-6">
                <p className="text-destructive">Error loading suppliers: {error?.message}</p>
              </Card>
            )}
            
            {!isLoading && !isError && suppliers.length === 0 && (
              <Card className="p-6">
                <p className="text-muted-foreground text-center">
                  {searchQuery ? 'No suppliers found matching your search.' : 'No suppliers found.'}
                </p>
              </Card>
            )}

            <div className="space-y-4">
              {suppliers.map((supplier) => (
                <Card key={supplier.id} className="overflow-hidden">
                  <Collapsible
                    open={openSuppliers[supplier.id]}
                    onOpenChange={() => toggleSupplier(supplier.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {openSuppliers[supplier.id] ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronRight className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-xl">{supplier.name}</CardTitle>
                              <div className="flex items-center gap-4 mt-2">
                                {supplier.email && (
                                  <span className="text-sm text-muted-foreground">
                                    {supplier.email}
                                  </span>
                                )}
                                {supplier.phone && (
                                  <span className="text-sm text-muted-foreground">
                                    {supplier.phone}
                                  </span>
                                )}
                                {supplier.city && (
                                  <span className="text-sm text-muted-foreground">
                                    {supplier.city}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-muted px-4 py-2 flex justify-between items-center">
                            <h3 className="font-semibold">Product Catalog</h3>
                            {selectedSupplierId === supplier.id && totalProductCount > 0 ? (
                              <Badge variant="secondary" className="text-xs">
                                Showing {currentProductCount} of {totalProductCount} products
                              </Badge>
                            ) : supplier.product_count !== undefined && (
                              <Badge variant="secondary" className="text-xs">
                                {supplier.product_count} products
                              </Badge>
                            )}
                          </div>
                          {(selectedSupplierId === supplier.id && isLoadingProducts) ? (
                            <div className="p-8 text-center">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">Loading products...</p>
                            </div>
                          ) : (selectedSupplierId === supplier.id && supplierProducts && supplierProducts.length > 0) ? (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-muted/50 border-b">
                                  <tr>
                                    <th className="px-3 py-3 text-left text-sm font-medium">Product</th>
                                    <th className="px-3 py-3 text-center text-sm font-medium">Code</th>
                                    <th className="px-3 py-3 text-center text-sm font-medium">Available</th>
                                    <th className="px-3 py-3 text-center text-sm font-medium">Min Level</th>
                                    <th className="px-3 py-3 text-center text-sm font-medium">Pack Size</th>
                                    <th className="px-3 py-3 text-center text-sm font-medium">MOQ</th>
                                    <th className="px-3 py-3 text-center text-sm font-medium">Price</th>
                                    <th className="px-3 py-3 text-center text-sm font-medium">Lead Time</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(selectedSupplierId === supplier.id && supplierProducts ? supplierProducts : supplier.products || []).map((product, index: number) => {
                                    const isLowStock = ((product as any).qty_available !== undefined && 
                                                      (product as any).minimum_level !== undefined && 
                                                      (product as any).qty_available < (product as any).minimum_level);
                                    const isOutOfStock = ((product as any).qty_available ?? 0) === 0;
                                    
                                    return (
                                      <tr key={product.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                                        <td className="px-3 py-3">
                                          <div>
                                            <div className="font-medium text-sm">
                                              {(() => {
                                                // Helper function to extract name without code
                                                const extractNameWithoutCode = (fullName: string) => {
                                                  // Remove pattern like [ANF-00423] from the beginning
                                                  const nameWithoutCode = fullName.replace(/^\[[\w-]+\]\s*/, '');
                                                  return nameWithoutCode || fullName; // Fallback to full name if pattern not found
                                                };
                                                
                                                if (product.product_name && 
                                                    typeof product.product_name === 'string' && 
                                                    product.product_name !== 'False' && 
                                                    product.product_name !== 'false' &&
                                                    product.product_name.trim() !== '') {
                                                  return product.product_name;
                                                } else if (product.product_id) {
                                                  // Handle both array format [id, name] and string format
                                                  if (Array.isArray(product.product_id) && product.product_id[1]) {
                                                    return extractNameWithoutCode(product.product_id[1]);
                                                  } else if (typeof product.product_id === 'string' && product.product_id !== '') {
                                                    return extractNameWithoutCode(product.product_id);
                                                  }
                                                }
                                                return 'Unnamed Product';
                                              })()}
                                            </div>
                                            {product.product_details && (
                                              <div className="text-xs text-muted-foreground">
                                                {product.product_details.name}
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                        <td className="px-3 py-3 text-center font-mono text-xs">
                                          {product.product_code || product.product_details?.default_code || '-'}
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                          <div className="flex flex-col items-center">
                                            <span className={`font-medium text-sm ${
                                              isOutOfStock ? 'text-destructive' : 
                                              isLowStock ? 'text-warning' : ''
                                            }`}>
                                              {(product as any).qty_available ?? '-'}
                                            </span>
                                            {((product as any).virtual_available !== undefined) && 
                                             ((product as any).virtual_available !== ((product as any).qty_available ?? 0)) && (
                                              <span className="text-xs text-muted-foreground">
                                                ({(product as any).virtual_available})
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="px-3 py-3 text-center text-sm group">
                                          <EditableMinLevel
                                            productId={product.id}
                                            currentMinLevel={(product as any).minimum_level ?? 0}
                                          />
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                          <div className="flex items-center justify-center gap-1">
                                            <Package className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-sm">{(product as any).pack_size ?? 1}</span>
                                          </div>
                                        </td>
                                        <td className="px-3 py-3 text-center font-medium text-sm">
                                          {product.min_qty || 1}
                                        </td>
                                        <td className="px-3 py-3 text-center text-sm">
                                          {product.price ? `$${product.price.toFixed(2)}` : '-'}
                                        </td>
                                        <td className="px-3 py-3 text-center text-sm">
                                          {product.delay ? `${product.delay}d` : '-'}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                              {hasNextProductPage && (
                                <div className="p-4 border-t flex justify-center">
                                  <Button
                                    variant="outline"
                                    onClick={() => fetchNextProductPage()}
                                    disabled={isFetchingNextProductPage}
                                    className="w-full max-w-xs"
                                  >
                                    {isFetchingNextProductPage ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Loading more products...
                                      </>
                                    ) : (
                                      `Load more products (${totalProductCount - currentProductCount} remaining)`
                                    )}
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : (supplier.product_count !== undefined && supplier.product_count > 0) ? (
                            <div className="p-8 text-center text-muted-foreground">
                              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p className="text-sm">Click to load {supplier.product_count} products</p>
                              <p className="text-xs mt-2">Products will be fetched from Odoo</p>
                            </div>
                          ) : (
                            <div className="p-8 text-center text-muted-foreground">
                              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p className="text-sm">No products available from this supplier</p>
                              <p className="text-xs mt-2">Products will appear here once added to Odoo</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
            
            {hasNextPage && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading more...
                    </>
                  ) : (
                    'Load more suppliers'
                  )}
                </Button>
              </div>
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Suppliers;
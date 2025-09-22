import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SelectWithScroll, SelectItem as ScrollSelectItem } from '@/components/ui/select-with-scroll';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/integrations/supabase/client';
import { Logger } from '@/services/Logger';

interface ProductFiltersProps {
  selectedVendor: string | null;
  onVendorChange: (vendor: string | null) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  selectedProductType: string | null;
  onProductTypeChange: (type: string | null) => void;
  sortBy: 'name' | 'price' | 'vendor' | 'created_at';
  onSortByChange: (sort: 'name' | 'price' | 'vendor' | 'created_at') => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  selectedVendor,
  onVendorChange,
  priceRange,
  onPriceRangeChange,
  selectedProductType,
  onProductTypeChange,
  sortBy,
  onSortByChange,
}) => {
  const [vendors, setVendors] = useState<string[]>([]);
  const [productTypes, setProductTypes] = useState<{ id: number; name: string }[]>([]);
  const [maxPrice, setMaxPrice] = useState(1000);

  useEffect(() => {
    // Fetch filter data from Odoo
    const fetchFilterData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || supabaseAnonKey;

      // Fetch categories
      try {
        const categoriesResponse = await fetch(`${supabaseUrl}/functions/v1/odoo-filters-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({ filter_type: 'categories' })
        });

        if (categoriesResponse.ok) {
          const { categories } = await categoriesResponse.json();
          Logger.debug('Categories found:', categories?.length || 0);
          setProductTypes(categories || []);
        }
      } catch (error) {
        Logger.error('Error fetching categories:', error);
      }

      // Fetch max price
      try {
        const priceResponse = await fetch(`${supabaseUrl}/functions/v1/odoo-filters-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({ filter_type: 'max_price' })
        });

        if (priceResponse.ok) {
          const { max_price } = await priceResponse.json();
          Logger.debug('Max price:', max_price);
          setMaxPrice(Math.ceil(max_price || 1000));
        }
      } catch (error) {
        Logger.error('Error fetching max price:', error);
      }

      // Fetch vendors (currently empty from Odoo)
      try {
        const vendorsResponse = await fetch(`${supabaseUrl}/functions/v1/odoo-filters-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({ filter_type: 'vendors' })
        });

        if (vendorsResponse.ok) {
          const { vendors } = await vendorsResponse.json();
          Logger.debug('Vendors found:', vendors?.length || 0);
          setVendors(vendors || []);
        }
      } catch (error) {
        Logger.error('Error fetching vendors:', error);
      }
    };

    fetchFilterData();
  }, []);

  const handleReset = () => {
    onVendorChange(null);
    onPriceRangeChange([0, maxPrice > 0 ? maxPrice : 1000]);
    onProductTypeChange(null);
    onSortByChange('name');
  };

  return (
    <>
      {/* Sort By */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Sort By</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={sortBy} onValueChange={(value: any) => onSortByChange(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="price">Price (Low to High)</SelectItem>
              <SelectItem value="vendor">Vendor (A-Z)</SelectItem>
              <SelectItem value="created_at">Newest First</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Vendor Filter */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Vendor</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedVendor || 'all'} onValueChange={(value) => onVendorChange(value === 'all' ? null : value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              {vendors.map((vendor) => (
                <SelectItem key={vendor} value={vendor}>
                  {vendor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Price Range Filter */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Price Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
            <Slider
              value={priceRange}
              onValueChange={(value) => onPriceRangeChange(value as [number, number])}
              min={0}
              max={maxPrice}
              step={10}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Product Type Filter */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Product Type</CardTitle>
        </CardHeader>
        <CardContent>
          <SelectWithScroll
            value={selectedProductType || 'all'} 
            onValueChange={(value) => onProductTypeChange(value === 'all' ? null : value)}
            placeholder="Select type"
          >
            <ScrollSelectItem value="all">All Types</ScrollSelectItem>
            {productTypes.map((type) => (
              <ScrollSelectItem key={type.id} value={String(type.id)}>
                {type.name}
              </ScrollSelectItem>
            ))}
          </SelectWithScroll>
        </CardContent>
      </Card>

      {/* Reset Filters */}
      <Button 
        variant="outline" 
        className="w-full"
        onClick={handleReset}
      >
        Reset Filters
      </Button>
    </>
  );
};
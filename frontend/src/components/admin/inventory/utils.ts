
import { Product } from './types';

// Get status badge for a product
export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'in-stock':
      return 'in-stock';
    case 'low-stock':
      return 'low-stock';
    case 'out-of-stock':
      return 'out-of-stock';
    default:
      return status;
  }
};

// Calculate profit margin
export const calculateMargin = (sellPrice: number, costPrice: number) => {
  if (costPrice === 0) return 0;
  const margin = ((sellPrice - costPrice) / sellPrice) * 100;
  return Math.round(margin * 10) / 10; // Round to 1 decimal
};

// Sort products based on configuration
export const sortProducts = (
  products: Product[], 
  sortConfig: {
    key: keyof Product, 
    direction: 'ascending' | 'descending'
  } | null
): Product[] => {
  if (!sortConfig) return products;
  
  return [...products].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });
};

// Filter products based on search term and tab
export const filterProducts = (
  products: Product[],
  searchTerm: string,
  activeTab: string
): Product[] => {
  let results = products;
  
  // Apply search filter
  if (searchTerm) {
    results = results.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  // Apply tab filter
  if (activeTab !== 'all') {
    results = results.filter(product => product.status === activeTab);
  }
  
  return results;
};

// Export inventory to CSV
export const exportInventoryToCSV = (filteredProducts: Product[]) => {
  const headers = ['Name', 'SKU', 'Category', 'Sell Price', 'Cost Price', 'On Hand', 'Forecast', 'Status', 'Supplier'];
  
  const csvData = filteredProducts.map(product => [
    product.name,
    product.sku,
    product.category,
    product.sellPrice.toString(),
    product.costPrice.toString(),
    product.onHand.toString(),
    product.forecast.toString(),
    product.status,
    product.supplier
  ]);
  
  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', `inventory-export-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

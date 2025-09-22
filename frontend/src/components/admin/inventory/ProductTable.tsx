
import React from 'react';
import { ArrowUpDown, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Product } from './types';

interface ProductTableProps {
  products: Product[];
  requestSort: (key: keyof Product) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  requestSort
}) => {
  // Get status badge for a product
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-stock':
        return (
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">In Stock</span>
          </div>
        );
      case 'low-stock':
        return (
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-amber-500 mr-1" />
            <span className="text-amber-600">Low Stock</span>
          </div>
        );
      case 'out-of-stock':
        return (
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-red-500 mr-1" />
            <span className="text-red-600">Out of Stock</span>
          </div>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <div 
                className="flex items-center cursor-pointer"
                onClick={() => requestSort('name')}
              >
                Product Name
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>
              <div 
                className="flex items-center cursor-pointer"
                onClick={() => requestSort('sku')}
              >
                SKU
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>
              <div 
                className="flex items-center cursor-pointer"
                onClick={() => requestSort('sellPrice')}
              >
                Sell Price
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>
              <div 
                className="flex items-center cursor-pointer"
                onClick={() => requestSort('costPrice')}
              >
                Cost Price
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>
              <div className="text-right flex items-center justify-end cursor-pointer"
                onClick={() => requestSort('onHand')}
              >
                On Hand
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>
              <div className="text-right flex items-center justify-end cursor-pointer"
                onClick={() => requestSort('forecast')}
              >
                Forecast
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>
              <div 
                className="flex items-center cursor-pointer"
                onClick={() => requestSort('status')}
              >
                Status
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No products found
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.sku}</TableCell>
                <TableCell>£{product.sellPrice.toFixed(2)}</TableCell>
                <TableCell>£{product.costPrice.toFixed(2)}</TableCell>
                <TableCell className="text-right">{product.onHand}</TableCell>
                <TableCell className="text-right">{product.forecast}</TableCell>
                <TableCell>{getStatusBadge(product.status)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductTable;

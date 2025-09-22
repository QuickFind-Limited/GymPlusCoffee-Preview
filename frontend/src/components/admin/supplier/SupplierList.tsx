
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Supplier } from './types';
import { getStatusColor, capitalizeFirstLetter } from './utils';

interface SupplierListProps {
  suppliers: Supplier[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  selectedSupplier: Supplier | null;
  handleSelectSupplier: (supplier: Supplier) => void;
  handleAddNewSupplier: () => void;
}

const SupplierList: React.FC<SupplierListProps> = ({
  suppliers,
  searchQuery,
  setSearchQuery,
  statusFilter,
  categoryFilter,
  selectedSupplier,
  handleSelectSupplier,
}) => {
  const filteredSuppliers = suppliers
    .filter(supplier => 
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(supplier => 
      statusFilter === 'all' ? true : supplier.status === statusFilter
    )
    .filter(supplier => 
      categoryFilter === 'all' ? true : supplier.category === categoryFilter
    );

  return (
    <div className="md:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search suppliers..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {filteredSuppliers.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No suppliers found
          </div>
        ) : (
          filteredSuppliers.map(supplier => (
            <div 
              key={supplier.id}
              onClick={() => handleSelectSupplier(supplier)}
              className={`p-4 cursor-pointer transition-colors ${
                selectedSupplier?.id === supplier.id ? 'bg-brand-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{supplier.name}</h4>
                  <p className="text-sm text-gray-500">{supplier.category}</p>
                  <p className="text-xs text-gray-500 mt-1">{supplier.location}</p>
                </div>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(supplier.status)}`}>
                  {capitalizeFirstLetter(supplier.status)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SupplierList;


import React from 'react';
import { Upload } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface SupplierHeaderProps {
  handleImportSuppliers: () => void;
  handleExportSuppliers: () => void;
}

const SupplierHeader: React.FC<SupplierHeaderProps> = ({
  handleImportSuppliers,
  handleExportSuppliers
}) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Supplier Management</h1>
          <p className="text-gray-600">Manage your suppliers, contracts, and track performance</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-1"
            onClick={handleImportSuppliers}
          >
            <Upload className="h-4 w-4" /> Import
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SupplierHeader;

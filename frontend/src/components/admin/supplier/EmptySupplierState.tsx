
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface EmptySupplierStateProps {
  handleAddNewSupplier: () => void;
}

const EmptySupplierState: React.FC<EmptySupplierStateProps> = ({ handleAddNewSupplier }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full flex flex-col items-center justify-center text-center">
      <img 
        src="/lovable-uploads/c7980f13-48f9-479c-b00d-bc2e41a58b92.png" 
        alt="Select Supplier" 
        className="w-32 h-32 mb-4 opacity-25"
      />
      <h3 className="text-lg font-medium text-gray-500 mb-2">No Supplier Selected</h3>
      <p className="text-gray-400 mb-4">Select a supplier from the list or add a new one to view details</p>
      <Button 
        variant="outline" 
        onClick={handleAddNewSupplier}
        className="flex items-center gap-1"
      >
        <Plus className="h-4 w-4" /> Add New Supplier
      </Button>
    </div>
  );
};

export default EmptySupplierState;

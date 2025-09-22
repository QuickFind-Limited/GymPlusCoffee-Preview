
import React from 'react';
import { Upload, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface InventoryToolbarProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAISync: () => void;
  isSyncing: boolean;
}

const InventoryToolbar: React.FC<InventoryToolbarProps> = ({
  searchTerm,
  onSearchChange,
  onImport,
  onAISync,
  isSyncing
}) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Inventory</h2>
        <p className="text-gray-600">View products, pricing and stock levels</p>
      </div>
      
      <div className="flex gap-2">
        <div className="relative">
          <Input
            id="import-inventory"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={onImport}
          />
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => document.getElementById('import-inventory')?.click()}
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
        </div>
        
        <Button 
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onAISync}
          disabled={isSyncing}
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          AI Agent Sync
        </Button>
      </div>
    </div>
  );
};

export default InventoryToolbar;

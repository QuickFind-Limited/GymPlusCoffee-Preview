import React, { useState } from 'react';
import { EditableMinLevel } from '@/components/test/EditableMinLevel';
import { supabase } from '@/integrations/supabase/client';

// Test data
const testProducts = [
  { id: 285, name: 'Deluxe White Cotton Show Halters', minLevel: 75, supplierId: 23 },
  { id: 286, name: 'Premium Feed Supplement', minLevel: 50, supplierId: 23 },
  { id: 287, name: 'Veterinary Surgical Kit', minLevel: 30, supplierId: 25 },
];

export default function TestEditableMinLevel() {
  const [products, setProducts] = useState(testProducts);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const handleUpdateMinLevel = async (productId: number, newMinLevel: number): Promise<boolean> => {
    try {
      console.log(`Updating product ${productId} min level to ${newMinLevel}`);
      
      // Call the edge function to update Odoo
      const { data, error } = await supabase.functions.invoke('update-stock-levels', {
        body: {
          productId,
          newMinLevel
        }
      });

      if (error) {
        console.error('Error calling edge function:', error);
        return false;
      }

      if (data?.success) {
        // Update local state
        setProducts(prev => prev.map(p => 
          p.id === productId ? { ...p, minLevel: newMinLevel } : p
        ));
        
        setLastUpdate(`Product ${productId} updated to min level ${newMinLevel} at ${new Date().toLocaleTimeString()}`);
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error updating minimum level:', err);
      return false;
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Test Editable Minimum Level</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Sample Products</h2>
        
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Product ID</th>
              <th className="text-left py-2">Product Name</th>
              <th className="text-left py-2">Supplier ID</th>
              <th className="text-left py-2">Min Level</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} className="border-b">
                <td className="py-3">{product.id}</td>
                <td className="py-3">{product.name}</td>
                <td className="py-3">{product.supplierId}</td>
                <td className="py-3">
                  <EditableMinLevel
                    productId={product.id}
                    currentMinLevel={product.minLevel}
                    onUpdate={handleUpdateMinLevel}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {lastUpdate && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 rounded">
            {lastUpdate}
          </div>
        )}
        
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">How it works:</h3>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Click the edit icon next to any minimum level value</li>
            <li>Enter a new value and press Enter or click the check mark</li>
            <li>The value is sent to an edge function that updates Odoo</li>
            <li>The edge function parses and updates the JSON metadata in the product_name field</li>
            <li>Changes are reflected immediately in the UI</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
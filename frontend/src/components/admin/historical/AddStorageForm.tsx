
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StorageLocation } from './types';

interface AddStorageFormProps {
  provider: StorageLocation;
  onAddStorage: (path: string) => void;
  onCancel: () => void;
}

const AddStorageForm: React.FC<AddStorageFormProps> = ({ 
  provider, 
  onAddStorage, 
  onCancel 
}) => {
  const [newPath, setNewPath] = useState('');

  const handleSubmit = () => {
    onAddStorage(newPath);
    setNewPath('');
  };

  const getPlaceholder = () => {
    switch (provider) {
      case 'google':
        return 'Enter Google Drive folder path';
      case 'onedrive':
        return 'Enter OneDrive folder path';
      default:
        return 'Enter storage path';
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Add New Storage Location</CardTitle>
        <CardDescription>
          {provider === 'google' 
            ? 'Connect a new Google Drive folder for historical data storage'
            : 'Connect a new OneDrive folder for historical data storage'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input 
            placeholder={getPlaceholder()} 
            value={newPath} 
            onChange={(e) => setNewPath(e.target.value)} 
            className="flex-1"
          />
          <Button onClick={handleSubmit}>Add Storage</Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AddStorageForm;

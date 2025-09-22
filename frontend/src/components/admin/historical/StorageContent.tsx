
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StorageAccount, StorageLocation } from './types';
import StorageAccountList from './StorageAccountList';
import { getStorageLogo } from './StatusIndicators';

interface StorageContentProps {
  provider: StorageLocation;
  storages: StorageAccount[];
  onSync: (provider: StorageLocation, id: string) => void;
  onToggleAutoSync: (provider: StorageLocation, id: string) => void;
  onDelete: (provider: StorageLocation, id: string) => void;
}

const getProviderTitle = (provider: StorageLocation) => {
  switch (provider) {
    case 'onedrive':
      return 'OneDrive Integration';
    case 'google':
      return 'Google Drive Integration';
    default:
      return 'Storage Integration';
  }
};

const getProviderDescription = (provider: StorageLocation) => {
  switch (provider) {
    case 'onedrive':
      return 'Connect and manage OneDrive folders for historical procurement data';
    case 'google':
      return 'Connect and manage Google Drive folders for historical procurement data';
    default:
      return 'Manage storage locations for historical procurement data';
  }
};

const StorageContent: React.FC<StorageContentProps> = ({ 
  provider, 
  storages, 
  onSync, 
  onToggleAutoSync, 
  onDelete 
}) => {
  const title = getProviderTitle(provider);
  const description = getProviderDescription(provider);
  
  return (
    <div>
      <div className="mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <div className="flex-shrink-0">
              {getStorageLogo(provider, "h-6 w-6")}
            </div>
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>
                {description}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Syncing {provider === 'onedrive' ? 'OneDrive folders' : 'Google Drive folders'} allows the system to automatically backup and process historical procurement data.
              </p>
            </div>
            <Separator className="my-4" />
            <StorageAccountList 
              accounts={storages} 
              provider={provider}
              onSync={onSync}
              onToggleAutoSync={onToggleAutoSync}
              onDelete={onDelete}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StorageContent;

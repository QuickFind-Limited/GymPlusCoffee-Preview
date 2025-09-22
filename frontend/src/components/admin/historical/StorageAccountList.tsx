
import React from 'react';
import { StorageAccount, StorageLocation } from './types';
import StorageAccountCard from './StorageAccountCard';

interface StorageAccountListProps {
  accounts: StorageAccount[];
  provider: StorageLocation;
  onSync: (provider: StorageLocation, id: string) => void;
  onToggleAutoSync: (provider: StorageLocation, id: string) => void;
  onDelete: (provider: StorageLocation, id: string) => void;
}

const StorageAccountList: React.FC<StorageAccountListProps> = ({ 
  accounts, 
  provider, 
  onSync, 
  onToggleAutoSync, 
  onDelete 
}) => {
  return (
    <div className="space-y-4">
      {accounts.map(account => (
        <StorageAccountCard 
          key={account.id}
          account={account}
          provider={provider}
          onSync={onSync}
          onToggleAutoSync={onToggleAutoSync}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default StorageAccountList;

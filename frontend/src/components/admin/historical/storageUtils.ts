
import { useState } from 'react';
import { StorageLocation, StorageAccount } from './types';
import { toast } from "sonner";

export const useStorageOperations = () => {
  // Simulate operations with a mock implementation
  const handleSync = (
    provider: StorageLocation, 
    id: string, 
    storages: StorageAccount[], 
    setStorages: React.Dispatch<React.SetStateAction<StorageAccount[]>>
  ) => {
    // Find the storage to update
    const updatedStorages = storages.map(storage => {
      if (storage.id === id) {
        // Start syncing
        return { ...storage, syncStatus: 'syncing' as const, syncProgress: 0 };
      }
      return storage;
    });
    
    setStorages(updatedStorages);
    
    // Simulate progress updates
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      
      if (progress <= 100) {
        setStorages(current => 
          current.map(storage => 
            storage.id === id 
              ? { ...storage, syncProgress: progress } 
              : storage
          )
        );
      } else {
        // Complete sync
        clearInterval(interval);
        setStorages(current => 
          current.map(storage => 
            storage.id === id 
              ? { 
                  ...storage, 
                  syncStatus: 'synced' as const, 
                  lastSync: new Date().toLocaleString(),
                  syncProgress: undefined
                } 
              : storage
          )
        );
        
        toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} storage synced successfully`);
      }
    }, 500);
  };

  const handleToggleAutoSync = (
    provider: StorageLocation, 
    id: string, 
    storages: StorageAccount[], 
    setStorages: React.Dispatch<React.SetStateAction<StorageAccount[]>>
  ) => {
    const updatedStorages = storages.map(storage => {
      if (storage.id === id) {
        const newAutoSync = !storage.autoSync;
        toast.success(`Auto-sync ${newAutoSync ? 'enabled' : 'disabled'} for ${storage.name}`);
        return { ...storage, autoSync: newAutoSync };
      }
      return storage;
    });
    
    setStorages(updatedStorages);
  };

  const handleAddStorage = (
    provider: StorageLocation, 
    path: string, 
    storages: StorageAccount[], 
    setStorages: React.Dispatch<React.SetStateAction<StorageAccount[]>>,
    onComplete: () => void
  ) => {
    // Create a new storage account
    const newStorage: StorageAccount = {
      id: Date.now().toString(),
      path,
      name: path.split('/').pop() || `New ${provider} Storage`,
      syncStatus: 'synced',
      lastSync: new Date().toLocaleString(),
      autoSync: true
    };
    
    setStorages([...storages, newStorage]);
    toast.success(`New ${provider} storage location added`);
    onComplete();
  };

  const handleDeleteStorage = (
    provider: StorageLocation, 
    id: string, 
    storages: StorageAccount[], 
    setStorages: React.Dispatch<React.SetStateAction<StorageAccount[]>>
  ) => {
    const storage = storages.find(s => s.id === id);
    if (storage) {
      setStorages(storages.filter(s => s.id !== id));
      toast.success(`${storage.name} removed from ${provider} storages`);
    }
  };

  return {
    handleSync,
    handleToggleAutoSync,
    handleAddStorage,
    handleDeleteStorage
  };
};

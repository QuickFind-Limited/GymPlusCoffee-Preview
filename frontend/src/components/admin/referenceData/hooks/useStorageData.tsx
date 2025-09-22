
import { useState } from 'react';
import { StorageLocation, StorageAccount } from '../../historical/types';
import { useStorageOperations } from '../../historical/storageUtils';

export const useStorageData = () => {
  const [googleDrives, setGoogleDrives] = useState<StorageAccount[]>([
    {
      id: '1',
      path: 'Procurement/Historical_2023',
      name: 'Procurement 2023',
      syncStatus: 'synced',
      lastSync: '2023-06-15 16:45',
      autoSync: true
    },
    {
      id: '2',
      path: 'Procurement/Vendor_Catalogs',
      name: 'Vendor Catalogs',
      syncStatus: 'synced',
      lastSync: '2023-06-16 10:30',
      autoSync: true
    },
    {
      id: '3',
      path: 'Procurement/Quotes',
      name: 'Supplier Quotes',
      syncStatus: 'syncing',
      lastSync: '2023-06-16 14:20',
      syncProgress: 45,
      autoSync: true
    }
  ]);

  const [oneDrives, setOneDrives] = useState<StorageAccount[]>([
    { 
      id: '1', 
      path: 'Procurement/Price Lists',
      name: 'Supplier Price Lists',
      syncStatus: 'synced', 
      lastSync: '2023-06-15 13:20', 
      autoSync: true 
    },
    { 
      id: '2', 
      path: 'Procurement/Catalogues',
      name: 'Supplier Product Catalogues',
      syncStatus: 'synced', 
      lastSync: '2023-06-15 10:45', 
      autoSync: true 
    },
    { 
      id: '3', 
      path: 'Procurement/Orders',
      name: 'Orders',
      syncStatus: 'synced', 
      lastSync: '2023-06-15 12:30', 
      autoSync: true 
    },
    { 
      id: '4', 
      path: 'Procurement/Invoices',
      name: 'Invoices',
      syncStatus: 'synced', 
      lastSync: '2023-06-15 14:20', 
      autoSync: true 
    },
    { 
      id: '5', 
      path: 'Procurement/Quotes',
      name: 'Orders',
      syncStatus: 'synced', 
      lastSync: '2023-06-15 09:50', 
      autoSync: true 
    },
    { 
      id: '6', 
      path: 'Procurement/DeliveryAdvices',
      name: 'Delivery Notes',
      syncStatus: 'synced', 
      lastSync: '2023-06-15 15:10', 
      autoSync: true 
    }
  ]);

  const storageOperations = useStorageOperations();

  const handleSync = (provider: StorageLocation, id: string) => {
    if (provider === 'google') {
      storageOperations.handleSync(provider, id, googleDrives, setGoogleDrives);
    } else if (provider === 'onedrive') {
      storageOperations.handleSync(provider, id, oneDrives, setOneDrives);
    }
  };

  const handleToggleAutoSync = (provider: StorageLocation, id: string) => {
    if (provider === 'google') {
      storageOperations.handleToggleAutoSync(provider, id, googleDrives, setGoogleDrives);
    } else if (provider === 'onedrive') {
      storageOperations.handleToggleAutoSync(provider, id, oneDrives, setOneDrives);
    }
  };

  const handleAddStorage = (
    activeTab: StorageLocation, 
    path: string, 
    onComplete: () => void
  ) => {
    if (activeTab === 'google') {
      storageOperations.handleAddStorage(
        activeTab, 
        path, 
        googleDrives, 
        setGoogleDrives, 
        onComplete
      );
    } else if (activeTab === 'onedrive') {
      storageOperations.handleAddStorage(
        activeTab, 
        path, 
        oneDrives, 
        setOneDrives, 
        onComplete
      );
    }
  };

  const handleDeleteStorage = (provider: StorageLocation, id: string) => {
    if (provider === 'google') {
      storageOperations.handleDeleteStorage(provider, id, googleDrives, setGoogleDrives);
    } else if (provider === 'onedrive') {
      storageOperations.handleDeleteStorage(provider, id, oneDrives, setOneDrives);
    }
  };

  return {
    googleDrives,
    oneDrives,
    handleSync,
    handleToggleAutoSync,
    handleAddStorage,
    handleDeleteStorage
  };
};

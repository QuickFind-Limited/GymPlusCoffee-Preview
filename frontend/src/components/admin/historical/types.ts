
// Storage Data Types
export type StorageLocation = 'google' | 'onedrive';

export interface StorageAccount {
  id: string;
  path: string;
  name: string;
  syncStatus: 'synced' | 'syncing' | 'error' | 'disconnected';
  lastSync: string;
  syncProgress?: number;
  autoSync: boolean;
}

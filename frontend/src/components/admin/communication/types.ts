
export type SyncStatus = 'synced' | 'syncing' | 'error' | 'disconnected';
export type CommunicationProvider = 'gmail' | 'outlook';

export interface EmailAccount {
  id: string;
  email: string;
  name: string;
  syncStatus: SyncStatus;
  lastSync: string;
  autoSync: boolean;
  syncProgress?: number;
  userTag?: string;
  isCurrentUser?: boolean;
  emailsProcessed?: number;
  suppliersFound?: number;
  ordersTracked?: number;
}

export interface EmailOperations {
  handleSync: (
    provider: CommunicationProvider, 
    id: string, 
    accounts: EmailAccount[], 
    setAccounts: React.Dispatch<React.SetStateAction<EmailAccount[]>>
  ) => void;
  handleToggleAutoSync: (
    provider: CommunicationProvider, 
    id: string, 
    accounts: EmailAccount[], 
    setAccounts: React.Dispatch<React.SetStateAction<EmailAccount[]>>
  ) => void;
  handleDeleteAccount: (
    provider: CommunicationProvider, 
    id: string, 
    accounts: EmailAccount[], 
    setAccounts: React.Dispatch<React.SetStateAction<EmailAccount[]>>
  ) => void;
  handleAddAccount: (
    provider: CommunicationProvider,
    email: string,
    accounts: EmailAccount[],
    setAccounts: (accounts: EmailAccount[]) => void,
    onSuccess: () => void
  ) => void;
}

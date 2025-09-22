
import { EmailAccount, CommunicationProvider } from './types';
import { useToast } from "@/hooks/use-toast";

export const useEmailOperations = () => {
  const { toast } = useToast();

  const handleSync = (
    provider: CommunicationProvider, 
    id: string, 
    accounts: EmailAccount[], 
    setAccounts: React.Dispatch<React.SetStateAction<EmailAccount[]>>
  ) => {
    const updateAccount = (account: EmailAccount) => {
      if (account.id === id) {
        return {
          ...account,
          syncStatus: 'syncing' as const,
          syncProgress: 0,
          lastSync: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
      }
      return account;
    };

    setAccounts(accounts.map(updateAccount));
    
    // Simulate sync progress
    const interval = setInterval(() => {
      setAccounts(currentAccounts => {
        const updatedAccounts = currentAccounts.map(account => {
          if (account.id === id && account.syncStatus === 'syncing') {
            const progress = (account.syncProgress || 0) + 10;
            if (progress >= 100) {
              clearInterval(interval);
              return {
                ...account,
                syncProgress: 100,
                syncStatus: 'synced' as const
              };
            }
            return {
              ...account,
              syncProgress: progress
            };
          }
          return account;
        });
        return updatedAccounts;
      });
    }, 500);

    toast({
      title: "Sync started",
      description: `Syncing account ${id} from ${provider}`,
    });
  };

  const handleToggleAutoSync = (
    provider: CommunicationProvider, 
    id: string, 
    accounts: EmailAccount[], 
    setAccounts: React.Dispatch<React.SetStateAction<EmailAccount[]>>
  ) => {
    setAccounts(accounts.map(account => 
      account.id === id ? { ...account, autoSync: !account.autoSync } : account
    ));

    toast({
      title: "Auto-sync setting changed",
      description: `Auto-sync ${provider} account updated`,
    });
  };

  const handleAddAccount = (
    provider: CommunicationProvider,
    newEmail: string,
    accounts: EmailAccount[],
    setAccounts: (accounts: EmailAccount[]) => void,
    onSuccess: () => void
  ) => {
    if (!newEmail || !newEmail.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    const newAccount: EmailAccount = {
      id: Date.now().toString(),
      email: newEmail,
      name: newEmail.split('@')[0].split('.').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' '),
      syncStatus: 'disconnected',
      lastSync: 'Never',
      autoSync: false
    };

    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);
    onSuccess();
    
    toast({
      title: "Account added",
      description: `New ${provider} account has been added`,
    });
  };

  const handleDeleteAccount = (
    provider: CommunicationProvider, 
    id: string, 
    accounts: EmailAccount[], 
    setAccounts: React.Dispatch<React.SetStateAction<EmailAccount[]>>
  ) => {
    setAccounts(accounts.filter(account => account.id !== id));

    toast({
      title: "Account removed",
      description: `${provider} account has been deleted`,
    });
  };

  return {
    handleSync,
    handleToggleAutoSync,
    handleAddAccount,
    handleDeleteAccount
  };
};

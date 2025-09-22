
import React from 'react';
import { EmailAccount, CommunicationProvider } from './types';
import EmailAccountCard from './EmailAccountCard';

interface EmailAccountListProps {
  accounts: EmailAccount[];
  provider: CommunicationProvider;
  onSync: (provider: CommunicationProvider, id: string) => void;
  onToggleAutoSync: (provider: CommunicationProvider, id: string) => void;
  onDelete: (provider: CommunicationProvider, id: string) => void;
}

const EmailAccountList: React.FC<EmailAccountListProps> = ({ 
  accounts, 
  provider, 
  onSync, 
  onToggleAutoSync, 
  onDelete 
}) => {
  console.log('EmailAccountList rendered with provider:', provider, 'accounts:', accounts.length);
  
  return (
    <div className="space-y-4">
      {accounts.map(account => (
        <EmailAccountCard 
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

export default EmailAccountList;

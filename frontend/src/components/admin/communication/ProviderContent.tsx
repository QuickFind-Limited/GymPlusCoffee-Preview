
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { EmailAccount, CommunicationProvider } from './types';
import EmailAccountList from './EmailAccountList';
import { getProviderLogo } from './StatusIndicators';
import GoogleOAuthFlow from '@/components/auth/GoogleOAuthFlow';
import MicrosoftOAuthFlow from '@/components/auth/MicrosoftOAuthFlow';

interface ProviderContentProps {
  provider: CommunicationProvider;
  accounts: EmailAccount[];
  onSync: (provider: CommunicationProvider, id: string) => void;
  onToggleAutoSync: (provider: CommunicationProvider, id: string) => void;
  onDelete: (provider: CommunicationProvider, id: string) => void;
  onAddAccount?: (email: string) => void;
  onConnectGoogle?: () => void;
  currentUserEmail?: string;
}

const getProviderTitle = (provider: CommunicationProvider) => {
  switch (provider) {
    case 'gmail':
      return 'Gmail Integration';
    case 'outlook':
      return 'Outlook Integration';
    default:
      return 'Channel Integration';
  }
};

const getProviderDescription = (provider: CommunicationProvider) => {
  switch (provider) {
    case 'gmail':
    case 'outlook':
      return `Connect and manage ${provider} accounts for procurement communications`;
    default:
      return 'Manage communication channels for procurement';
  }
};

const ProviderContent: React.FC<ProviderContentProps> = ({ 
  provider, 
  accounts, 
  onSync, 
  onToggleAutoSync, 
  onDelete,
  onAddAccount,
  onConnectGoogle,
  currentUserEmail
}) => {
  const [showOAuthFlow, setShowOAuthFlow] = useState(false);
  const title = getProviderTitle(provider);
  const description = getProviderDescription(provider);
  
  // Enhance accounts with user association
  const enhancedAccounts = accounts.map(account => ({
    ...account,
    isCurrentUser: account.email === currentUserEmail
  }));

  const handleOAuthSuccess = (email: string) => {
    if (onAddAccount) {
      onAddAccount(email);
    }
  };

  const handleConnectClick = () => {
    setShowOAuthFlow(true);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>
        {onAddAccount && (
          <Button 
            variant="outline" 
            onClick={handleConnectClick}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Connect Account
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <EmailAccountList 
          accounts={enhancedAccounts} 
          provider={provider}
          onSync={onSync}
          onToggleAutoSync={onToggleAutoSync}
          onDelete={onDelete}
        />
      </div>

      {accounts.length === 0 && (
        <div className="border border-gray-200 rounded-lg p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-6">
            {getProviderLogo(provider, 'h-12 w-12 text-gray-400')}
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-3">No accounts connected</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Connect your {provider} account to sync procurement communications
          </p>
          {onAddAccount && (
            <Button 
              variant="outline" 
              onClick={handleConnectClick}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Connect Your First Account
            </Button>
          )}
        </div>
      )}

      {/* OAuth Flows */}
      {provider === 'gmail' && (
        <GoogleOAuthFlow
          isOpen={showOAuthFlow}
          onClose={() => setShowOAuthFlow(false)}
          onSuccess={handleOAuthSuccess}
        />
      )}
      
      {provider === 'outlook' && (
        <MicrosoftOAuthFlow
          isOpen={showOAuthFlow}
          onClose={() => setShowOAuthFlow(false)}
          onSuccess={handleOAuthSuccess}
        />
      )}
    </div>
  );
};

export default ProviderContent;

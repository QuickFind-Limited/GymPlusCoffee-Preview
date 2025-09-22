
import React from 'react';
import { RefreshCw, Trash2, Check, Mail, Package, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { EmailAccount, CommunicationProvider } from './types';

interface EmailAccountCardProps {
  account: EmailAccount & { isCurrentUser?: boolean };
  provider: CommunicationProvider;
  onSync: (provider: CommunicationProvider, id: string) => void;
  onToggleAutoSync: (provider: CommunicationProvider, id: string) => void;
  onDelete: (provider: CommunicationProvider, id: string) => void;
}

const EmailAccountCard: React.FC<EmailAccountCardProps> = ({ 
  account, 
  provider, 
  onSync, 
  onToggleAutoSync, 
  onDelete 
}) => {
  const handleSync = () => {
    console.log('Sync button clicked for account:', account.id, 'provider:', provider);
    onSync(provider, account.id);
  };

  const handleToggleAutoSync = () => {
    console.log('Toggle auto-sync for account:', account.id, 'provider:', provider);
    onToggleAutoSync(provider, account.id);
  };

  const handleDelete = () => {
    console.log('Delete account:', account.id, 'provider:', provider);
    onDelete(provider, account.id);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {account.email.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{account.name}</h4>
            <p className="text-sm text-gray-500 mt-1">{account.email}</p>
            {account.userTag && (
              <p className="text-xs text-blue-600 font-medium mt-1">{account.userTag}</p>
            )}
            {account.lastSync && (
              <p className="text-sm text-gray-400 mt-1">Last synced: {account.lastSync}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {account.syncStatus === 'syncing' && account.syncProgress !== undefined && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Syncing... {account.syncProgress}%
            </div>
          )}
          {account.syncStatus === 'synced' && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <Check className="h-4 w-4" />
              Synced
            </div>
          )}
          {account.syncStatus === 'error' && (
            <div className="text-sm text-red-500">
              Error
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            onClick={handleSync}
            disabled={account.syncStatus === 'syncing'}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${account.syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>

      
      {account.syncStatus === 'syncing' && account.syncProgress !== undefined && (
        <div className="mb-4">
          <Progress 
            value={account.syncProgress} 
            className="w-full h-2"
            indicatorClassName="bg-blue-500"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Switch 
            id={`auto-sync-${account.id}`}
            checked={account.autoSync}
            onCheckedChange={handleToggleAutoSync}
          />
          <label 
            htmlFor={`auto-sync-${account.id}`}
            className="ml-2 text-sm font-medium text-gray-700 cursor-pointer"
          >
            Auto-sync
          </label>
        </div>
        {account.userTag && (
          <span className="text-sm text-gray-400">{account.userTag}</span>
        )}
      </div>
    </div>
  );
};

export default EmailAccountCard;

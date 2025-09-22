
import React from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { StorageAccount, StorageLocation } from './types';
import { getSyncStatusIcon, getSyncStatusBadge } from './StatusIndicators';

interface StorageAccountCardProps {
  account: StorageAccount;
  provider: StorageLocation;
  onSync: (provider: StorageLocation, id: string) => void;
  onToggleAutoSync: (provider: StorageLocation, id: string) => void;
  onDelete: (provider: StorageLocation, id: string) => void;
}

const StorageAccountCard: React.FC<StorageAccountCardProps> = ({ 
  account, 
  provider, 
  onSync, 
  onToggleAutoSync, 
  onDelete 
}) => {
  return (
    <Card key={account.id} className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getSyncStatusIcon(account.syncStatus)}
              <div>
                <h3 className="font-medium">{account.name}</h3>
                <p className="text-sm text-gray-500">{account.path}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getSyncStatusBadge(account.syncStatus)}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onSync(provider, account.id)}
                disabled={account.syncStatus === 'syncing'}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Sync Now
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => onDelete(provider, account.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {account.syncStatus === 'syncing' && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span>Sync progress</span>
                <span>{account.syncProgress || 0}%</span>
              </div>
              <Progress value={account.syncProgress} className="h-2" />
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Last synced: {account.lastSync}
              </p>
            </div>
            <div className="flex items-center">
              <Switch 
                id={`auto-sync-${account.id}`}
                checked={account.autoSync}
                onCheckedChange={() => onToggleAutoSync(provider, account.id)}
              />
              <label 
                htmlFor={`auto-sync-${account.id}`}
                className="ml-2 text-sm font-medium"
              >
                Auto-sync
              </label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StorageAccountCard;

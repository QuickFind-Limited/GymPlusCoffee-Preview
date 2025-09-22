
import React from 'react';
import { HardDrive } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { StorageAccount, StorageLocation } from './types';

// Custom provider logos using SVG
export const getStorageLogo = (provider: StorageLocation, className: string = "h-5 w-5") => {
  switch (provider) {
    case 'onedrive':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.6,11.4c0-0.2,0-0.3,0.1-0.4c0.8-2.6,3.1-4.4,5.9-4.4c2.6,0,4.9,1.7,5.7,4.1c0.6-0.2,1.2-0.4,1.8-0.4 c2.7,0,4.9,2.2,4.9,4.9c0,2.7-2.2,4.9-4.9,4.9H8c-2.7,0-4.9-2.2-4.9-4.9C3.1,13.6,5.1,11.5,7.6,11.4z" fill="#0078D4"/>
          <path d="M13.6,7.2c2.2,0,4.1,1.3,4.9,3.2c0.3-0.1,0.7-0.1,1-0.1c0,0,0,0,0,0c-1-2.5-3.4-4.3-6.3-4.3c-3,0-5.6,2-6.5,4.7 c0.3,0,0.6-0.1,0.9-0.1C8.4,8.8,10.8,7.2,13.6,7.2z" fill="#0078D4"/>
        </svg>
      );
    case 'google':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12,11v2h2v2h-2v2h-2v-2H8v-2h2v-2H12z M12,2L4,5.4V12c0,5.6,3.4,10.8,8,12.8c4.6-2,8-7.2,8-12.8V5.4L12,2z" fill="#4285F4" fillOpacity="0.8"/>
        </svg>
      );
    default:
      return <HardDrive className={className} />;
  }
};

export const getSyncStatusIcon = (status: StorageAccount['syncStatus']) => {
  switch (status) {
    case 'synced':
      return <HardDrive className="h-5 w-5 text-green-500" />;
    case 'syncing':
      return <HardDrive className="h-5 w-5 text-blue-500 animate-pulse" />;
    case 'error':
      return <HardDrive className="h-5 w-5 text-red-500" />;
    case 'disconnected':
      return <HardDrive className="h-5 w-5 text-gray-400" />;
    default:
      return <HardDrive className="h-5 w-5 text-gray-500" />;
  }
};

export const getSyncStatusBadge = (status: StorageAccount['syncStatus']) => {
  switch (status) {
    case 'synced':
      return <Badge variant="default" className="bg-green-500">Synced</Badge>;
    case 'syncing':
      return <Badge variant="secondary" className="bg-blue-500 text-white">Syncing</Badge>;
    case 'error':
      return <Badge variant="destructive">Error</Badge>;
    case 'disconnected':
      return <Badge variant="outline">Disconnected</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

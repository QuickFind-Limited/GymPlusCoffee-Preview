
import React from 'react';
import { Mail, MessageCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { EmailAccount, CommunicationProvider } from './types';

// Custom provider logos using SVG
export const getProviderLogo = (provider: CommunicationProvider, className: string = "h-6 w-6") => {
  switch (provider) {
    case 'gmail':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.5 4.5V19.5C22.5 20.0967 22.2629 20.669 21.841 21.091C21.419 21.5129 20.8467 21.75 20.25 21.75H3.75C3.15326 21.75 2.58097 21.5129 2.15901 21.091C1.73705 20.669 1.5 20.0967 1.5 19.5V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22.5 4.5L12 13.5L1.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M1.5 4.5H22.5V19.5C22.5 20.0967 22.2629 20.669 21.841 21.091C21.419 21.5129 20.8467 21.75 20.25 21.75H3.75C3.15326 21.75 2.58097 21.5129 2.15901 21.091C1.73705 20.669 1.5 20.0967 1.5 19.5V4.5Z" fill="#EA4335" fillOpacity="0.2"/>
          <path d="M5.04 6.75H19.2" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'outlook':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.25 12C14.25 13.2426 13.2426 14.25 12 14.25C10.7574 14.25 9.75 13.2426 9.75 12C9.75 10.7574 10.7574 9.75 12 9.75C13.2426 9.75 14.25 10.7574 14.25 12Z" fill="#0078D4"/>
          <path d="M22.5 6.75V17.25C22.5 18.4926 21.4926 19.5 20.25 19.5H3.75C2.50736 19.5 1.5 18.4926 1.5 17.25V6.75C1.5 5.50736 2.50736 4.5 3.75 4.5H20.25C21.4926 4.5 22.5 5.50736 22.5 6.75Z" stroke="#0078D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22.5 6.75L12 13.5L1.5 6.75" stroke="#0078D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14.25 12C14.25 13.2426 13.2426 14.25 12 14.25C10.7574 14.25 9.75 13.2426 9.75 12C9.75 10.7574 10.7574 9.75 12 9.75C13.2426 9.75 14.25 10.7574 14.25 12Z" fill="#0078D4"/>
        </svg>
      );
    default:
      return <Mail className={className} />;
  }
};

export const getSyncStatusIcon = (status: EmailAccount['syncStatus']) => {
  // Use Mail icon for all statuses with different colors
  switch (status) {
    case 'synced':
      return <Mail className="h-6 w-6 text-green-500" />;
    case 'syncing':
      return <Mail className="h-6 w-6 text-blue-500 animate-pulse" />;
    case 'error':
      return <Mail className="h-6 w-6 text-red-500" />;
    case 'disconnected':
      return <Mail className="h-6 w-6 text-gray-400" />;
    default:
      return <Mail className="h-6 w-6 text-gray-500" />;
  }
};

export const getSyncStatusBadge = (status: EmailAccount['syncStatus']) => {
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

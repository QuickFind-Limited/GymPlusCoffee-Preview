
import { useState, useEffect } from 'react';
import { EmailAccount } from '@/components/admin/communication/types';
import { useToast } from "@/hooks/use-toast";

interface ExcelFile {
  id: string;
  name: string;
  uploadDate: string;
  size: string;
  syncStatus: 'synced' | 'syncing' | 'error';
  lastSync?: string;
  syncProgress?: number;
}

const defaultExcelFiles: ExcelFile[] = [
  {
    id: '1',
    name: 'Supplier_Price_List_2024.xlsx',
    uploadDate: '2023-06-15',
    size: '2.3 MB',
    syncStatus: 'synced',
    lastSync: '2023-06-15 14:30'
  },
  {
    id: '2',
    name: 'Product_Catalog_Q2.xlsx',
    uploadDate: '2023-06-14',
    size: '5.1 MB',
    syncStatus: 'synced',
    lastSync: '2023-06-14 10:15'
  }
];

const defaultGmailAccounts: EmailAccount[] = [
  {
    id: '1',
    email: 'procurement@company.com',
    name: 'Main Procurement',
    syncStatus: 'synced',
    lastSync: new Date().toLocaleString(),
    autoSync: true,
    userTag: 'You (Head of Buying)',
    emailsProcessed: 1247,
    suppliersFound: 89,
    ordersTracked: 156
  },
  {
    id: '2',
    email: 'suppliers@company.com',
    name: 'Supplier Relations',
    syncStatus: 'synced',
    lastSync: new Date().toLocaleString(),
    syncProgress: 100,
    autoSync: true,
    userTag: 'Sarah Johnson (Procurement Manager)',
    emailsProcessed: 892,
    suppliersFound: 124,
    ordersTracked: 203
  },
  {
    id: '3',
    email: 'orders@company.com',
    name: 'Order Processing',
    syncStatus: 'synced',
    lastSync: new Date().toLocaleString(),
    autoSync: false,
    userTag: 'Michael Chen (Finance Approver)',
    emailsProcessed: 2341,
    suppliersFound: 67,
    ordersTracked: 445
  },
  {
    id: '4',
    email: 'john.smith@acme.com',
    name: 'Your Email Account',
    syncStatus: 'synced',
    lastSync: new Date().toLocaleString(),
    autoSync: true,
    userTag: 'You (Administrator)',
    emailsProcessed: 567,
    suppliersFound: 43,
    ordersTracked: 89
  }
];

const defaultOutlookAccounts: EmailAccount[] = [
  {
    id: '1',
    email: 'purchasing@company.com',
    name: 'Purchasing Department',
    syncStatus: 'synced',
    lastSync: new Date().toLocaleString(),
    autoSync: true,
    userTag: 'Emma Davis (Operations Buyer)',
    emailsProcessed: 1893,
    suppliersFound: 156,
    ordersTracked: 298
  },
  {
    id: '2',
    email: 'inventory@company.com',
    name: 'Inventory Control',
    syncStatus: 'synced',
    lastSync: new Date().toLocaleString(),
    autoSync: false,
    userTag: 'Robert Wilson (Sales Viewer)',
    emailsProcessed: 743,
    suppliersFound: 89,
    ordersTracked: 167
  }
];

export const useDataSources = () => {
  const { toast } = useToast();
  
  const [excelFiles, setExcelFiles] = useState<ExcelFile[]>(() => {
    const saved = localStorage.getItem('excelFiles');
    return saved ? JSON.parse(saved) : defaultExcelFiles;
  });

  const [gmailAccounts, setGmailAccounts] = useState<EmailAccount[]>(() => {
    const saved = localStorage.getItem('gmailAccounts');
    return saved ? JSON.parse(saved) : defaultGmailAccounts;
  });

  const [outlookAccounts, setOutlookAccounts] = useState<EmailAccount[]>(() => {
    const saved = localStorage.getItem('outlookAccounts');
    return saved ? JSON.parse(saved) : defaultOutlookAccounts;
  });

  useEffect(() => {
    localStorage.setItem('gmailAccounts', JSON.stringify(gmailAccounts));
  }, [gmailAccounts]);

  useEffect(() => {
    localStorage.setItem('outlookAccounts', JSON.stringify(outlookAccounts));
  }, [outlookAccounts]);

  useEffect(() => {
    localStorage.setItem('excelFiles', JSON.stringify(excelFiles));
  }, [excelFiles]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const newFile: ExcelFile = {
      id: `excel-${Date.now()}`,
      name: file.name,
      uploadDate: new Date().toISOString().split('T')[0],
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      syncStatus: 'syncing',
      syncProgress: 0
    };
    
    setExcelFiles(prev => [...prev, newFile]);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress <= 100) {
        setExcelFiles(prev => prev.map(f => 
          f.id === newFile.id ? { ...f, syncProgress: progress } : f
        ));
      }
      if (progress >= 100) {
        clearInterval(interval);
        setExcelFiles(prev => prev.map(f => 
          f.id === newFile.id ? {
            ...f,
            syncStatus: 'synced',
            lastSync: new Date().toLocaleString(),
            syncProgress: undefined
          } : f
        ));
        toast({
          title: "Upload Complete",
          description: `${file.name} has been uploaded and synced successfully`
        });
      }
    }, 200);
  };

  const handleExcelDelete = (id: string) => {
    setExcelFiles(prev => prev.filter(file => file.id !== id));
    toast({
      title: "File Deleted",
      description: "Excel file has been removed from data sources"
    });
  };

  return {
    excelFiles,
    gmailAccounts,
    outlookAccounts,
    setGmailAccounts,
    setOutlookAccounts,
    handleFileUpload,
    handleExcelDelete
  };
};

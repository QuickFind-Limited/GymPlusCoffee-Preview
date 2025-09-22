
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Upload, Plus, FileSpreadsheet, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useDataSources } from "@/hooks/useDataSources";
import ProviderContent from "@/components/admin/communication/ProviderContent";
import ERPContent from "@/components/admin/erp/ERPContent";
import { CommunicationProvider } from "@/components/admin/communication/types";

const DataSources = () => {
  const { toast } = useToast();
  const {
    excelFiles,
    gmailAccounts,
    outlookAccounts,
    setGmailAccounts,
    setOutlookAccounts,
    handleFileUpload,
    handleExcelDelete
  } = useDataSources();


  const handleSync = (provider: CommunicationProvider, id: string) => {
    const accounts = provider === 'gmail' ? gmailAccounts : outlookAccounts;
    const setAccounts = provider === 'gmail' ? setGmailAccounts : setOutlookAccounts;
    
    setAccounts(accounts.map(account => 
      account.id === id 
        ? { ...account, syncStatus: 'syncing', syncProgress: 0 }
        : account
    ));

    // Simulate realistic sync process with multiple stages
    let progress = 0;
    const stages = [
      { progress: 20, message: "Connecting to inbox..." },
      { progress: 40, message: "Scanning emails..." },
      { progress: 60, message: "Processing supplier data..." },
      { progress: 80, message: "Updating order information..." },
      { progress: 100, message: "Sync complete" }
    ];

    const interval = setInterval(() => {
      const currentStage = stages.find(stage => stage.progress > progress);
      if (currentStage) {
        progress = currentStage.progress;
        
        setAccounts(prevAccounts => prevAccounts.map(account => 
          account.id === id 
            ? { ...account, syncProgress: progress }
            : account
        ));
        
        if (progress >= 100) {
          clearInterval(interval);
          
          // Update with fresh sync data
          setAccounts(prevAccounts => prevAccounts.map(account => 
            account.id === id 
              ? { 
                  ...account, 
                  syncStatus: 'synced', 
                  lastSync: new Date().toLocaleString(),
                  syncProgress: undefined,
                  emailsProcessed: (account.emailsProcessed || 0) + Math.floor(Math.random() * 50) + 10,
                  suppliersFound: (account.suppliersFound || 0) + Math.floor(Math.random() * 5) + 1,
                  ordersTracked: (account.ordersTracked || 0) + Math.floor(Math.random() * 15) + 3
                }
              : account
          ));
          
          toast({
            title: "Sync Complete",
            description: `${provider} account synced successfully with latest inbox data`
          });
        }
      }
    }, 800);
  };

  const handleToggleAutoSync = (provider: CommunicationProvider, id: string) => {
    const accounts = provider === 'gmail' ? gmailAccounts : outlookAccounts;
    const setAccounts = provider === 'gmail' ? setGmailAccounts : setOutlookAccounts;
    
    setAccounts(accounts.map(account => 
      account.id === id 
        ? { ...account, autoSync: !account.autoSync }
        : account
    ));
  };

  const handleDelete = (provider: CommunicationProvider, id: string) => {
    const accounts = provider === 'gmail' ? gmailAccounts : outlookAccounts;
    const setAccounts = provider === 'gmail' ? setGmailAccounts : setOutlookAccounts;
    
    setAccounts(accounts.filter(account => account.id !== id));
    toast({
      title: "Account Removed",
      description: `${provider} account has been disconnected`
    });
  };

  const handleAddNewAccount = (email: string, provider?: CommunicationProvider) => {
    // Determine which provider to use
    const targetProvider = provider || 'gmail';
    const accounts = targetProvider === 'gmail' ? gmailAccounts : outlookAccounts;
    const setAccounts = targetProvider === 'gmail' ? setGmailAccounts : setOutlookAccounts;
    
    const newAccount = {
      id: `${targetProvider}-${Date.now()}`,
      email,
      name: email.split('@')[0],
      syncStatus: 'synced' as const,
      lastSync: new Date().toLocaleString(),
      autoSync: true,
      userTag: 'New Account'
    };
    
    setAccounts([...accounts, newAccount]);
    toast({
      title: "Account Connected",
      description: `${targetProvider} account has been connected successfully`
    });
  };

  // Backend Integration Point: handleSystemConnect expects system_type and config_data, returns Promise<ConnectionResponse>
  const handleSystemConnect = (systemName: string) => {
    toast({
      title: "Connection Initiated",
      description: `Connecting to ${systemName}...`
    });
    
    // TODO: Backend implementation
    // Expected API call: POST /api/integrations/systems/connect
    // Payload: { system_type: systemName.toLowerCase(), config: {...} }
  };

  const renderSystemsContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Shopify */}
        <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/lovable-uploads/4128ad40-65fc-4147-b37e-51d0b56c0396.png" 
                  alt="Shopify Logo" 
                  className="w-8 h-8 object-contain"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Shopify</h3>
                  <p className="text-sm text-gray-600">E-commerce platform</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Connect your Shopify store to sync products, orders, and inventory data.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleSystemConnect('Shopify')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Connect Shopify
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* NetSuite */}
        <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/lovable-uploads/83b9e7d6-23e4-4882-94fa-6f5c7d9ff588.png" 
                  alt="NetSuite Logo" 
                  className="w-8 h-8 object-contain"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">NetSuite</h3>
                  <p className="text-sm text-gray-600">ERP System</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Integrate with NetSuite ERP for comprehensive business data management.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleSystemConnect('NetSuite')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Connect NetSuite
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Odoo */}
        <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/lovable-uploads/ae208ce8-8fdd-4eab-b539-85fe81d9d824.png" 
                  alt="Odoo Logo" 
                  className="w-8 h-8 object-contain"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Odoo</h3>
                  <p className="text-sm text-gray-600">Business management suite</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Connect to Odoo for inventory management, accounting, and CRM integration.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleSystemConnect('Odoo')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Connect Odoo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Linnworks */}
        <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/lovable-uploads/135996b1-138e-44ce-98f0-b1cb0c7484cf.png" 
                  alt="Linnworks Logo" 
                  className="w-8 h-8 object-contain"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Linnworks</h3>
                  <p className="text-sm text-gray-600">Inventory management</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Integrate with Linnworks for inventory and order management.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleSystemConnect('Linnworks')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Connect Linnworks
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* XERO */}
        <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/lovable-uploads/82986474-0962-4f2d-94f3-3d422ded5949.png" 
                  alt="Xero Logo" 
                  className="w-8 h-8 object-contain"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">XERO</h3>
                  <p className="text-sm text-gray-600">Accounting software</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Connect XERO for financial data and invoice management.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleSystemConnect('XERO')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Connect XERO
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* SAP */}
        <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/lovable-uploads/2cca05cd-0aac-4d83-b4ff-abf30fcd5569.png" 
                  alt="SAP Logo" 
                  className="w-8 h-8 object-contain"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">SAP</h3>
                  <p className="text-sm text-gray-600">Enterprise resource planning</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Integrate with SAP systems for enterprise-level data synchronization.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleSystemConnect('SAP')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Connect SAP
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderExcelContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Excel Files</h3>
          <p className="text-gray-600 mt-1">Upload and manage Excel files for data import</p>
        </div>
        <div>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="excel-upload"
          />
          <label htmlFor="excel-upload">
            <Button variant="outline" className="cursor-pointer" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </span>
            </Button>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        {excelFiles.map(file => (
          <Card key={file.id} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">{file.name}</h4>
                    <p className="text-sm text-gray-600">
                      {file.size} • Uploaded {file.uploadDate}
                    </p>
                    {file.lastSync && (
                      <p className="text-xs text-gray-500">Last synced: {file.lastSync}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {file.syncStatus === 'syncing' && file.syncProgress !== undefined && (
                    <div className="text-sm text-blue-600">
                      Syncing... {file.syncProgress}%
                    </div>
                  )}
                  {file.syncStatus === 'synced' && (
                    <div className="text-sm text-green-600">Synced</div>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleExcelDelete(file.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {excelFiles.length === 0 && (
        <div className="border border-gray-200 rounded-lg p-12 text-center">
          <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-6" />
          <h3 className="text-lg font-medium text-gray-600 mb-3">No Excel files uploaded</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Upload Excel files to import supplier data, pricing, and inventory information
          </p>
          <label htmlFor="excel-upload">
            <Button variant="outline" className="cursor-pointer" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First File
              </span>
            </Button>
          </label>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Data Sources</h2>
        <p className="text-gray-600">Manage your data sources and integrations</p>
      </div>

      <Tabs defaultValue="systems" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="systems">Systems</TabsTrigger>
          <TabsTrigger value="files">Excel Files</TabsTrigger>
        </TabsList>

        <TabsContent value="systems">
          {renderSystemsContent()}
        </TabsContent>

        <TabsContent value="files">
          {renderExcelContent()}
        </TabsContent>
      </Tabs>

    </div>
  );
};

export default DataSources;

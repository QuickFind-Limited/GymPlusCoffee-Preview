import React, { useState } from 'react';
import { Check, Settings, RefreshCw, Database } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import NetSuiteConnectionFlow from '@/components/erp/NetSuiteConnectionFlow';
import { useToast } from "@/hooks/use-toast";

interface ERPIntegration {
  id: string;
  name: string;
  logo: string;
  status: 'connected' | 'disconnected' | 'syncing';
  lastSync?: string;
  description: string;
  dataTypes: string[];
}

const ERPContent = () => {
  const { toast } = useToast();
  const [showNetSuiteFlow, setShowNetSuiteFlow] = useState(false);
  const [erpIntegrations, setErpIntegrations] = useState<ERPIntegration[]>([
    {
      id: 'netsuite',
      name: 'Oracle NetSuite',
      logo: '/lovable-uploads/5e5d8252-fe38-4b94-b7b1-3d8a89600a54.png',
      status: 'connected',
      lastSync: '2023-06-15 13:45',
      description: 'Enterprise resource planning and business management',
      dataTypes: ['ERP Data', 'CRM Records', 'Financial Data', 'Supply Chain']
    },
    {
      id: 'sage',
      name: 'SAGE',
      logo: '/lovable-uploads/b1f95d2c-229f-4140-a1fc-ec4babf90d01.png',
      status: 'disconnected',
      description: 'Sync financial data, purchase orders, and supplier information',
      dataTypes: ['Purchase Orders', 'Supplier Data', 'Financial Records', 'Inventory']
    },
    {
      id: 'xero',
      name: 'XERO',
      logo: '/lovable-uploads/706d6769-061e-4b18-91ab-25c377db66f6.png',
      status: 'disconnected',
      description: 'Cloud-based accounting software integration',
      dataTypes: ['Accounting Data', 'Invoices', 'Expenses', 'Banking']
    }
  ]);

  const handleNetSuiteConnect = () => {
    setShowNetSuiteFlow(true);
  };

  const handleNetSuiteSuccess = () => {
    setErpIntegrations(prev => prev.map(erp => 
      erp.id === 'netsuite' 
        ? { ...erp, status: 'connected', lastSync: new Date().toLocaleString() }
        : erp
    ));
    toast({
      title: "NetSuite Connected",
      description: "Your NetSuite integration has been successfully configured"
    });
  };

  const handleSync = (id: string) => {
    const erpToSync = erpIntegrations.find(erp => erp.id === id);
    
    setErpIntegrations(prev => prev.map(erp => 
      erp.id === id 
        ? { ...erp, status: 'syncing' }
        : erp
    ));

    setTimeout(() => {
      setErpIntegrations(prev => prev.map(erp => 
        erp.id === id 
          ? { ...erp, status: 'connected', lastSync: new Date().toLocaleString() }
          : erp
      ));
      toast({
        title: "Sync Complete",
        description: `${erpToSync?.name || 'ERP'} data has been synchronized`
      });
    }, 3000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <Check className="h-3 w-3" />
            Connected
          </div>
        );
      case 'syncing':
        return (
          <div className="flex items-center gap-1 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Syncing
          </div>
        );
      default:
        return (
          <div className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
            Not Connected
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">ERP Systems</h3>
          <p className="text-gray-500 mt-1">Connect your enterprise resource planning systems</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {erpIntegrations.map(erp => (
          <Card key={erp.id} className="border border-gray-200 hover:border-gray-300 transition-colors">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center p-2">
                    <img 
                      src={erp.logo} 
                      alt={erp.name} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-medium text-gray-900">{erp.name}</CardTitle>
                  </div>
                </div>
                {getStatusBadge(erp.status)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">{erp.description}</p>
              
              {erp.status === 'connected' && erp.lastSync && (
                <p className="text-xs text-gray-400">Last synced: {erp.lastSync}</p>
              )}
              
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">Data Types</p>
                <div className="flex flex-wrap gap-1">
                  {erp.dataTypes.map(type => (
                    <span 
                      key={type} 
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                {erp.status === 'connected' ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-gray-600 hover:text-gray-800"
                      onClick={() => handleSync(erp.id)}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Sync
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-gray-600 hover:text-gray-800"
                    onClick={erp.id === 'netsuite' ? handleNetSuiteConnect : undefined}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state if no integrations */}
      {erpIntegrations.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-lg p-12 text-center">
          <Database className="h-12 w-12 text-gray-300 mx-auto mb-6" />
          <h3 className="text-lg font-medium text-gray-600 mb-3">No ERP integrations</h3>
          <p className="text-gray-400 mb-6 max-w-sm mx-auto">
            Connect your ERP systems to sync business data with Source
          </p>
          <Button variant="outline" className="text-gray-600 hover:text-gray-800">
            Browse Integrations
          </Button>
        </div>
      )}

      {/* NetSuite Connection Flow */}
      <NetSuiteConnectionFlow
        isOpen={showNetSuiteFlow}
        onClose={() => setShowNetSuiteFlow(false)}
        onSuccess={handleNetSuiteSuccess}
      />
    </div>
  );
};

export default ERPContent;

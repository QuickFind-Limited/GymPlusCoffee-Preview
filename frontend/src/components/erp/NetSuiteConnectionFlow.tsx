import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Database, Settings, AlertCircle, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NetSuiteConnectionFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NetSuiteConnectionFlow: React.FC<NetSuiteConnectionFlowProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'credentials' | 'testing' | 'configuring' | 'syncing' | 'complete'>('credentials');
  const [credentials, setCredentials] = useState({
    accountId: '',
    consumerKey: '',
    consumerSecret: '',
    tokenId: '',
    tokenSecret: ''
  });
  const [syncProgress, setSyncProgress] = useState(0);

  const handleConnect = () => {
    setStep('testing');
    
    setTimeout(() => {
      setStep('configuring');
    }, 2000);

    setTimeout(() => {
      setStep('syncing');
      // Simulate sync progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 15;
        setSyncProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setStep('complete');
          setTimeout(() => {
            onSuccess();
            onClose();
            setStep('credentials');
            setSyncProgress(0);
          }, 2000);
        }
      }, 800);
    }, 3000);
  };

  const renderCredentialsScreen = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-orange-50 rounded-full flex items-center justify-center">
          <img 
            src="/lovable-uploads/5e5d8252-fe38-4b94-b7b1-3d8a89600a54.png" 
            alt="NetSuite" 
            className="w-8 h-8 object-contain"
          />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect to NetSuite</h3>
        <p className="text-gray-600">Enter your NetSuite API credentials to establish connection</p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You'll need SuiteTalk API access enabled in your NetSuite account.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <Label htmlFor="accountId">Account ID</Label>
          <Input 
            id="accountId"
            placeholder="e.g., 12345678_SB1"
            value={credentials.accountId}
            onChange={(e) => setCredentials({...credentials, accountId: e.target.value})}
          />
        </div>
        
        <div>
          <Label htmlFor="consumerKey">Consumer Key</Label>
          <Input 
            id="consumerKey"
            placeholder="Enter your consumer key"
            value={credentials.consumerKey}
            onChange={(e) => setCredentials({...credentials, consumerKey: e.target.value})}
          />
        </div>
        
        <div>
          <Label htmlFor="consumerSecret">Consumer Secret</Label>
          <Input 
            id="consumerSecret"
            type="password"
            placeholder="Enter your consumer secret"
            value={credentials.consumerSecret}
            onChange={(e) => setCredentials({...credentials, consumerSecret: e.target.value})}
          />
        </div>
        
        <div>
          <Label htmlFor="tokenId">Token ID</Label>
          <Input 
            id="tokenId"
            placeholder="Enter your token ID"
            value={credentials.tokenId}
            onChange={(e) => setCredentials({...credentials, tokenId: e.target.value})}
          />
        </div>
        
        <div>
          <Label htmlFor="tokenSecret">Token Secret</Label>
          <Input 
            id="tokenSecret"
            type="password"
            placeholder="Enter your token secret"
            value={credentials.tokenSecret}
            onChange={(e) => setCredentials({...credentials, tokenSecret: e.target.value})}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handleConnect} 
          className="flex-1 bg-orange-600 hover:bg-orange-700"
          disabled={!credentials.accountId || !credentials.consumerKey}
        >
          <Database className="h-4 w-4 mr-2" />
          Connect to NetSuite
        </Button>
      </div>
    </div>
  );

  const renderTestingScreen = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto mb-4 bg-orange-50 rounded-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900">Testing Connection...</h3>
      <p className="text-gray-600">Validating your NetSuite credentials</p>
      <div className="space-y-2 text-sm text-gray-500">
        <p>✓ Authenticating with NetSuite servers</p>
        <p>✓ Verifying API permissions</p>
        <p className="animate-pulse">• Testing data access...</p>
      </div>
    </div>
  );

  const renderConfiguringScreen = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
        <Settings className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900">Configuring Integration...</h3>
      <p className="text-gray-600">Setting up data synchronization preferences</p>
      <div className="space-y-2 text-sm text-gray-500">
        <p>✓ Mapping NetSuite fields to Source schema</p>
        <p>✓ Configuring sync frequency</p>
        <p className="animate-pulse">• Setting up webhooks...</p>
      </div>
    </div>
  );

  const renderSyncingScreen = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Initial Data Sync</h3>
        <p className="text-gray-600">Importing your NetSuite data...</p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Sync Progress</span>
          <span>{syncProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${syncProgress}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-500">
        {syncProgress >= 20 && <p>✓ Suppliers and vendors (1,247 records)</p>}
        {syncProgress >= 40 && <p>✓ Items and inventory (3,891 records)</p>}
        {syncProgress >= 60 && <p>✓ Purchase orders (892 records)</p>}
        {syncProgress >= 80 && <p>✓ Financial data (2,156 records)</p>}
        {syncProgress < 100 && <p className="animate-pulse">• Customer records...</p>}
      </div>
    </div>
  );

  const renderCompleteScreen = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900">NetSuite Connected!</h3>
      <p className="text-gray-600">Your NetSuite data has been successfully synced with Source Procurement</p>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="font-medium text-green-900">8,186</div>
          <div className="text-green-700">Records Synced</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="font-medium text-blue-900">Live</div>
          <div className="text-blue-700">Connection Status</div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">NetSuite Connection Flow</DialogTitle>
        </DialogHeader>
        
        {step === 'credentials' && renderCredentialsScreen()}
        {step === 'testing' && renderTestingScreen()}
        {step === 'configuring' && renderConfiguringScreen()}
        {step === 'syncing' && renderSyncingScreen()}
        {step === 'complete' && renderCompleteScreen()}
      </DialogContent>
    </Dialog>
  );
};

export default NetSuiteConnectionFlow;
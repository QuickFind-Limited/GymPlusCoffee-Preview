import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Chrome, Shield, User, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface GoogleOAuthFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

const GoogleOAuthFlow: React.FC<GoogleOAuthFlowProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'consent' | 'authenticating' | 'permissions' | 'complete'>('consent');
  const [userEmail, setUserEmail] = useState('');

  const handleSignIn = () => {
    setStep('authenticating');
    
    setTimeout(() => {
      setStep('permissions');
      setUserEmail('john.doe@company.com');
    }, 2000);
  };

  const handleGrantPermissions = () => {
    setStep('complete');
    
    setTimeout(() => {
      onSuccess(userEmail);
      onClose();
      setStep('consent');
    }, 1500);
  };

  const renderConsentScreen = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
          <img 
            src="https://developers.google.com/identity/images/g-logo.png" 
            alt="Google" 
            className="w-8 h-8"
          />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign in with Google</h3>
        <p className="text-gray-600">Source Procurement wants to access your Google Account</p>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-700">Read your email messages and metadata</span>
        </div>
        <div className="flex items-center gap-3">
          <User className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-700">See your basic profile info</span>
        </div>
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-700">Manage your Gmail settings</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSignIn} className="flex-1 bg-blue-600 hover:bg-blue-700">
          <Chrome className="h-4 w-4 mr-2" />
          Continue with Google
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        By continuing, you allow this app to receive information from Google.
      </p>
    </div>
  );

  const renderAuthenticating = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900">Authenticating...</h3>
      <p className="text-gray-600">Connecting to your Google account</p>
    </div>
  );

  const renderPermissions = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome, {userEmail}</h3>
        <p className="text-gray-600">Grant access to sync your procurement emails</p>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-gray-900">Source Procurement will be able to:</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm text-gray-700">Read procurement-related emails</span>
          </div>
          <div className="flex items-center gap-3">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm text-gray-700">Access supplier communication threads</span>
          </div>
          <div className="flex items-center gap-3">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm text-gray-700">Sync order confirmations and invoices</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Deny
        </Button>
        <Button onClick={handleGrantPermissions} className="flex-1 bg-green-600 hover:bg-green-700">
          Allow Access
        </Button>
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900">Account Connected!</h3>
      <p className="text-gray-600">Your Google account has been successfully connected to Source Procurement</p>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Google OAuth Flow</DialogTitle>
        </DialogHeader>
        
        {step === 'consent' && renderConsentScreen()}
        {step === 'authenticating' && renderAuthenticating()}
        {step === 'permissions' && renderPermissions()}
        {step === 'complete' && renderComplete()}
      </DialogContent>
    </Dialog>
  );
};

export default GoogleOAuthFlow;
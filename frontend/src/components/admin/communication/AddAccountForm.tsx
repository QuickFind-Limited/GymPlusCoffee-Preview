
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CommunicationProvider } from './types';

interface AddAccountFormProps {
  provider: CommunicationProvider;
  onAddAccount: (email: string) => void;
  onCancel: () => void;
}

const AddAccountForm: React.FC<AddAccountFormProps> = ({ 
  provider, 
  onAddAccount, 
  onCancel 
}) => {
  const [newEmail, setNewEmail] = useState('');

  const handleSubmit = () => {
    onAddAccount(newEmail);
    setNewEmail('');
  };

  const getPlaceholder = () => {
    return 'Enter email address';
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Add New Account</CardTitle>
        <CardDescription>
          Connect a new {provider === 'gmail' ? 'Gmail' : 'Outlook'} account for procurement communication
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input 
            placeholder={getPlaceholder()} 
            value={newEmail} 
            onChange={(e) => setNewEmail(e.target.value)} 
            className="flex-1"
          />
          <Button onClick={handleSubmit}>Add Account</Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AddAccountForm;

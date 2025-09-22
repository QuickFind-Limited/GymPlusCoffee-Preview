
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SupplierFormState } from './types';
import { categories, riskLevelOptions, capitalizeFirstLetter } from './utils';

interface SupplierFormProps {
  newSupplier: SupplierFormState;
  setNewSupplier: (supplier: SupplierFormState) => void;
  handleUpdateSupplier: () => void;
  handleCancelEdit: () => void;
  isEditing: boolean;
}

const SupplierForm: React.FC<SupplierFormProps> = ({
  newSupplier,
  setNewSupplier,
  handleUpdateSupplier,
  handleCancelEdit,
  isEditing
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium mb-4">{isEditing ? 'Edit Supplier' : 'Add New Supplier'}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label htmlFor="name">Supplier Name*</Label>
          <Input
            id="name"
            value={newSupplier.name}
            onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
            placeholder="Enter supplier name"
          />
        </div>
        
        <div>
          <Label htmlFor="category">Category*</Label>
          <Select 
            value={newSupplier.category} 
            onValueChange={(value) => setNewSupplier({...newSupplier, category: value})}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="contact">Primary Contact*</Label>
          <Input
            id="contact"
            value={newSupplier.contact}
            onChange={(e) => setNewSupplier({...newSupplier, contact: e.target.value})}
            placeholder="Contact name"
          />
        </div>
        
        <div>
          <Label htmlFor="email">Email Address*</Label>
          <Input
            id="email"
            type="email"
            value={newSupplier.email}
            onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
            placeholder="contact@supplier.com"
          />
        </div>
        
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={newSupplier.phone}
            onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
            placeholder="(555) 123-4567"
          />
        </div>
        
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={newSupplier.location}
            onChange={(e) => setNewSupplier({...newSupplier, location: e.target.value})}
            placeholder="City, State"
          />
        </div>
        
        <div>
          <Label htmlFor="onboardingDate">Onboarding Date</Label>
          <Input
            id="onboardingDate"
            type="date"
            value={newSupplier.onboardingDate}
            onChange={(e) => setNewSupplier({...newSupplier, onboardingDate: e.target.value})}
          />
        </div>
        
        <div>
          <Label htmlFor="contractExpiry">Contract Expiry Date</Label>
          <Input
            id="contractExpiry"
            type="date"
            value={newSupplier.contractExpiry}
            onChange={(e) => setNewSupplier({...newSupplier, contractExpiry: e.target.value})}
          />
        </div>
        
        <div>
          <Label htmlFor="status">Status</Label>
          <Select 
            value={newSupplier.status} 
            onValueChange={(value) => setNewSupplier({...newSupplier, status: value})}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{capitalizeFirstLetter("active")}</SelectItem>
              <SelectItem value="inactive">{capitalizeFirstLetter("inactive")}</SelectItem>
              <SelectItem value="under review">{capitalizeFirstLetter("under review")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="riskLevel">Risk Level</Label>
          <Select 
            value={newSupplier.riskLevel} 
            onValueChange={(value) => setNewSupplier({...newSupplier, riskLevel: value})}
          >
            <SelectTrigger id="riskLevel">
              <SelectValue placeholder="Select risk level" />
            </SelectTrigger>
            <SelectContent>
              {riskLevelOptions.map(risk => (
                <SelectItem key={risk} value={risk}>{capitalizeFirstLetter(risk)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="performanceScore">Performance Score (0-100)</Label>
          <Input
            id="performanceScore"
            type="number"
            min="0"
            max="100"
            value={newSupplier.performanceScore}
            onChange={(e) => setNewSupplier({...newSupplier, performanceScore: parseInt(e.target.value) || 0})}
          />
        </div>
        
        <div>
          <Label htmlFor="spendYTD">Year-to-Date Spend ($)</Label>
          <Input
            id="spendYTD"
            type="number"
            min="0"
            value={newSupplier.spendYTD}
            onChange={(e) => setNewSupplier({...newSupplier, spendYTD: parseInt(e.target.value) || 0})}
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="outline" onClick={handleCancelEdit}>
          Cancel
        </Button>
        <Button 
          onClick={handleUpdateSupplier}
          disabled={!newSupplier.name || !newSupplier.category || !newSupplier.contact || !newSupplier.email}
        >
          {isEditing ? 'Update Supplier' : 'Add Supplier'}
        </Button>
      </div>
    </div>
  );
};

export default SupplierForm;

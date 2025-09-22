
import React from 'react';
import { FileText, Users, Mail, Building, Calendar, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Supplier } from './types';
import { formatDate, getRiskColor, getPerformanceColor, capitalizeFirstLetter, getContractStatus, formatCurrency } from './utils';

interface SupplierDetailProps {
  selectedSupplier: Supplier;
  handleEditSupplier: () => void;
  handleDeleteSupplier: (id: number) => void;
}

const SupplierDetail: React.FC<SupplierDetailProps> = ({
  selectedSupplier,
  handleEditSupplier,
  handleDeleteSupplier
}) => {
  const renderContractStatusContent = (supplier: Supplier) => {
    const contractStatus = supplier.status;
    
    switch (contractStatus) {
      case 'active':
        return (
          <span className="text-xl font-medium text-green-600">Active</span>
        );
      case 'inactive':
        return (
          <span className="text-xl font-medium text-gray-600">Inactive</span>
        );
      case 'under review':
        return (
          <span className="text-xl font-medium text-yellow-600">Under Review</span>
        );
      default:
        return (
          <span className="text-xl font-medium text-red-600">Expired</span>
        );
    }
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{selectedSupplier.name}</CardTitle>
              <CardDescription>{selectedSupplier.category}</CardDescription>
            </div>
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              selectedSupplier.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : selectedSupplier.status === 'inactive' 
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-yellow-100 text-yellow-800'
            }`}>
              {capitalizeFirstLetter(selectedSupplier.status)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Users className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium mr-2">Contact:</span>
                  <span>{selectedSupplier.contact}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium mr-2">Email:</span>
                  <span>{selectedSupplier.email}</span>
                </div>
                <div className="flex items-center text-sm">
                  <FileText className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium mr-2">Phone:</span>
                  <span>{selectedSupplier.phone}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Building className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium mr-2">Location:</span>
                  <span>{selectedSupplier.location}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Contract Details</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium mr-2">Onboarding Date:</span>
                  <span>{formatDate(selectedSupplier.onboardingDate)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium mr-2">Contract Expiry:</span>
                  <span>{formatDate(selectedSupplier.contractExpiry)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <AlertCircle className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium mr-2">Risk Level:</span>
                  <span className={getRiskColor(selectedSupplier.riskLevel)}>
                    {capitalizeFirstLetter(selectedSupplier.riskLevel)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {/* Edit details and Remove buttons removed */}
        </CardFooter>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Performance Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start">
            <span className={`text-2xl font-bold ${getPerformanceColor(selectedSupplier.performanceScore)}`}>
              {selectedSupplier.performanceScore}/100
            </span>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">YTD Spend</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start">
            <span className="text-2xl font-bold text-gray-800">
              {formatCurrency(selectedSupplier.spendYTD)}
            </span>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Contract Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start">
            {renderContractStatusContent(selectedSupplier)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupplierDetail;

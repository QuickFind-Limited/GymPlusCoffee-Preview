import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, FileText, Package, Truck, DollarSign, User, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SimplePurchaseOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderData: {
    supplier: string;
    products?: any[];
    totalEstimatedCost: string;
    urgency: string;
    action: string;
  } | null;
}

const SimplePurchaseOrderDialog = ({ isOpen, onOpenChange, orderData }: SimplePurchaseOrderDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    orderNumber: `PO-${Date.now().toString().slice(-6)}`,
    totalAmount: orderData?.totalEstimatedCost || '',
    deliveryDate: '',
    notes: '',
    approver: 'Sarah Johnson',
    department: 'Procurement'
  });

  const handleSubmit = () => {
    toast({
      title: "Purchase Order Generated",
      description: `PO-${formData.orderNumber} has been created and sent to ${orderData?.supplier}`,
    });
    
    onOpenChange(false);
    
    // Reset form for next use
    setFormData({
      orderNumber: `PO-${Date.now().toString().slice(-6)}`,
      totalAmount: '',
      deliveryDate: '',
      notes: '',
      approver: 'Sarah Johnson',
      department: 'Procurement'
    });
  };

  const handleSaveDraft = () => {
    toast({
      title: "Draft Saved",
      description: "Purchase order has been saved as draft",
    });
    onOpenChange(false);
  };

  if (!orderData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5" />
            Generate Purchase Order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Header */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Order Number</Label>
                <div className="font-mono text-lg">{formData.orderNumber}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Priority</Label>
                <Badge variant={orderData.urgency === 'Critical' ? 'destructive' : orderData.urgency === 'High' ? 'default' : 'secondary'}>
                  {orderData.urgency}
                </Badge>
              </div>
            </div>
          </div>

          {/* Supplier & Products Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="supplier" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Supplier
              </Label>
              <Input 
                id="supplier" 
                value={orderData.supplier} 
                readOnly 
                className="bg-gray-100 dark:bg-gray-800"
              />
            </div>
            
            {/* Products List */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4" />
                Products ({orderData.products?.length || 0} items)
              </Label>
              <div className="space-y-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {orderData.products?.map((product: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-white dark:bg-gray-600 rounded">
                        {product.icon}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {product.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {product.description}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {product.quantity}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.estimatedCost}
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-gray-500 py-4">
                    No products selected
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Details */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="deliveryDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Requested Delivery Date
                </Label>
                <Input 
                  id="deliveryDate" 
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input 
                  id="department" 
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="approver" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Approver
                </Label>
                <Input 
                  id="approver" 
                  value={formData.approver}
                  onChange={(e) => setFormData({...formData, approver: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="totalAmount" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Amount
                </Label>
                <Input 
                  id="totalAmount" 
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                  placeholder="$0.00"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Special Instructions / Notes</Label>
            <Textarea 
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Add any special instructions or notes for this order..."
              rows={4}
            />
          </div>

          {/* Order Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Order Summary
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span>Estimated Cost: {orderData.totalEstimatedCost}</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-600" />
                <span>Standard Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span>7-10 Business Days</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleSaveDraft}>
              Save as Draft
            </Button>
            <Button onClick={handleSubmit}>
              Generate Purchase Order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimplePurchaseOrderDialog;
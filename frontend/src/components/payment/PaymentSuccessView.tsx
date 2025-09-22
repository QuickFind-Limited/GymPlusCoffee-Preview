
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface PaymentSuccessViewProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  formatCurrency: (amount: number) => string;
}

const PaymentSuccessView = ({ isOpen, onOpenChange, totalAmount, formatCurrency }: PaymentSuccessViewProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 bg-white border-0 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Payment Successful</DialogTitle>
          <DialogDescription>Your payment has been processed successfully</DialogDescription>
        </DialogHeader>
        <div className="p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-scale-in">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div className="space-y-2 animate-fade-in">
            <h2 className="text-2xl font-semibold text-gray-900">Payment Successful!</h2>
            <p className="text-gray-600">All invoices have been paid successfully</p>
            <p className="text-lg font-medium text-gray-900">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="pt-4">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div className="bg-green-600 h-1 rounded-full animate-[slide-in-right_1s_ease-out]" style={{
                width: '100%'
              }}></div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentSuccessView;

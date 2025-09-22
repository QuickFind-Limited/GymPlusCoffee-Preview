
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface PaymentProcessingViewProps {
  isOpen: boolean;
}

const PaymentProcessingView = ({ isOpen }: PaymentProcessingViewProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md p-0 bg-white border-0 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Processing Payment</DialogTitle>
          <DialogDescription>Please wait while we process your payment</DialogDescription>
        </DialogHeader>
        <div className="p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">Processing Payment</h2>
            <p className="text-gray-600">Please wait while we process your bank transfer...</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentProcessingView;

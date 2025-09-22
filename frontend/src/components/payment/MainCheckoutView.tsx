
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import OrderSummarySection from './OrderSummarySection';
import PaymentFormSection from './PaymentFormSection';

interface Invoice {
  id: string;
  date: string;
  supplier: string;
  total: string;
  status: 'pending' | 'paid' | 'overdue' | 'processing' | 'approved';
  dueDate: string;
  amount: number;
}

interface MainCheckoutViewProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: Invoice[];
  onPayment: () => void;
  onIndividualInvoicePreview: (invoice: Invoice) => void;
  onShowDetailedPDF: () => void;
  getTodayDate: () => string;
  formatCurrency: (amount: number) => string;
  totalAmount: number;
  email: string;
  setEmail: (email: string) => void;
  shipToName: string;
  shipToAddress: string;
  isInvoiceExpanded: boolean;
  setIsInvoiceExpanded: (expanded: boolean) => void;
}

const MainCheckoutView = ({ 
  isOpen, 
  onOpenChange, 
  invoices, 
  onPayment, 
  onIndividualInvoicePreview, 
  onShowDetailedPDF, 
  getTodayDate, 
  formatCurrency, 
  totalAmount,
  email,
  setEmail,
  shipToName,
  shipToAddress,
  isInvoiceExpanded,
  setIsInvoiceExpanded
}: MainCheckoutViewProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 bg-white border-0 shadow-2xl overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Payment Checkout</DialogTitle>
          <DialogDescription>Complete your payment for selected invoices</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 h-auto">
          {/* Left Side - Order Summary */}
          <OrderSummarySection
            invoices={invoices}
            onIndividualInvoicePreview={onIndividualInvoicePreview}
            onShowDetailedPDF={onShowDetailedPDF}
            getTodayDate={getTodayDate}
            formatCurrency={formatCurrency}
            totalAmount={totalAmount}
            isInvoiceExpanded={isInvoiceExpanded}
            setIsInvoiceExpanded={setIsInvoiceExpanded}
          />

          {/* Right Side - Payment Form */}
          <PaymentFormSection
            onPayment={onPayment}
            formatCurrency={formatCurrency}
            totalAmount={totalAmount}
            email={email}
            setEmail={setEmail}
            shipToName={shipToName}
            shipToAddress={shipToAddress}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MainCheckoutView;

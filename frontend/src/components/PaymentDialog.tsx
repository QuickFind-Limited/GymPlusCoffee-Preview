
import React, { useState } from 'react';
import PaymentSuccessView from './payment/PaymentSuccessView';
import PaymentProcessingView from './payment/PaymentProcessingView';
import IndividualInvoiceView from './payment/IndividualInvoiceView';
import DetailedPDFView from './payment/DetailedPDFView';
import InvoicePreviewView from './payment/InvoicePreviewView';
import MainCheckoutView from './payment/MainCheckoutView';

interface Invoice {
  id: string;
  date: string;
  supplier: string;
  total: string;
  status: 'pending' | 'paid' | 'overdue' | 'processing' | 'approved';
  dueDate: string;
  amount: number;
}

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: Invoice[];
  onPaymentComplete: () => void;
}

const PaymentDialog = ({
  isOpen,
  onOpenChange,
  invoices,
  onPaymentComplete
}: PaymentDialogProps) => {
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [showDetailedPDF, setShowDetailedPDF] = useState(false);
  const [showIndividualInvoice, setShowIndividualInvoice] = useState(false);
  const [selectedIndividualInvoice, setSelectedIndividualInvoice] = useState<Invoice | null>(null);
  const [paymentStep, setPaymentStep] = useState<'checkout' | 'processing' | 'success'>('checkout');
  const [email, setEmail] = useState('jenny.rosen@example.com');
  const [isInvoiceExpanded, setIsInvoiceExpanded] = useState(false);
  const [shipToName] = useState('Jenny Rosen');
  const [shipToAddress] = useState('27 Fredrick Ave\nBrothers, OR 97712, US');

  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2
    })}`;
  };

  const handlePayment = () => {
    setPaymentStep('processing');
    setTimeout(() => {
      setPaymentStep('success');
      setTimeout(() => {
        onPaymentComplete();
        onOpenChange(false);
        setPaymentStep('checkout');
      }, 2000);
    }, 1500);
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleIndividualInvoicePreview = (invoice: Invoice) => {
    setSelectedIndividualInvoice(invoice);
    setShowIndividualInvoice(true);
  };

  const handleDownload = () => {
    // Simulate PDF download
    const link = document.createElement('a');
    link.href = '#'; // In a real app, this would be a PDF blob URL
    link.download = `invoice-collection-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show a toast or notification
    console.log('Downloading invoice collection PDF...');
  };

  // Individual Invoice Preview View
  if (showIndividualInvoice && selectedIndividualInvoice) {
    return (
      <IndividualInvoiceView
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        invoice={selectedIndividualInvoice}
        onBack={() => setShowIndividualInvoice(false)}
        onPayment={handlePayment}
        getTodayDate={getTodayDate}
        handleDownload={handleDownload}
      />
    );
  }

  // Payment Success View
  if (paymentStep === 'success') {
    return (
      <PaymentSuccessView
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        totalAmount={totalAmount}
        formatCurrency={formatCurrency}
      />
    );
  }

  // Payment Processing View
  if (paymentStep === 'processing') {
    return (
      <PaymentProcessingView isOpen={isOpen} />
    );
  }

  // Detailed PDF Preview View
  if (showDetailedPDF) {
    return (
      <DetailedPDFView
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        invoices={invoices}
        onBack={() => setShowDetailedPDF(false)}
        onPayment={handlePayment}
        onIndividualInvoicePreview={handleIndividualInvoicePreview}
        getTodayDate={getTodayDate}
        formatCurrency={formatCurrency}
        handleDownload={handleDownload}
        totalAmount={totalAmount}
      />
    );
  }

  // Invoice Preview View
  if (showInvoicePreview) {
    return (
      <InvoicePreviewView
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        invoices={invoices}
        onBack={() => setShowInvoicePreview(false)}
        onPayment={handlePayment}
        onIndividualInvoicePreview={handleIndividualInvoicePreview}
        getTodayDate={getTodayDate}
        formatCurrency={formatCurrency}
        handleDownload={handleDownload}
        totalAmount={totalAmount}
      />
    );
  }

  // Main Checkout View
  return (
    <MainCheckoutView
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      invoices={invoices}
      onPayment={handlePayment}
      onIndividualInvoicePreview={handleIndividualInvoicePreview}
      onShowDetailedPDF={() => setShowDetailedPDF(true)}
      getTodayDate={getTodayDate}
      formatCurrency={formatCurrency}
      totalAmount={totalAmount}
      email={email}
      setEmail={setEmail}
      shipToName={shipToName}
      shipToAddress={shipToAddress}
      isInvoiceExpanded={isInvoiceExpanded}
      setIsInvoiceExpanded={setIsInvoiceExpanded}
    />
  );
};

export default PaymentDialog;

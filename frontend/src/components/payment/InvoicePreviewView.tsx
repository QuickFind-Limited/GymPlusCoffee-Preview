
import React from 'react';
import { X, ArrowLeft, Download, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Invoice {
  id: string;
  date: string;
  supplier: string;
  total: string;
  status: 'pending' | 'paid' | 'overdue' | 'processing' | 'approved';
  dueDate: string;
  amount: number;
}

interface InvoicePreviewViewProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: Invoice[];
  onBack: () => void;
  onPayment: () => void;
  onIndividualInvoicePreview: (invoice: Invoice) => void;
  getTodayDate: () => string;
  formatCurrency: (amount: number) => string;
  handleDownload: () => void;
  totalAmount: number;
}

const InvoicePreviewView = ({ 
  isOpen, 
  onOpenChange, 
  invoices, 
  onBack, 
  onPayment, 
  onIndividualInvoicePreview, 
  getTodayDate, 
  formatCurrency, 
  handleDownload,
  totalAmount 
}: InvoicePreviewViewProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0 bg-white border-0 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Invoice Preview</DialogTitle>
          <DialogDescription>Preview of combined invoice for payment</DialogDescription>
        </DialogHeader>
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
          <Button variant="ghost" onClick={onBack} className="text-gray-600 hover:text-gray-800 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Payment
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="p-12 bg-white">
          {/* Minimalistic Header */}
          <div className="flex justify-between items-start mb-16 pb-8 border-b border-gray-100">
            <div className="space-y-1">
              <h1 className="text-3xl font-light text-black tracking-wide">Combined Invoice</h1>
              <p className="text-sm text-gray-500 font-light">Payment for {invoices.length} invoices</p>
              <p className="text-sm text-gray-500 font-light">{getTodayDate()}</p>
            </div>
            <div className="text-right space-y-1">
              <h2 className="text-lg font-light text-black">Avoca Ireland</h2>
              <p className="text-sm text-gray-500 font-light">Avoca Head Office</p>
              <p className="text-sm text-gray-500 font-light">Glencormick South, Kilmacanoge</p>
              <p className="text-sm text-gray-500 font-light">Co. Wicklow, A98 P6N4</p>
            </div>
          </div>

          {/* Suppliers Section */}
          <div className="mb-16">
            <h3 className="text-lg font-light text-black mb-8">Suppliers</h3>
            <div className="space-y-6">
              {invoices.map((invoice, index) => (
                <div key={invoice.id} className="flex justify-between items-start py-4 border-b border-gray-50 last:border-b-0">
                  <div className="flex-1 space-y-1">
                    <p className="text-base text-black font-light">{invoice.supplier}</p>
                    <p className="text-sm text-gray-500">Invoice #{invoice.id}</p>
                    <p className="text-sm text-gray-500">Due: {invoice.dueDate}</p>
                    {invoice.status === 'overdue' && <Badge className="bg-red-50 text-red-600 border-red-200 text-xs">Overdue</Badge>}
                  </div>
                  <div className="text-right space-y-1 flex items-center gap-3">
                    <div>
                      <p className="text-base text-black font-light">{invoice.total}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onIndividualInvoicePreview(invoice)} className="h-8 text-blue-600 hover:bg-blue-50">
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end mb-16">
            <div className="w-64 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-light">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-black">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-light">
                  <span className="text-gray-500">Processing Fee</span>
                  <span className="text-black">$0.00</span>
                </div>
              </div>
              <div className="flex justify-between text-lg font-light border-t border-gray-100 pt-4">
                <span className="text-black">Total</span>
                <span className="text-black">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Action */}
          <div className="text-center">
            <Button onClick={onPayment} className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 text-lg font-medium rounded-lg transition-all duration-200 hover:shadow-lg" size="lg">
              Process Payment - {formatCurrency(totalAmount)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoicePreviewView;


import React from 'react';
import { X, ArrowLeft, Download } from 'lucide-react';
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

interface DetailedPDFViewProps {
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

const DetailedPDFView = ({ 
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
}: DetailedPDFViewProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-0 bg-white border-0 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Detailed Invoice PDF</DialogTitle>
          <DialogDescription>Complete invoice details for all suppliers</DialogDescription>
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
        
        <div className="p-12 bg-white space-y-12">
          {/* PDF Header */}
          <div className="flex justify-between items-start pb-8 border-b border-gray-100">
            <div className="space-y-2">
              <h1 className="text-4xl font-light text-black tracking-wide">Total Invoice</h1>
              <p className="text-lg text-gray-500 font-light">Combined payment for {invoices.length} suppliers</p>
              <p className="text-sm text-gray-500 font-light">{getTodayDate()}</p>
            </div>
            <div className="text-right space-y-1">
              <h2 className="text-xl font-light text-black">Avoca Ireland</h2>
              <p className="text-sm text-gray-500 font-light">Avoca Head Office</p>
              <p className="text-sm text-gray-500 font-light">Glencormick South, Kilmacanoge</p>
              <p className="text-sm text-gray-500 font-light">Co. Wicklow, A98 P6N4</p>
            </div>
          </div>

          {/* Individual Supplier Invoices */}
          {invoices.map((invoice, index) => (
            <div key={invoice.id} className="border border-gray-200 rounded-lg p-8 space-y-6">
              <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-light text-black">{invoice.supplier}</h3>
                  <p className="text-sm text-gray-500">Invoice #{invoice.id}</p>
                  <p className="text-sm text-gray-500">Due: {invoice.dueDate}</p>
                  {invoice.status === 'overdue' && <Badge className="bg-red-50 text-red-600 border-red-200 text-xs">Overdue</Badge>}
                </div>
                <div className="text-right flex items-start gap-3">
                  <div>
                    <p className="text-2xl font-light text-black">{invoice.total}</p>
                    <p className="text-sm text-gray-500">Amount Due</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onIndividualInvoicePreview(invoice)}>
                    Details
                  </Button>
                </div>
              </div>
              
              {/* Mock invoice line items */}
              <div className="space-y-3">
                <h4 className="text-lg font-light text-black">Items</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Premium fabric materials</span>
                    <span className="text-black">${(invoice.amount * 0.7).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Processing & handling</span>
                    <span className="text-black">${(invoice.amount * 0.2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping & delivery</span>
                    <span className="text-black">${(invoice.amount * 0.1).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between text-lg font-light border-t border-gray-100 pt-4">
                <span className="text-black">Total</span>
                <span className="text-black">{invoice.total}</span>
              </div>
            </div>
          ))}

          {/* Grand Total */}
          <div className="bg-gray-50 p-8 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-light text-black">Grand Total</span>
              <span className="text-3xl font-light text-black">{formatCurrency(totalAmount)}</span>
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

export default DetailedPDFView;

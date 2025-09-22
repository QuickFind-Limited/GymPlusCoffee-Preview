
import React from 'react';
import { ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Invoice {
  id: string;
  date: string;
  supplier: string;
  total: string;
  status: 'pending' | 'paid' | 'overdue' | 'processing' | 'approved';
  dueDate: string;
  amount: number;
}

interface OrderSummarySectionProps {
  invoices: Invoice[];
  onIndividualInvoicePreview: (invoice: Invoice) => void;
  onShowDetailedPDF: () => void;
  getTodayDate: () => string;
  formatCurrency: (amount: number) => string;
  totalAmount: number;
  isInvoiceExpanded: boolean;
  setIsInvoiceExpanded: (expanded: boolean) => void;
}

const OrderSummarySection = ({
  invoices,
  onIndividualInvoicePreview,
  onShowDetailedPDF,
  getTodayDate,
  formatCurrency,
  totalAmount,
  isInvoiceExpanded,
  setIsInvoiceExpanded
}: OrderSummarySectionProps) => {
  return (
    <div className="bg-gray-50 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Order summary</h3>
      </div>
      
      {/* Enhanced Invoice Summary Card with Collapsible Details */}
      <Collapsible open={isInvoiceExpanded} onOpenChange={setIsInvoiceExpanded}>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-lg font-semibold text-gray-900">{formatCurrency(totalAmount)}</h4>
            <CollapsibleTrigger asChild>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                {isInvoiceExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </CollapsibleTrigger>
          </div>
          <p className="text-sm text-gray-500">Due {getTodayDate()}</p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">To</span>
              <span className="text-gray-900">Multiple Suppliers</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">From</span>
              <span className="text-gray-900">Avoca Ireland</span>
            </div>
          </div>
          
          <CollapsibleContent className="mt-4">
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <h5 className="text-sm font-medium text-gray-700">Suppliers ({invoices.length})</h5>
              {invoices.map(invoice => (
                <div key={invoice.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-b-0">
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium text-gray-900">{invoice.supplier}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">{invoice.id}</p>
                      {invoice.status === 'overdue' && <Badge className="bg-red-50 text-red-600 border-red-200 text-xs px-1 py-0">Overdue</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{invoice.total}</p>
                    <Button variant="ghost" size="sm" onClick={() => onIndividualInvoicePreview(invoice)} className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Business Information */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Business Information</h5>
                <div className="space-y-1">
                  <p className="text-sm text-gray-900 font-medium">Avoca Ireland</p>
                  <p className="text-xs text-gray-500">Avoca Head Office</p>
                  <p className="text-xs text-gray-500">Glencormick South, Kilmacanoge</p>
                  <p className="text-xs text-gray-500">Co. Wicklow, A98 P6N4</p>
                </div>
              </div>
            </div>
          </CollapsibleContent>
          
          <button onClick={onShowDetailedPDF} className="text-blue-600 text-sm mt-2 hover:underline">
            View invoice details →
          </button>
        </div>
      </Collapsible>

      <Separator />
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Source Fee</span>
          <span className="text-gray-900">$12.50</span>
        </div>
        <Separator />
        <div className="flex justify-between text-lg font-semibold">
          <span className="text-gray-900">Total</span>
          <span className="text-gray-900">{formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummarySection;

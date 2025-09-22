
import React from 'react';
import { ArrowLeft, Check, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

interface CombinedInvoicePaymentProps {
  invoices: Invoice[];
  onPaymentComplete: () => void;
  onBack: () => void;
}

const CombinedInvoicePayment = ({ invoices, onPaymentComplete, onBack }: CombinedInvoicePaymentProps) => {
  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const handlePayment = () => {
    // Simulate payment processing
    setTimeout(() => {
      onPaymentComplete();
    }, 1000);
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Combined Invoice Payment</h1>
          <p className="text-gray-600 mt-2">
            Processing payment for {invoices.length} invoices • {getTodayDate()}
          </p>
        </div>

        {/* Payment Summary Card */}
        <Card className="mb-8 border-2 border-blue-100">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {invoices.map((invoice, index) => (
                <div key={invoice.id}>
                  <div className="flex justify-between items-center py-3">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{invoice.supplier}</p>
                        <p className="text-sm text-gray-500">
                          {invoice.id} • Due: {invoice.dueDate}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{invoice.total}</p>
                      <Badge 
                        variant="outline" 
                        className={
                          invoice.status === 'overdue' 
                            ? 'bg-red-50 text-red-600 border-red-200' 
                            : 'bg-yellow-50 text-yellow-600 border-yellow-200'
                        }
                      >
                        {invoice.status === 'overdue' ? 'Overdue' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                  {index < invoices.length - 1 && <Separator />}
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            {/* Total */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Payment will be processed immediately for all {invoices.length} invoices
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Action */}
        <div className="text-center">
          <Button
            onClick={handlePayment}
            className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            <Check className="h-5 w-5 mr-2" />
            Process Payment - {formatCurrency(totalAmount)}
          </Button>
          <p className="text-sm text-gray-500 mt-3">
            Your payment will be processed securely. All invoices will be marked as paid.
          </p>
        </div>

        {/* Payment Details */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Payment Method</h4>
                <p className="text-gray-600">Company Default Payment Method</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Processing Time</h4>
                <p className="text-gray-600">Immediate processing</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Confirmation</h4>
                <p className="text-gray-600">Email confirmation will be sent</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Invoice Updates</h4>
                <p className="text-gray-600">All invoices will be marked as paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CombinedInvoicePayment;

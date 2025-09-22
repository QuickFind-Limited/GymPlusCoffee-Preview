import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PaymentFormSectionProps {
  onPayment: () => void;
  formatCurrency: (amount: number) => string;
  totalAmount: number;
  email: string;
  setEmail: (email: string) => void;
  shipToName: string;
  shipToAddress: string;
}

const PaymentFormSection = ({
  onPayment,
  formatCurrency,
  totalAmount,
  email,
  setEmail,
  shipToName,
  shipToAddress
}: PaymentFormSectionProps) => {
  return (
    <div className="p-8 pb-12 space-y-4">
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Payment</h2>
      </div>

      {/* Combined Payment Form - Stripe Style */}
      <div className="space-y-3">
        {/* Combined Form Fields */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Email Field */}
          <div className="border-b border-gray-200 last:border-b-0">
            <div className="flex">
              <div className="w-20 px-3 py-3 bg-gray-50 border-r border-gray-200 flex items-center">
                <span className="text-sm text-gray-500">Email</span>
              </div>
              <div className="flex-1">
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none h-12" placeholder="jenny.rosen@example.com" />
              </div>
            </div>
          </div>

          {/* Ship to Field */}
          <div className="border-b border-gray-200 last:border-b-0">
            <div className="flex">
              <div className="w-20 px-3 py-3 bg-gray-50 border-r border-gray-200 flex items-center">
                <span className="text-sm text-gray-500">Ship to</span>
              </div>
              <div className="flex-1 p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{shipToName}</p>
                    <p className="text-sm text-gray-500 whitespace-pre-line">{shipToAddress}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400 ml-2 mt-1" />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Field */}
          <div className="border-b border-gray-200 last:border-b-0">
            <div className="flex">
              <div className="w-20 px-3 py-3 bg-gray-50 border-r border-gray-200 flex items-center">
                <span className="text-sm text-gray-500">Pay with</span>
              </div>
              <div className="flex-1 p-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-5 bg-blue-600 text-white rounded text-xs flex items-center justify-center font-bold">
                      VISA
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">••••</span>
                      <span className="text-gray-900">4242</span>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Button */}
      <Button onClick={onPayment} size="lg" className="w-full py-4 text-lg font-bold rounded-md transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105">
        Pay {formatCurrency(totalAmount)}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        By proceeding, you agree to process payment for all selected invoices via bank transfer.
      </p>
    </div>
  );
};

export default PaymentFormSection;

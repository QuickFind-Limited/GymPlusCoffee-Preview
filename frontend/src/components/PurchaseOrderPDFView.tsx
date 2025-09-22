import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Building2, Mail, Calendar, Package, Download, Send, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generatePDFFromElement, printElement } from '@/utils/pdfGenerator';

interface PurchaseOrderPDFViewProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderData: {
    supplier: string;
    products: any[];
    totalEstimatedCost: string;
    urgency: string;
    action: string;
  } | null;
}

const PurchaseOrderPDFView = ({ isOpen, onOpenChange, orderData }: PurchaseOrderPDFViewProps) => {
  const { toast } = useToast();

  if (!orderData) return null;

  const getTodayDate = () => {
    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleString('en-GB', { month: 'short' });
    return `${day} ${month} 2025`;
  };

  const generatePONumber = () => `PO-${Date.now().toString().slice(-6)}`;
  const generateSKU = () => `PF${Math.floor(Math.random() * 9000000) + 1000000}`;

  const getSupplierEmail = (supplier: string) => {
    const emailMap: { [key: string]: string } = {
      'Impala': 'orders@impala-supply.com',
      'Bran Marion': 'purchasing@branmarion.co.uk',
      'Comme Avant': 'sales@commeavant.fr',
      'Stellar Goods': 'orders@stellargoods.com',
      'Nova Brands': 'sales@novabrands.com',
      'Echo Supply': 'purchasing@echosupply.com'
    };
    return emailMap[supplier] || 'contact@supplier.com';
  };

  const getSupplierAddress = (supplier: string) => {
    const addressMap: { [key: string]: string } = {
      'Impala': '123 Commerce Street, London, SW1A 1AA',
      'Bran Marion': '456 Industrial Park, Manchester, M1 2AB',
      'Comme Avant': '789 Rue de la Paix, Paris, 75001',
      'Stellar Goods': '321 Business Ave, Birmingham, B1 3CD',
      'Nova Brands': '654 Innovation Drive, Leeds, LS1 4EF',
      'Echo Supply': '987 Supply Chain Blvd, Glasgow, G1 5GH'
    };
    return addressMap[supplier] || '123 Business Street, City, POST CODE';
  };

  const calculateTotals = () => {
    const subtotal = orderData.products.reduce((sum, product) => {
      const unitPrice = parseFloat(product.price.replace('$', ''));
      return sum + (unitPrice * product.suggestedQty);
    }, 0);
    
    const taxRate = 0.2; // 20% VAT
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateTotals();

  const handleSendPO = () => {
    toast({
      title: "Purchase Order Sent",
      description: `PO has been sent to ${orderData.supplier} at ${getSupplierEmail(orderData.supplier)}`,
    });
    onOpenChange(false);
  };

  const handleDownloadPDF = async () => {
    try {
      const filename = `PO-${generatePONumber()}-${orderData.supplier.replace(/\s+/g, '_')}.pdf`;
      await generatePDFFromElement('pdf-purchase-order-content', filename);
      toast({
        title: "PDF Downloaded",
        description: `Purchase order saved as ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    printElement('pdf-purchase-order-content');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-xl">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Purchase Order Preview
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div id="pdf-purchase-order-content" className="bg-white border border-gray-200 rounded-lg p-8 mx-auto max-w-4xl shadow-lg">
          {/* Header - Linnworks Style */}
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-2">
              <div className="text-lg font-medium text-black">Your Company Ltd</div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>123 Business Avenue</div>
                <div>London, UK SW1A 1AA</div>
                <div>United Kingdom</div>
                <div className="mt-2">Tel: +44 20 1234 5678</div>
                <div>Email: purchasing@yourcompany.com</div>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-black mb-4">Purchase Order</h1>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Date:</span>
                  <div className="font-medium">{getTodayDate()}</div>
                </div>
                <div>
                  <span className="text-gray-600">PO No:</span>
                  <div className="font-medium">{generatePONumber()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Ref:</span>
                  <div className="font-medium">PO/{generatePONumber().slice(-6)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Three Box Layout - Supplier, Deliver To, Quoted Delivery Date */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Supplier Box */}
            <div className="border-2 border-gray-300">
              <div className="bg-gray-200 px-4 py-2 font-semibold text-black text-sm">
                Supplier
              </div>
              <div className="p-4 space-y-2">
                <div className="font-medium text-black">{orderData.supplier}</div>
                <div className="text-sm text-gray-600">{getSupplierAddress(orderData.supplier)}</div>
                <div className="text-sm text-gray-600 mt-3">{getSupplierEmail(orderData.supplier)}</div>
              </div>
            </div>

            {/* Deliver To Box */}
            <div className="border-2 border-gray-300">
              <div className="bg-gray-200 px-4 py-2 font-semibold text-black text-sm">
                Deliver To
              </div>
              <div className="p-4 space-y-2">
                <div className="font-medium text-black">Your Warehouse</div>
                <div className="text-sm text-gray-600">Unit 5</div>
                <div className="text-sm text-gray-600">Technology Park</div>
                <div className="text-sm text-gray-600">Reading</div>
                <div className="text-sm text-gray-600">RG41 2AD</div>
                <div className="text-sm text-gray-600 mt-3">warehouse@yourcompany.com</div>
              </div>
            </div>

            {/* Quoted Delivery Date Box */}
            <div className="border-2 border-gray-300">
              <div className="bg-gray-200 px-4 py-2 font-semibold text-black text-sm">
                Quoted Delivery Date
              </div>
              <div className="p-4">
                <div className="text-lg font-medium text-black mb-3">
                  {new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: '2-digit' 
                  })}
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Terms:</span>
                    <div>Cash on delivery - 2.5%</div>
                  </div>
                  <div>
                    <span className="font-medium">Payment Terms:</span>
                    <div>Payment Value £{total.toFixed(0)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products table - Linnworks Style */}
          <div className="mb-8">
            <table className="w-full border-collapse border-2 border-gray-400">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-400 px-3 py-2 text-left font-semibold text-black text-sm">SKU</th>
                  <th className="border border-gray-400 px-3 py-2 text-left font-semibold text-black text-sm">Supplier Code</th>
                  <th className="border border-gray-400 px-3 py-2 text-left font-semibold text-black text-sm">Item Title</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-semibold text-black text-sm">Quantity</th>
                  <th className="border border-gray-400 px-3 py-2 text-right font-semibold text-black text-sm">Unit Cost</th>
                  <th className="border border-gray-400 px-3 py-2 text-right font-semibold text-black text-sm">Cost</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-semibold text-black text-sm">Tax Rate</th>
                  <th className="border border-gray-400 px-3 py-2 text-right font-semibold text-black text-sm">Tax</th>
                </tr>
              </thead>
              <tbody>
                {orderData.products.map((product, index) => {
                  const unitPrice = parseFloat(product.price.replace('$', ''));
                  const taxRate = product.taxRate || 20; // Default 20% VAT
                  const lineSubtotal = unitPrice * product.suggestedQty;
                  const taxAmount = lineSubtotal * (taxRate / 100);
                  
                  return (
                    <tr key={index} className="bg-white border-b border-gray-400">
                      <td className="border border-gray-400 px-3 py-2 text-black text-sm font-mono">
                        PF{(index + 1).toString().padStart(7, '0')}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-black text-sm">
                        {product.supplierCode || `SUP${(index + 1).toString().padStart(3, '0')}`}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-black text-sm">
                        {product.name}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-center text-black text-sm">
                        {product.suggestedQty}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-right text-black text-sm">
                        £{unitPrice.toFixed(2)}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-right text-black text-sm">
                        £{lineSubtotal.toFixed(2)}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-center text-black text-sm">
                        {taxRate}%
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-right text-black text-sm">
                        £{taxAmount.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals - Linnworks Style */}
          <div className="flex justify-end mb-8">
            <div className="w-80 space-y-3">
              <div className="border-t-2 border-gray-400 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-black">Terms Total Excl:</span>
                  <span className="text-black">£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-black">Shipping Tax Rate:</span>
                  <span className="text-black">20.00%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-black">Shipping Tax Amount:</span>
                  <span className="text-black">£{(tax * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-300 pt-2">
                  <span className="font-bold text-black">TOTAL:</span>
                  <span className="font-bold text-black">£{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-300 pt-4 text-xs text-gray-500">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="font-medium mb-1">Terms & Conditions:</div>
                <div>Payment due within 30 days. Late payments subject to 1.5% monthly charge.</div>
              </div>
              <div>
                <div className="font-medium mb-1">Questions?</div>
                <div>Contact: purchasing@yourcompany.com | +44 20 1234 5678</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={handleSendPO}>
            <Send className="h-4 w-4 mr-2" />
            Send to Supplier
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseOrderPDFView;
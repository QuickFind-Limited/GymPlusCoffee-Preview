
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Printer } from "lucide-react";
import { generatePDFFromElement, printElement } from "@/utils/pdfGenerator";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: number;
  image: string;
  name: string;
  price: string;
  quantity: number;
  total: string;
  supplier?: string;
  orderNumber?: string;
  supplierCode?: string;
  barcode?: string;
  taxRate?: number;
  taxAmount?: number;
}

interface PurchaseOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: string;
  orderNumber: string;
  items: OrderItem[];
}

const PurchaseOrderDialog = ({ isOpen, onClose, supplier, orderNumber, items }: PurchaseOrderDialogProps) => {
  const { toast } = useToast();
  
  // Editable state
  const [editableData, setEditableData] = useState({
    supplier,
    orderNumber,
    paymentTerms: 'Net 30',
    companyName: 'Avoca',
    companyAddress: 'Level 2, 696 Bourke Street',
    companyCity: 'Melbourne VIC 3000',
    companyCountry: 'Australia',
    companyPhone: '+61 3 9123 4567',
    companyEmail: 'purchasing@avoca.com.au',
    warehouseName: 'Avoca Warehouse',
    deliveryTerms: 'Expected within 5-7 business days of order confirmation',
    shippingTerms: 'FOB destination, freight prepaid',
    taxRate: 8
  });

  // Calculate totals for the supplier's items
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = parseFloat(item.total.replace('$', '').replace(',', ''));
    return sum + itemTotal;
  }, 0);
  
  const tax = subtotal * 0.08; // 8% tax
  const grandTotal = subtotal + tax;

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const getTodayDate = () => {
    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleString('en-GB', { month: 'short' });
    return `${day} ${month} 2025`;
  };

  // Get supplier address based on supplier name
  const getSupplierAddress = (supplierName: string) => {
    const addresses: { [key: string]: string[] } = {
      'Impala': ['456 Fashion Ave', 'New York, NY 10018', 'United States'],
      'Bran Marion': ['78 Regent Street', 'London W1B 5AH', 'United Kingdom'],
      'Comme Avant': ['12 Rue de Rivoli', '75001 Paris', 'France'],
      'Stellar Goods': ['890 Commerce Blvd', 'Los Angeles, CA 90012', 'United States'],
      'Nova Brands': ['321 Industrial Way', 'Chicago, IL 60607', 'United States'],
      'Echo Supply': ['654 Business Park Dr', 'Seattle, WA 98101', 'United States']
    };
    return addresses[supplierName] || ['123 Supplier Street', 'City, State 12345', 'Country'];
  };

  const supplierAddress = getSupplierAddress(editableData.supplier);

  // Editable field component
  const EditableField = ({ 
    value, 
    onSave, 
    className = "", 
    type = "text",
    multiline = false 
  }: { 
    value: string; 
    onSave: (newValue: string) => void; 
    className?: string;
    type?: string;
    multiline?: boolean;
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    const handleSave = () => {
      onSave(tempValue);
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !multiline) {
        handleSave();
      } else if (e.key === 'Escape') {
        setTempValue(value);
        setIsEditing(false);
      }
    };

    if (isEditing) {
      return (
        <span
          contentEditable
          suppressContentEditableWarning
          className={`${className} outline-none bg-transparent cursor-text`}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          onInput={(e) => setTempValue(e.currentTarget.textContent || '')}
          ref={(el) => {
            if (el) {
              el.textContent = tempValue;
              el.focus();
              // Select all text
              const range = document.createRange();
              range.selectNodeContents(el);
              const selection = window.getSelection();
              selection?.removeAllRanges();
              selection?.addRange(range);
            }
          }}
        />
      );
    }

    return (
      <span
        className={`${className} cursor-pointer relative group transition-all duration-200 hover:bg-blue-50/50 hover:shadow-sm rounded px-1 py-0.5 inline-block`}
        onClick={() => {
          setTempValue(value);
          setIsEditing(true);
        }}
      >
        {value}
        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Click to edit
        </span>
      </span>
    );
  };

  const updateField = (field: string, value: string) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
  };

  const handleDownloadPDF = async () => {
    try {
      const filename = `PO-${editableData.orderNumber}-${editableData.supplier.replace(/\s+/g, '_')}.pdf`;
      await generatePDFFromElement('purchase-order-content', filename);
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
    printElement('purchase-order-content');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Purchase Order - {orderNumber}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div id="purchase-order-content" className="bg-white p-12 min-h-[80vh]">
          {/* Professional Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-2">
              <div className="text-lg font-medium text-black">
                <EditableField 
                  value={editableData.companyName} 
                  onSave={(value) => updateField('companyName', value)}
                  className="text-lg font-medium text-black"
                />
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <EditableField 
                    value={editableData.companyAddress} 
                    onSave={(value) => updateField('companyAddress', value)}
                    className="text-sm text-gray-600"
                  />
                </p>
                <p>
                  <EditableField 
                    value={editableData.companyCity} 
                    onSave={(value) => updateField('companyCity', value)}
                    className="text-sm text-gray-600"
                  />
                </p>
                <p>
                  <EditableField 
                    value={editableData.companyCountry} 
                    onSave={(value) => updateField('companyCountry', value)}
                    className="text-sm text-gray-600"
                  />
                </p>
                <p className="mt-2">
                  Tel: <EditableField 
                    value={editableData.companyPhone} 
                    onSave={(value) => updateField('companyPhone', value)}
                    className="text-sm text-gray-600"
                  />
                </p>
                <p>
                  Email: <EditableField 
                    value={editableData.companyEmail} 
                    onSave={(value) => updateField('companyEmail', value)}
                    className="text-sm text-gray-600"
                    type="email"
                  />
                </p>
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
                  <div className="font-medium">
                    <EditableField 
                      value={editableData.orderNumber} 
                      onSave={(value) => updateField('orderNumber', value)}
                      className="font-medium text-black"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Ref:</span>
                  <div className="font-medium">PO/{editableData.orderNumber.slice(-6)}</div>
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
                <div className="font-medium text-black">
                  <EditableField 
                    value={editableData.supplier} 
                    onSave={(value) => updateField('supplier', value)}
                    className="font-medium text-black"
                  />
                </div>
                {supplierAddress.map((line, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    <EditableField 
                      value={line} 
                      onSave={(value) => {
                        // Address updated
                      }}
                      className="text-sm text-gray-600"
                    />
                  </div>
                ))}
                <div className="text-sm text-gray-600 mt-3">
                  <EditableField 
                    value={`orders@${editableData.supplier.toLowerCase().replace(/\s+/g, '')}.com`} 
                    onSave={(value) => {
                      // Supplier email updated
                    }}
                    className="text-sm text-gray-600"
                    type="email"
                  />
                </div>
              </div>
            </div>

            {/* Deliver To Box */}
            <div className="border-2 border-gray-300">
              <div className="bg-gray-200 px-4 py-2 font-semibold text-black text-sm">
                Deliver To
              </div>
              <div className="p-4 space-y-2">
                <div className="font-medium text-black">
                  <EditableField 
                    value={editableData.warehouseName} 
                    onSave={(value) => updateField('warehouseName', value)}
                    className="font-medium text-black"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <EditableField 
                    value={editableData.companyAddress} 
                    onSave={(value) => updateField('companyAddress', value)}
                    className="text-sm text-gray-600"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <EditableField 
                    value={editableData.companyCity} 
                    onSave={(value) => updateField('companyCity', value)}
                    className="text-sm text-gray-600"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <EditableField 
                    value={editableData.companyCountry} 
                    onSave={(value) => updateField('companyCountry', value)}
                    className="text-sm text-gray-600"
                  />
                </div>
                <div className="text-sm text-gray-600 mt-3">
                  <EditableField 
                    value={editableData.companyEmail} 
                    onSave={(value) => updateField('companyEmail', value)}
                    className="text-sm text-gray-600"
                    type="email"
                  />
                </div>
              </div>
            </div>

            {/* Quoted Delivery Date Box */}
            <div className="border-2 border-gray-300">
              <div className="bg-gray-200 px-4 py-2 font-semibold text-black text-sm">
                Quoted Delivery Date
              </div>
              <div className="p-4">
                <div className="text-lg font-medium text-black mb-3">
                  {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: '2-digit' 
                  })}
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Terms:</span>
                    <div>
                      <EditableField 
                        value="Cash on delivery - 2.5%" 
                        onSave={(value) => updateField('deliveryTermsDetail', value)}
                        className="text-sm text-gray-600"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Payment Terms:</span>
                    <div>
                      <EditableField 
                        value="Payment Value £10000" 
                        onSave={(value) => updateField('paymentValue', value)}
                        className="text-sm text-gray-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table - Linnworks Style */}
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
                {items.map((item, index) => {
                  const unitPrice = parseFloat(item.price.replace('$', '').replace(',', ''));
                  const taxRate = item.taxRate || 20; // Default 20% if not specified
                  const lineSubtotal = unitPrice * item.quantity;
                  const taxAmount = lineSubtotal * (taxRate / 100);
                  
                  return (
                    <tr key={item.id} className="bg-white border-b border-gray-400">
                      <td className="border border-gray-400 px-3 py-2 text-black text-sm font-mono">
                        PF{item.id.toString().padStart(7, '0')}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-black text-sm">
                        <EditableField 
                          value={item.supplierCode || `SUP${item.id.toString().padStart(3, '0')}`} 
                          onSave={(value) => { /* Supplier code updated */ }}
                          className="text-black text-sm"
                        />
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-black text-sm">
                        {item.name}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-center text-black text-sm">
                        {item.quantity}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-right text-black text-sm">
                        £{unitPrice.toFixed(2)}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-right text-black text-sm">
                        £{lineSubtotal.toFixed(2)}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-center text-black text-sm">
                        <EditableField 
                          value={taxRate.toString()} 
                          onSave={(value) => { /* Tax rate updated */ }}
                          className="text-center text-black text-sm"
                          type="number"
                        />
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

          {/* Totals Section - Right Aligned */}
          <div className="flex justify-end mb-12">
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
                  <span className="font-bold text-black">£{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="pt-8 border-t-2 border-gray-300">
            <h3 className="text-lg font-bold text-black mb-4">TERMS AND CONDITIONS</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                <strong>Payment Terms:</strong> <EditableField 
                  value="Net 30 days from invoice date" 
                  onSave={(value) => updateField('paymentTermsDetail', value)}
                  className="text-sm text-gray-700"
                />
              </p>
              <p>
                <strong>Delivery:</strong> <EditableField 
                  value={editableData.deliveryTerms} 
                  onSave={(value) => updateField('deliveryTerms', value)}
                  className="text-sm text-gray-700"
                />
              </p>
              <p>
                <strong>Shipping:</strong> <EditableField 
                  value={editableData.shippingTerms} 
                  onSave={(value) => updateField('shippingTerms', value)}
                  className="text-sm text-gray-700"
                />
              </p>
              <p>
                <strong>Quality:</strong> <EditableField 
                  value="All items must meet agreed specifications and quality standards" 
                  onSave={(value) => updateField('qualityTerms', value)}
                  className="text-sm text-gray-700"
                />
              </p>
              <p>
                <strong>Returns:</strong> <EditableField 
                  value="Defective items may be returned within 30 days with prior authorization" 
                  onSave={(value) => updateField('returnTerms', value)}
                  className="text-sm text-gray-700"
                />
              </p>
              <p>
                <strong>Invoice Requirements:</strong> <EditableField 
                  value={`Please include PO number ${editableData.orderNumber} on all invoices and correspondence`} 
                  onSave={(value) => updateField('invoiceRequirements', value)}
                  className="text-sm text-gray-700"
                />
              </p>
            </div>
          </div>

          {/* Authorization */}
          <div className="pt-8 mt-8 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-12">
              <div>
                <p className="text-sm font-medium text-black mb-2">Authorized By:</p>
                <div className="border-b border-gray-400 w-48 mb-2"></div>
                <p className="text-xs text-gray-600">Purchasing Manager</p>
                <p className="text-xs text-gray-600">Avoca</p>
              </div>
              <div>
                <p className="text-sm font-medium text-black mb-2">Date:</p>
                <div className="border-b border-gray-400 w-32 mb-2"></div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseOrderDialog;

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar, CheckCircle, Clock, Package, X, FileText, Download, Check, Mail } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/dashboard/AppSidebar";
import Header from "@/components/dashboard/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface Invoice {
  id: string;
  date: string;
  supplier: string;
  total: string;
  status: 'pending' | 'paid' | 'overdue' | 'processing' | 'approved';
  dueDate: string;
  amount: number;
}

const Invoices = () => {
  const location = useLocation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [showSplitView, setShowSplitView] = useState(false);
  const { toast } = useToast();

  // Sample invoice data with amount field for calculations
  const sampleInvoices: Invoice[] = [
    {
      id: "INV-2025-001",
      date: "5 Jun 2025",
      supplier: "Impala",
      total: "$2,840.50",
      status: "pending",
      dueDate: "20 Jun 2025",
      amount: 2840.50
    },
    {
      id: "INV-2025-002",
      date: "4 Jun 2025",
      supplier: "Comme Avant",
      total: "$1,950.25",
      status: "pending",
      dueDate: "19 Jun 2025",
      amount: 1950.25
    },
    {
      id: "INV-2025-003",
      date: "3 Jun 2025",
      supplier: "TechFlow Solutions",
      total: "$895.75",
      status: "overdue",
      dueDate: "18 Jun 2025",
      amount: 895.75
    },
    {
      id: "INV-2025-004",
      date: "2 Jun 2025",
      supplier: "Global Supplies Inc",
      total: "$3,420.80",
      status: "pending",
      dueDate: "17 Jun 2025",
      amount: 3420.80
    },
    {
      id: "INV-2025-005",
      date: "1 Jun 2025",
      supplier: "Premium Partners",
      total: "$1,275.60",
      status: "pending",
      dueDate: "16 Jun 2025",
      amount: 1275.60
    },
    {
      id: "INV-2025-006",
      date: "31 May 2025",
      supplier: "Eco-Friendly Co",
      total: "$2,150.90",
      status: "paid",
      dueDate: "15 Jun 2025",
      amount: 2150.90
    },
    {
      id: "INV-2025-007",
      date: "30 May 2025",
      supplier: "Rapid Logistics",
      total: "$4,680.30",
      status: "pending",
      dueDate: "14 Jun 2025",
      amount: 4680.30
    },
    {
      id: "INV-2025-008",
      date: "29 May 2025",
      supplier: "Quality First Ltd",
      total: "$1,845.70",
      status: "overdue",
      dueDate: "13 Jun 2025",
      amount: 1845.70
    }
  ];

  useEffect(() => {
    setInvoices(sampleInvoices);
    
    // Check if we need to show a specific invoice from sidebar click
    const urlParams = new URLSearchParams(location.search);
    const invoiceId = urlParams.get('invoice');
    if (invoiceId) {
      const invoice = sampleInvoices.find(inv => inv.id === invoiceId);
      if (invoice) {
        handleInvoiceClick(invoice);
      }
    }
  }, [location.search]);

  const handleCreateDraftEmail = () => {
    const pendingInvoices = invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue');
    if (pendingInvoices.length === 0) {
      toast({
        title: "No Invoices to Process",
        description: "All invoices have already been paid",
      });
      return;
    }

    const emailSubject = `Payment Request for ${pendingInvoices.length} Invoice${pendingInvoices.length > 1 ? 's' : ''}`;
    const emailBody = `Dear Finance Team,

Please process payment for the following invoice${pendingInvoices.length > 1 ? 's' : ''}:

${pendingInvoices.map(inv => 
  `• ${inv.supplier} - ${inv.total} (Due: ${inv.dueDate})`
).join('\n')}

Total Amount: $${pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}

Please let me know once the payment${pendingInvoices.length > 1 ? 's have' : ' has'} been processed.

Best regards,
[Your Name]`;

    const emailDraft = `Subject: ${emailSubject}\n\n${emailBody}`;
    
    navigator.clipboard.writeText(emailDraft).then(() => {
      toast({
        title: "Email Draft Copied",
        description: "The email draft has been copied to your clipboard. You can now paste it into your email client.",
      });
    }).catch(() => {
      toast({
        title: "Email Draft Created",
        description: emailBody,
        variant: "default"
      });
    });
  };

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'processing':
        return <Package className="h-3 w-3" />;
      case 'paid':
        return <CheckCircle className="h-3 w-3" />;
      case 'overdue':
        return <Clock className="h-3 w-3" />;
      case 'approved':
        return <Check className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'processing':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'paid':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'overdue':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'approved':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusDisplayName = (status: Invoice['status']) => {
    if (status === 'approved') return 'Awaiting Payment';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleInvoiceClick = (invoice: Invoice) => {
    if (invoice.status === 'paid') {
      setSelectedInvoice(invoice);
      setShowSplitView(true);
    } else {
      setSelectedInvoice(invoice);
      setIsDialogOpen(true);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPdfDialogOpen(true);
  };

  const pendingCount = invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue').length;
  const totalPendingAmount = invoices
    .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue');


  if (showSplitView && selectedInvoice) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50">
          <AppSidebar onLogout={() => {}} />
          <SidebarInset>
            <Header />
            <div className="flex h-[calc(100vh-4rem)]">
              {/* Left side - Order Summary */}
              <div className="w-1/2 p-6 border-r border-gray-200">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowSplitView(false)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Invoice {selectedInvoice.id}</CardTitle>
                      <CardDescription>Payment completed successfully</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Supplier</p>
                          <p className="font-medium">{selectedInvoice.supplier}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Amount</p>
                          <p className="font-medium">{selectedInvoice.total}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Date</p>
                          <p className="font-medium">{selectedInvoice.date}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid
                          </Badge>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="font-medium mb-3">Payment Details</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Payment Method</span>
                            <span>Corporate Credit Card</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Transaction ID</span>
                            <span className="font-mono text-sm">TXN-{selectedInvoice.id.slice(-6)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Processed On</span>
                            <span>{selectedInvoice.date}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              {/* Right side - Invoice PDF */}
              <div className="w-1/2 p-6 bg-white">
                <div className="h-full">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Invoice Document</h3>
                  <div className="border border-gray-200 rounded-lg p-8 h-full overflow-y-auto">
                    <div className="space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                          <p className="text-gray-600 mt-1">{selectedInvoice.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Invoice Date</p>
                          <p className="font-medium text-gray-900">{selectedInvoice.date}</p>
                          <p className="text-sm text-gray-600 mt-2">Due Date</p>
                          <p className="font-medium text-gray-900">{selectedInvoice.dueDate}</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <h3 className="font-medium mb-2">Bill To:</h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Your Company Name</p>
                            <p>123 Business Street</p>
                            <p>City, State 12345</p>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium mb-2">From:</h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>{selectedInvoice.supplier}</p>
                            <p>456 Supplier Avenue</p>
                            <p>Supplier City, State 67890</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <div className="w-64 space-y-2">
                          <div className="flex justify-between font-bold text-lg border-t pt-2">
                            <span>Total:</span>
                            <span>{selectedInvoice.total}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-green-800 font-medium">PAID</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar onLogout={() => {}} />
        <SidebarInset>
          <Header />
          <div className="flex-1 space-y-6 p-6">
            {/* Header with summary */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {pendingCount} invoices awaiting payment • ${totalPendingAmount.toLocaleString()} total
                </p>
              </div>
              <div className="flex gap-3">
                {pendingCount > 0 && (
                  <Button 
                    onClick={handleCreateDraftEmail}
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Create Email Draft
                  </Button>
                )}
              </div>
            </div>

            {/* Invoices Table */}
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200 bg-gray-50">
                      <TableHead className="font-medium text-gray-700">Vendor</TableHead>
                      <TableHead className="font-medium text-gray-700">Amount</TableHead>
                      <TableHead className="font-medium text-gray-700">Due Date</TableHead>
                      <TableHead className="font-medium text-gray-700">PDF Preview</TableHead>
                      <TableHead className="font-medium text-gray-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map(invoice => (
                      <TableRow key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900">{invoice.supplier}</TableCell>
                        <TableCell className="font-semibold text-gray-900">{invoice.total}</TableCell>
                        <TableCell className="text-gray-700">{invoice.dueDate}</TableCell>
                        <TableCell>
                          <div 
                            onClick={() => handleViewInvoice(invoice)} 
                            className="cursor-pointer hover:bg-gray-100 p-2 rounded border border-gray-200 transition-colors"
                          >
                            <div className="bg-white border border-gray-300 rounded p-3 shadow-sm hover:shadow-md transition-shadow">
                              <div className="space-y-2">
                                <div className="flex justify-between items-start text-xs">
                                  <div>
                                    <p className="font-bold text-gray-900">INVOICE</p>
                                    <p className="text-gray-600">{invoice.id}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-gray-600">{invoice.date}</p>
                                  </div>
                                </div>
                                <div className="border-t border-gray-200 pt-2">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">From:</span>
                                    <span className="text-gray-900 font-medium">{invoice.supplier}</span>
                                  </div>
                                  <div className="flex justify-between text-xs mt-1">
                                    <span className="text-gray-600">Total:</span>
                                    <span className="text-gray-900 font-bold">{invoice.total}</span>
                                  </div>
                                </div>
                                <div className="text-center">
                                  <FileText className="h-4 w-4 mx-auto text-gray-400" />
                                  <p className="text-xs text-gray-500 mt-1">Click to view PDF</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(invoice.status)} border text-xs`}>
                            {getStatusIcon(invoice.status)}
                            <span className="ml-1">{getStatusDisplayName(invoice.status)}</span>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Details Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
                  <FileText className="h-5 w-5" /> 
                  Invoice Details
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  Viewing detailed information for invoice {selectedInvoice?.id}
                </DialogDescription>
              </DialogHeader>
              
              {selectedInvoice && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-sm text-gray-600">Invoice Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-y-2">
                          <span className="text-sm text-gray-600">Invoice ID:</span>
                          <span className="text-sm text-gray-900">{selectedInvoice.id}</span>
                          <span className="text-sm text-gray-600">Date:</span>
                          <span className="text-sm text-gray-900">{selectedInvoice.date}</span>
                          <span className="text-sm text-gray-600">Supplier:</span>
                          <span className="text-sm text-gray-900">{selectedInvoice.supplier}</span>
                          <span className="text-sm text-gray-600">Due Date:</span>
                          <span className="text-sm text-gray-900">{selectedInvoice.dueDate}</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-sm text-gray-600">Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-y-2">
                          <span className="text-sm text-gray-600">Total:</span>
                          <span className="text-sm font-semibold text-gray-900">{selectedInvoice.total}</span>
                          <span className="text-sm text-gray-600">Status:</span>
                          <span className="text-sm">
                            <Badge className={`inline-flex items-center gap-1 ${getStatusColor(selectedInvoice.status)} border`}>
                              {getStatusIcon(selectedInvoice.status)}
                              <span>{getStatusDisplayName(selectedInvoice.status)}</span>
                            </Badge>
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)} 
                      className="text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* PDF Invoice Dialog */}
          <Dialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
                  <FileText className="h-5 w-5" /> 
                  Invoice Document - {selectedInvoice?.id}
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  Sample PDF invoice document
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <Card className="p-8 border-gray-200">
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                        <p className="text-gray-600 mt-1">{selectedInvoice?.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Invoice Date</p>
                        <p className="font-medium text-gray-900">{selectedInvoice?.date}</p>
                        <p className="text-sm text-gray-600 mt-2">Due Date</p>
                        <p className="font-medium text-gray-900">{selectedInvoice?.dueDate}</p>
                      </div>
                    </div>
                    
                    <Separator className="bg-gray-200" />
                    
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <h3 className="font-medium mb-2 text-gray-900">Bill To:</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Your Company Name</p>
                          <p>123 Business Street</p>
                          <p>City, State 12345</p>
                          <p>United States</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2 text-gray-900">From:</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>{selectedInvoice?.supplier}</p>
                          <p>456 Supplier Avenue</p>
                          <p>Supplier City, State 67890</p>
                          <p>United States</p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="bg-gray-200" />
                    
                    <div>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-gray-200">
                            <TableHead className="text-gray-700">Description</TableHead>
                            <TableHead className="text-gray-700">Quantity</TableHead>
                            <TableHead className="text-gray-700">Rate</TableHead>
                            <TableHead className="text-gray-700">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="border-b border-gray-100">
                            <TableCell className="text-gray-900">Professional Services</TableCell>
                            <TableCell className="text-gray-900">1</TableCell>
                            <TableCell className="text-gray-900">$2,500.00</TableCell>
                            <TableCell className="text-gray-900">$2,500.00</TableCell>
                          </TableRow>
                          <TableRow className="border-b border-gray-100">
                            <TableCell className="text-gray-900">Additional Consulting</TableCell>
                            <TableCell className="text-gray-900">2</TableCell>
                            <TableCell className="text-gray-900">$150.00</TableCell>
                            <TableCell className="text-gray-900">$300.00</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="text-gray-900">$2,800.00</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax (8.5%):</span>
                          <span className="text-gray-900">$238.00</span>
                        </div>
                        <Separator className="bg-gray-200" />
                        <div className="flex justify-between font-bold">
                          <span className="text-gray-900">Total:</span>
                          <span className="text-gray-900">{selectedInvoice?.total}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="bg-gray-200" />
                    
                    <div className="text-sm text-gray-600 space-y-2">
                      <div>
                        <p className="font-medium text-gray-900">Payment Terms:</p>
                        <p>Net 30 days</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Notes:</p>
                        <p>Thank you for your business!</p>
                      </div>
                    </div>
                  </div>
                </Card>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsPdfDialogOpen(false)}
                    className="text-gray-700 border-gray-300 hover:bg-gray-50"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Close
                  </Button>
                  <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Invoices;

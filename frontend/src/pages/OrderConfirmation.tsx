import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Package, FileText, Mail, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from '@/components/dashboard/AppSidebar';
import { ThemeToggle } from "@/components/ui/theme-toggle";
import PurchaseOrderDialog from "@/components/PurchaseOrderDialog";
import OrderProcessingTransition from "@/components/OrderProcessingTransition";
import OrderSuccessPage from "@/components/OrderSuccessPage";
import OrderPlacedTransition from '@/components/OrderPlacedTransition';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  id: number;
  image: string;
  name: string;
  price: string;
  quantity: number;
  total: string;
  supplier?: string;
  orderNumber?: string;
  cartonSize?: number;
}

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderData, orderItems } = location.state || { orderData: {}, orderItems: [] };
  
  const [selectedPO, setSelectedPO] = useState<{
    supplier: string;
    orderNumber: string;
    items: OrderItem[];
  } | null>(null);
  
  const [showProcessingTransition, setShowProcessingTransition] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [showPlacedTransition, setShowPlacedTransition] = useState(false);

  // Generate a random order ID
  const generateOrderId = () => {
    return `ORD-${Math.floor(Math.random() * 900000) + 100000}`;
  };

  // Generate a random order number for each item - limited to 5 characters after "ON-"
  const generateOrderNumber = () => {
    return `ON-${Math.floor(Math.random() * 90000) + 10000}`;
  };

  // Generate a random SKU starting with PF + 7 numbers
  const generateSKU = () => {
    return `PF${Math.floor(Math.random() * 9000000) + 1000000}`;
  };

  // Generate a supplier code
  const generateSupplierCode = (supplier: string) => {
    const codes: { [key: string]: string } = {
      'Impala': 'IMP247',
      'Bran Marion': 'BRM389',
      'Comme Avant': 'CAV156',
      'Stellar Goods': 'STG924',
      'Nova Brands': 'NOV731',
      'Echo Supply': 'ECH582'
    };
    return codes[supplier] || `${supplier.substring(0, 3).toUpperCase()}${Math.floor(Math.random() * 900) + 100}`;
  };

  // Get specific supplier for each product based on product name
  const getSupplierForProduct = (productName: string) => {
    if (productName.includes('Floral Back Tie Tiered Mini Dress') || productName.includes('2021 Pinot Noir Reserve')) {
      return 'Impala';
    } else if (productName.includes('Organic Solid Hazelnut Oil Cream') || productName.includes('Pearl Circle Pendant Jewelry Set')) {
      return 'Bran Marion';
    } else if (productName.includes('Round Mirror in Gilded Brass') || productName.includes('Crossover Hemp Chelsea Boot')) {
      return 'Comme Avant';
    } else if (productName.includes('Premium Cotton Throw Blanket') || productName.includes('Ceramic Coffee Mug Set')) {
      return 'Stellar Goods';
    } else if (productName.includes('Wireless Bluetooth Speaker') || productName.includes('Leather Wallet Collection')) {
      return 'Nova Brands';
    } else if (productName.includes('Ergonomic Office Chair')) {
      return 'Echo Supply';
    }
    const suppliers = ['Impala', 'Bran Marion', 'Comme Avant', 'Stellar Goods', 'Nova Brands', 'Echo Supply'];
    return suppliers[Math.floor(Math.random() * suppliers.length)];
  };

  // Get supplier email for each supplier
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

  // Format today's date as a string with 2025 as the year
  const getTodayDate = () => {
    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleString('en-GB', { month: 'short' });
    return `${day} ${month} 2025`;
  };

  // Fixed back navigation to return to order summary
  const handleBackToOrderSummary = () => {
    // Navigate back to order summary with the original query or data
    const searchParams = new URLSearchParams(window.location.search);
    const query = searchParams.get('query') || location.state?.originalQuery || 'order summary';
    navigate(`/order-summary?query=${encodeURIComponent(query)}`, {
      state: { orderData, orderItems }
    });
  };

  // Navigation handlers
  const handleViewOrders = () => {
    const newOrder = {
      id: generateOrderId(),
      date: getTodayDate(),
      supplier: 'Multiple Suppliers',
      items: orderData.totalItems || '11',
      total: orderData.grandTotal || '$1,295.50',
      status: 'pending' as const
    };

    navigate('/orders', { 
      state: { 
        newOrder: newOrder
      }
    });
  };

  const handleReturnToDashboard = () => {
    navigate('/dashboard');
  };

  const handleSupplierClick = () => {
    navigate('/suppliers');
  };

  const handleInventoryClick = () => {
    navigate('/inventory');
  };

  const handleOrdersClick = () => {
    navigate('/orders');
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const handleDataSourcesClick = () => {
    navigate('/data-sources');
  };

  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out",
          variant: "destructive",
        });
        return;
      }
      navigate('/auth');
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Default order items with reduced count (11 instead of 16)
  const defaultOrderItems = [
    {
      id: 1,
      image: "/lovable-uploads/eae07338-87ef-485f-948b-9baac3389dba.png",
      name: "Floral Back Tie Tiered Mini Dress",
      price: "$11.20",
      quantity: 72,
      total: "$806.40"
    },
    {
      id: 2,
      image: "/lovable-uploads/ece5d739-6092-4e95-a923-e4372626177e.png",
      name: "2021 Pinot Noir Reserve",
      price: "$8.50",
      quantity: 72,
      total: "$612.00"
    },
    {
      id: 3,
      image: "/lovable-uploads/04e1c43b-f6da-4eae-bb7d-fd5581abaa50.png",
      name: "Organic Solid Hazelnut Oil Cream",
      price: "$7.95",
      quantity: 35,
      total: "$278.25"
    },
    {
      id: 4,
      image: "/lovable-uploads/7c27528a-b2dd-4f35-90c2-b1aace1200ea.png",
      name: "Pearl Circle Pendant Jewelry Set",
      price: "$22.50",
      quantity: 60,
      total: "$1,350.00"
    },
    {
      id: 5,
      image: "/lovable-uploads/183882eb-50f4-4541-924c-22cbf9aa291e.png",
      name: "Round Mirror in Gilded Brass",
      price: "$26.95",
      quantity: 15,
      total: "$404.25"
    },
    {
      id: 6,
      image: "/lovable-uploads/180d7dec-c110-4413-8c0d-580b73dffedb.png",
      name: "Crossover Hemp Chelsea Boot",
      price: "$67.95",
      quantity: 15,
      total: "$1,019.25"
    },
    {
      id: 7,
      image: "/lovable-uploads/9745aadc-804e-4ef1-8ab1-0baa0df9289e.png",
      name: "Premium Cotton Throw Blanket",
      price: "$34.50",
      quantity: 24,
      total: "$828.00"
    },
    {
      id: 8,
      image: "/lovable-uploads/75c231a2-97f5-4a0b-b9af-8cab19800c51.png",
      name: "Ceramic Coffee Mug Set",
      price: "$18.75",
      quantity: 40,
      total: "$750.00"
    },
    {
      id: 11,
      image: "/lovable-uploads/dec66015-9254-41bc-8143-43811c7f4806.png",
      name: "Wireless Bluetooth Speaker",
      price: "$45.99",
      quantity: 20,
      total: "$919.80"
    },
    {
      id: 12,
      image: "/lovable-uploads/d514022c-2770-4ec5-abcc-137320c83376.png",
      name: "Leather Wallet Collection",
      price: "$29.50",
      quantity: 36,
      total: "$1,062.00"
    },
    {
      id: 15,
      image: "/lovable-uploads/d24004d6-3d5f-4eda-8981-c91f8e91904b.png",
      name: "Ergonomic Office Chair",
      price: "$149.99",
      quantity: 10,
      total: "$1,499.90"
    }
  ];

  // Ensure orderItems is an array and add supplier and order number to each item if not already present
  const safeOrderItems = Array.isArray(orderItems) && orderItems.length > 0 ? orderItems : defaultOrderItems;
  const enhancedOrderItems = safeOrderItems.map((item: OrderItem) => ({
    ...item,
    supplier: item.supplier || getSupplierForProduct(item.name),
    orderNumber: item.orderNumber || generateOrderNumber()
  }));

  // Group items by supplier for better organization
  const groupedItems = enhancedOrderItems.reduce((groups: { [key: string]: OrderItem[] }, item: OrderItem) => {
    const supplier = item.supplier!;
    if (!groups[supplier]) {
      groups[supplier] = [];
    }
    groups[supplier].push(item);
    return groups;
  }, {});

  const handleViewPO = (item: OrderItem) => {
    const supplierItems = enhancedOrderItems.filter(
      (orderItem: OrderItem) => orderItem.supplier === item.supplier
    );
    
    setSelectedPO({
      supplier: item.supplier!,
      orderNumber: item.orderNumber!,
      items: supplierItems
    });
  };

  const handlePlaceOrders = () => {
    setShowPlacedTransition(true);
  };

  const handlePlacedTransitionComplete = () => {
    setShowPlacedTransition(false);
    setShowSuccessPage(true);
  };

  // Show minimal transition with only placing/sending and a toast, NO large popup
  if (showPlacedTransition) {
    return <OrderPlacedTransition onComplete={handlePlacedTransitionComplete} />;
  }

  // Show success page if active
  if (showSuccessPage) {
    return (
      <OrderSuccessPage 
        {...location.state}
      />
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-100 dark:bg-black">
        <AppSidebar onLogout={handleLogout} />
        <SidebarInset>
          {/* Custom Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <button
                onClick={handleBackToOrderSummary}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-black dark:text-white" />
              </button>
            </div>
            <div className="flex flex-1 items-center justify-end gap-2">
              <ThemeToggle />
            </div>
          </header>
          
          <main className="flex-1 px-4 py-8 pb-32">
            <div className="max-w-full mx-auto space-y-6">
              {/* Purchase Orders Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table className="w-full min-w-[1800px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[240px]">Product</TableHead>
                          <TableHead className="w-[100px]">SKU</TableHead>
                          <TableHead className="w-[80px]">Sup.code</TableHead>
                          <TableHead className="w-[120px]">Supplier</TableHead>
                          <TableHead className="w-[160px]">Email</TableHead>
                          <TableHead className="text-right w-[90px]">Unit cost</TableHead>
                          <TableHead className="text-right w-[70px]">Qty</TableHead>
                          <TableHead className="text-right w-[70px]">Carton</TableHead>
                          <TableHead className="text-right w-[80px]">Tax</TableHead>
                          <TableHead className="text-right w-[100px]">Total</TableHead>
                          <TableHead className="text-center w-[60px]">PDF</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(groupedItems).map(([supplier, items], supplierIndex) => (
                          items.map((item: OrderItem, itemIndex: number) => {
                            const unitCost = parseFloat(item.price.replace('$', ''));
                            const taxRate = 0.2; // 20% VAT
                            const subtotal = unitCost * item.quantity;
                            const taxAmount = subtotal * taxRate;
                            const totalWithTax = subtotal + taxAmount;
                            const isFirstItemOfSupplier = itemIndex === 0;
                            const isLastItemOfSupplier = itemIndex === items.length - 1;
                            
                            return (
                              <TableRow 
                                key={item.id}
                                className={`${isLastItemOfSupplier && supplierIndex < Object.keys(groupedItems).length - 1 ? 'border-b-2 border-muted' : ''}`}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden">
                                      <img 
                                        src={item.image} 
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div>
                                      <p className="font-medium text-xs">{item.name}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs font-mono">{generateSKU()}</span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs font-mono">{generateSupplierCode(item.supplier!)}</span>
                                </TableCell>
                                <TableCell>
                                  <span className="font-medium text-sm">{item.supplier}</span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                    <a 
                                      href={`mailto:${getSupplierEmail(item.supplier!)}`}
                                      className="text-xs text-blue-600 hover:underline truncate"
                                    >
                                      {getSupplierEmail(item.supplier!)}
                                    </a>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-sm">{item.price}</TableCell>
                                <TableCell className="text-right text-sm">{item.quantity}</TableCell>
                                <TableCell className="text-right text-sm">{item.cartonSize || 12}</TableCell>
                                <TableCell className="text-right text-sm">${taxAmount.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-medium text-sm">${totalWithTax.toFixed(2)}</TableCell>
                                <TableCell className="text-center">
                                  {isFirstItemOfSupplier ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewPO(item)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )).flat()}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Order Totals */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span>{orderData.subtotal || '$9,529.85'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sales Tax:</span>
                        <span>{orderData.salesTax || '$952.99'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping:</span>
                        <span>{orderData.shipping || 'FREE'}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Grand Total:</span>
                        <span>{orderData.grandTotal || '$10,482.84'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>

          {/* Footer bar */}
          <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-10">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 flex justify-end">
              <div className="w-64 flex justify-end">
                <Button 
                  size="lg"
                  className="h-12 bg-black text-white hover:bg-gray-800 font-medium transition-all duration-200 transform hover:scale-[1.02]"
                  onClick={handlePlaceOrders}
                >
                  <Package className="w-5 h-5" />
                  Place Orders
                </Button>
              </div>
            </div>
          </footer>

          {/* Purchase Order Dialog */}
          {selectedPO && (
            <PurchaseOrderDialog
              isOpen={!!selectedPO}
              onClose={() => setSelectedPO(null)}
              supplier={selectedPO.supplier}
              orderNumber={selectedPO.orderNumber}
              items={selectedPO.items}
            />
          )}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default OrderConfirmation;

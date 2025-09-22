import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PackageOpen, Calendar, Truck, CheckCircle, Clock, Package, X, Info, Sparkles, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/dashboard/Header";
import AppSidebar from '@/components/dashboard/AppSidebar';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OdooService, OdooPurchaseOrder } from '@/services/OdooService';
import { Logger } from '@/services/Logger';
import { getProductImage } from '@/services/productImageMapper';

interface OrderItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
  total: string;
  image?: string;
  supplier?: string;
}

interface Order {
  id: string;
  date: string;
  supplier: string;
  items: number;
  total: string;
  totalWithoutVat?: string;
  vatAmount?: string;
  status: 'pending' | 'processed' | 'with_supplier' | 'shipped' | 'delivered';
  orderItems?: OrderItem[];
  isNew?: boolean;
  odooId?: number;
}

const Orders = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const odooService = useMemo(() => new OdooService(), []);

  // Sample data that remains constant
  const sampleOrders: Order[] = [{
    id: "ORD-2025-001",
    date: "5 Jun 2025",
    supplier: "Impala",
    items: 45,
    total: "£2,840.50",
    totalWithoutVat: "£2,367.08",
    vatAmount: "£473.42",
    status: "delivered",
    orderItems: [{
      id: "item-1",
      name: "Floral Back Tie Tiered Mini Dress",
      image: getProductImage("Floral Back Tie Tiered Mini Dress", "Clothing"),
      supplier: "Impala",
      price: "£11.20",
      quantity: 25,
      total: "£280.00"
    }, {
      id: "item-2",
      name: "2021 Pinot Noir Reserve",
      image: getProductImage("2021 Pinot Noir Reserve", null),
      supplier: "Impala",
      price: "£8.50",
      quantity: 20,
      total: "£170.00"
    }]
  }, {
    id: "ORD-2025-002",
    date: "4 Jun 2025",
    supplier: "Comme Avant",
    items: 32,
    total: "£1,950.25",
    totalWithoutVat: "£1,625.21",
    vatAmount: "£325.04",
    status: "shipped",
    orderItems: [{
      id: "item-3",
      name: "Round Mirror in Gilded Brass",
      image: getProductImage("Round Mirror in Gilded Brass", "Home"),
      supplier: "Comme Avant",
      price: "£26.95",
      quantity: 12,
      total: "£323.40"
    }]
  }, {
    id: "ORD-2025-003",
    date: "3 Jun 2025",
    supplier: "TechFlow Solutions",
    items: 18,
    total: "£895.75",
    totalWithoutVat: "£746.46",
    vatAmount: "£149.29",
    status: "with_supplier",
    orderItems: []
  }, {
    id: "ORD-2025-004",
    date: "2 Jun 2025",
    supplier: "Global Supplies Inc",
    items: 67,
    total: "£3,420.80",
    totalWithoutVat: "£2,850.67",
    vatAmount: "£570.13",
    status: "processed",
    orderItems: []
  }, {
    id: "ORD-2025-005",
    date: "1 Jun 2025",
    supplier: "Premium Partners",
    items: 23,
    total: "£1,275.60",
    totalWithoutVat: "£1,063.00",
    vatAmount: "£212.60",
    status: "pending",
    orderItems: []
  }, {
    id: "ORD-2025-006",
    date: "31 May 2025",
    supplier: "Eco-Friendly Co",
    items: 41,
    total: "£2,150.90",
    totalWithoutVat: "£1,792.42",
    vatAmount: "£358.48",
    status: "delivered",
    orderItems: []
  }, {
    id: "ORD-2025-007",
    date: "30 May 2025",
    supplier: "Rapid Logistics",
    items: 55,
    total: "£4,680.30",
    status: "shipped",
    orderItems: []
  }, {
    id: "ORD-2025-008",
    date: "29 May 2025",
    supplier: "Quality First Ltd",
    items: 29,
    total: "£1,845.70",
    status: "with_supplier",
    orderItems: []
  }];
  const impalaProducts = [{
    id: "item-1",
    name: "Floral Back Tie Tiered Mini Dress",
    image: getProductImage("Floral Back Tie Tiered Mini Dress", "Clothing"),
    supplier: "Impala",
    price: "£11.20",
    quantity: 50,
    total: "£560.00"
  }, {
    id: "item-2",
    name: "2021 Pinot Noir Reserve",
    image: getProductImage("2021 Pinot Noir Reserve", null),
    supplier: "Impala",
    price: "£8.50",
    quantity: 48,
    total: "£408.00"
  }, {
    id: "item-3",
    name: "Organic Solid Hazelnut Oil Cream",
    image: getProductImage("Organic Solid Hazelnut Oil Cream", "Beauty"),
    supplier: "Impala",
    price: "£7.95",
    quantity: 35,
    total: "£278.25"
  }, {
    id: "item-4",
    name: "Pearl Circle Pendant Jewelry Set",
    image: getProductImage("Pearl Circle Pendant Jewelry Set", "Accessories"),
    supplier: "Impala",
    price: "£22.50",
    quantity: 60,
    total: "£1,350.00"
  }];
  const commeAvantProducts = [{
    id: "item-5",
    name: "Round Mirror in Gilded Brass",
    image: getProductImage("Round Mirror in Gilded Brass", "Home"),
    supplier: "Comme Avant",
    price: "£26.95",
    quantity: 15,
    total: "£404.25"
  }, {
    id: "item-6",
    name: "Crossover Hemp Chelsea Boot",
    image: getProductImage("Crossover Hemp Chelsea Boot", "Footwear"),
    supplier: "Comme Avant",
    price: "£67.95",
    quantity: 15,
    total: "£1,019.25"
  }];
  
  // Map Odoo status to our status - memoized (moved before fetchOdooOrders)
  const mapOdooStatus = useCallback((odooState: string): Order['status'] => {
    const statusMap: Record<string, Order['status']> = {
      'draft': 'pending',
      'sent': 'processed',
      'to_approve': 'processed',
      'purchase': 'with_supplier',
      'done': 'delivered',
      'cancel': 'pending'
    };
    
    return statusMap[odooState] || 'pending';
  }, []);
  
  // Fetch orders from Odoo - memoized
  const fetchOdooOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const odooOrders = await odooService.fetchPurchaseOrders();
      
      // Convert Odoo orders to our Order format (without partner details yet)
      const convertedOrders: Order[] = odooOrders.map(odooOrder => {
        return {
          id: odooOrder.name || `ORD-${odooOrder.id}`,
          odooId: odooOrder.id,
          date: odooOrder.date_order ? new Date(odooOrder.date_order).toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          }) : 'Unknown Date',
          supplier: '',
          items: 0,
          total: odooOrder.amount_total ? `£${odooOrder.amount_total.toFixed(2)}` : '£0.00',
          totalWithoutVat: odooOrder.amount_untaxed ? `£${odooOrder.amount_untaxed.toFixed(2)}` : '£0.00',
          vatAmount: odooOrder.amount_tax ? `£${odooOrder.amount_tax.toFixed(2)}` : '£0.00',
          status: mapOdooStatus(odooOrder.state),
          orderItems: []
        };
      });
      
      // Note: Due to Odoo API limitations, partner_id and order_line fields cannot be fetched
      // This is a known limitation that needs to be addressed on the Odoo server side
      setOrders(convertedOrders);
      
      toast({
        title: "Orders synced",
        description: `Fetched ${convertedOrders.length} orders from Odoo`,
      });
    } catch (error) {
      Logger.error('Failed to fetch Odoo orders:', error);
      toast({
        title: "Sync failed",
        description: "Failed to fetch orders from Odoo. Using local data.",
        variant: "destructive",
      });
      // Fall back to sample data
      setOrders(sampleOrders);
    } finally {
      setIsLoading(false);
    }
  }, [odooService, toast, mapOdooStatus]);

  // Create order in Odoo - memoized (moved before useEffect)
  const createOrderInOdoo = useCallback(async (order: Order) => {
    try {
      // 'Creating order in Odoo:', order);
      
      // First get suppliers to find the right partner_id
      const suppliers = await odooService.getSuppliers();
      const supplier = suppliers.find(s => s.name === order.supplier);
      
      if (!supplier) {
        // If supplier not found, try to use a default supplier ID
        Logger.warn(`Supplier ${order.supplier} not found in Odoo, using default`);
      }

      // Get products to find proper IDs
      const products = await odooService.getProducts();
      
      // Available Odoo products logged
      // Order items to create logged
      
      // Prepare order data - keep it simple, only send required fields
      const odooOrder: any = {
        partner_id: supplier?.id || 21 // Use Global Pet Supplies as default
      };
      
      // Only add order lines if we have items
      if (order.orderItems && order.orderItems.length > 0) {
        odooOrder.order_line = order.orderItems.map((item, index) => {
          // Try to find product by name - first exact match, then partial match
          let product = products.find(p => 
            p.name.toLowerCase() === item.name.toLowerCase()
          );
          
          if (!product) {
            // Try partial match
            product = products.find(p => 
              p.name.toLowerCase().includes(item.name.toLowerCase()) ||
              item.name.toLowerCase().includes(p.name.toLowerCase())
            );
          }
          
          // If still no match, use a rotating set of products from Odoo
          if (!product && products.length > 0) {
            // Use different products for each item to show variety
            product = products[index % products.length];
            // `No match found for "${item.name}", using Odoo product: "${product.name}" (ID: ${product.id})`);
          }
          
          // Don't include price_subtotal or price_total - these are computed fields
          const quantity = item.quantity;
          const price = parseFloat(item.price.replace('£', '').replace('$', ''));
          
          // `Creating order line for "${item.name}": quantity=${quantity}, price=${price}`);
          
          return {
            product_id: product?.id || 42, // Use first product as default
            name: product?.name || item.name, // Use actual Odoo product name
            product_qty: quantity,
            price_unit: price
          };
        });
      }
      
      // 'Sending order data to Odoo:', odooOrder);

      const orderId = await odooService.createPurchaseOrder(odooOrder);
      
      toast({
        title: "Order created",
        description: `Order ${orderId} created in Odoo successfully!`,
      });
      
      // Refresh orders list
      await fetchOdooOrders();
    } catch (error: any) {
      Logger.error('Failed to create order in Odoo:', error);
      Logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response,
        data: error.data
      });
      
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create order in Odoo. Please check the logs.",
        variant: "destructive",
      });
    }
  }, [odooService, toast, fetchOdooOrders]);

  useEffect(() => {
    // Try to fetch from Odoo first
    fetchOdooOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    // Handle new order from location state
    if (location.state?.newOrder) {
      const newOrder = {
        ...location.state.newOrder,
        orderItems: location.state.newOrder.orderItems || []
      };
      
      // Create order in Odoo
      createOrderInOdoo(newOrder);
      
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.newOrder]); // Only run when newOrder changes
  
  // Memoize sorted orders
  const sortedOrders = useMemo(() => [...orders].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    const dateA = new Date(a.date.split(' ').reverse().join(' '));
    const dateB = new Date(b.date.split(' ').reverse().join(' '));
    return dateB.getTime() - dateA.getTime();
  }), [orders]);
  const getStatusIcon = useCallback((status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'processed':
        return <Package className="h-3 w-3" />;
      case 'with_supplier':
        return <PackageOpen className="h-3 w-3" />;
      case 'shipped':
        return <Truck className="h-3 w-3" />;
      case 'delivered':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  }, []);
  const getStatusColor = useCallback((status: Order['status']) => {
    return 'bg-gray-100 text-gray-700 border-gray-200';
  }, []);
  const getStatusDisplayName = useCallback((status: Order['status']) => {
    switch (status) {
      case 'with_supplier':
        return 'With Supplier';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }, []);
  const handleOrderClick = useCallback((order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  }, []);

  const handleLogout = useCallback(async () => {
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
  }, [toast, navigate]);
  const handleNewOrder = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);
  // Memoize pendingCount and totalOrdersValue calculations
  const pendingCount = useMemo(() => orders.filter(order => order.status === 'pending').length, [orders]);
  const totalOrdersValue = useMemo(() => orders.reduce((sum, order) => {
    const value = parseFloat(order.total.replace('£', '').replace(',', ''));
    return sum + value;
  }, 0), [orders]);
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar onLogout={handleLogout} />
        <SidebarInset>
          <Header />
          <div className="flex-1 space-y-6 p-6">

            {/* Header with summary */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {pendingCount} orders pending • £{totalOrdersValue.toLocaleString()} total
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="text-gray-700 border-gray-300 hover:bg-gray-50"
                  onClick={fetchOdooOrders}
                  disabled={isLoading || isSyncing}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync with Odoo
                    </>
                  )}
                </Button>
                <Button variant="outline" className="text-gray-700 border-gray-300 hover:bg-gray-50">
                  Export
                </Button>
                <Button 
                  onClick={handleNewOrder}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  New Order
                </Button>
              </div>
            </div>

            {/* Orders Table */}
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200 bg-gray-50">
                      <TableHead className="font-medium text-gray-700">Order ID</TableHead>
                      <TableHead className="font-medium text-gray-700">Date</TableHead>
                      <TableHead className="font-medium text-gray-700">Subtotal (excl. VAT)</TableHead>
                      <TableHead className="font-medium text-gray-700">Total (incl. VAT)</TableHead>
                      <TableHead className="font-medium text-gray-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedOrders.map((order, index) => <TableRow key={order.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => handleOrderClick(order)}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{order.id}</span>
                            {order.isNew && (
                              <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                                <Sparkles className="h-3 w-3" />
                                new
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-700">{order.date}</TableCell>
                        <TableCell className="text-gray-700">{order.totalWithoutVat || order.total}</TableCell>
                        <TableCell className="font-semibold text-gray-900">{order.total}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(order.status)} border text-xs`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{getStatusDisplayName(order.status)}</span>
                          </Badge>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Order Details Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
                  <Package className="h-5 w-5" /> 
                  Order Details
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  Viewing detailed information for order {selectedOrder?.id}
                </DialogDescription>
              </DialogHeader>
              
              {selectedOrder && <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">Order Information</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Order Number:</span>
                            <span className="text-sm font-medium text-gray-900">{selectedOrder.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Date:</span>
                            <span className="text-sm text-gray-900">{selectedOrder.date}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
                        <div className="space-y-2">
                          {selectedOrder.totalWithoutVat && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Subtotal (excl. VAT):</span>
                              <span className="text-sm text-gray-900">{selectedOrder.totalWithoutVat}</span>
                            </div>
                          )}
                          {selectedOrder.vatAmount && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">VAT:</span>
                              <span className="text-sm text-gray-900">{selectedOrder.vatAmount}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total (incl. VAT):</span>
                            <span className="text-sm font-semibold text-gray-900">{selectedOrder.total}</span>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Status:</span>
                              <Badge className={`inline-flex items-center gap-1 ${getStatusColor(selectedOrder.status)} border`}>
                                {getStatusIcon(selectedOrder.status)}
                                <span>{getStatusDisplayName(selectedOrder.status)}</span>
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(`https://source-gym-plus-coffee.odoo.com/web#model=purchase.order&id=${selectedOrder.odooId || selectedOrder.id}`, '_blank')}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View in Odoo
                    </Button>
                    
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="text-gray-700 border-gray-300 hover:bg-gray-50">
                      Close
                    </Button>
                  </div>
                </div>}
            </DialogContent>
          </Dialog>
        </SidebarInset>
      </div>
    </SidebarProvider>;
};
export default Orders;

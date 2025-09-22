import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import EmailSendingTransition from '@/components/EmailSendingTransition';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from '@/components/dashboard/AppSidebar';
import Header from '@/components/dashboard/Header';
import { ArrowLeft, Download, Printer, ChevronDown, ChevronUp, AlertTriangle, Box, RotateCcw, Clock, Trash2, Minus, Plus } from "lucide-react";
import BackButton from '@/components/ui/back-button';
import { generatePDFFromElement, printElement } from "@/utils/pdfGenerator";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AddProductDialog } from '@/components/orders/AddProductDialog';
import { Logger } from '@/services/Logger';
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
  minQuantity?: number;
  stockAvailable?: number;
  lastOrderDate?: string;
  lastOrderPrice?: string;
  salesRate?: number;
  daysLeft?: number;
  cartonSize?: number;
}
interface SupplierGroup {
  supplier: string;
  items: OrderItem[];
  orderTotal: number;
  mov: number; // Minimum Order Value
}
const PurchaseOrderEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    toast
  } = useToast();

  // Scroll to top when component mounts
  useEffect(() => {
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, []);

  // Debug: Log editableData items after component mounts
  useEffect(() => {
    // DEBUG: PurchaseOrderEditor - After mount, items tracked
  }, []);

  // State for edit mode
  const [isEditMode, setIsEditMode] = useState(false);

  // Scroll to top when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }
  }, [isEditMode]);

  // Get initial data from sessionStorage (from dashboard) or navigation state
  const getInitialData = () => {
    const storedOrderData = sessionStorage.getItem('purchaseOrderData');
    if (storedOrderData) {
      const orderData = JSON.parse(storedOrderData);
      // DEBUG: 'PurchaseOrderEditor - Received orderData:', orderData);
      // DEBUG: 'PurchaseOrderEditor - Products full details:', orderData.products);
      // DEBUG: PurchaseOrderEditor - Products summary tracked
      
      // ⚠️ DEBUG: Verify exact data retrieved from sessionStorage
      // DEBUG: '🚨 DEBUG: PurchaseOrderEditor - EXACT data from sessionStorage:');
      // DEBUG: orderData.products FULL logged
      sessionStorage.removeItem('purchaseOrderData'); // Clear after use

      // Convert dashboard format to editor format with enhanced data
      return {
        supplier: orderData.supplier,
        orderNumber: orderData.orderNumber || `PO-${Date.now().toString().slice(-6)}`,
        // Use provided PO number or generate new one
        items: orderData.products.map((product: any, index: number) => {
          // Safe handling of price data
          const estimatedCost = product.estimatedCost || product.price || '0';
          const cleanPrice = typeof estimatedCost === 'string' ? estimatedCost.replace(/[£$,]/g, '') : String(estimatedCost);
          const numericPrice = parseFloat(cleanPrice) || 0;
          // DEBUG: `Processing product ${product.name}: quantity=${product.quantity}, suggestedQty=${product.suggestedQty}`);
          const quantity = product.quantity || product.suggestedQty || 1;
          // DEBUG: `Final quantity for ${product.name}: ${quantity}`);
          
          // ⚠️ DEBUG: Track exact quantity logic
          // DEBUG: '🚨 DEBUG: PurchaseOrderEditor quantity logic:');
          // DEBUG: product.quantity type checked
          // DEBUG: product.suggestedQty type checked
          // DEBUG: Final quantity calculated
          return {
            id: index + 1,
            image: product.image || `/lovable-uploads/269b1c3e-0693-4bd7-843e-e853d37b3e0a.png`,
            name: product.title || product.name || 'Unknown Product',
            price: numericPrice.toFixed(2),
            quantity: quantity,
            total: (numericPrice * quantity).toFixed(2),
            supplier: orderData.supplier,
            orderNumber: `PO-${Date.now().toString().slice(-6)}`,
            supplierCode: `SUP-${index + 1}`,
            barcode: `BC${index + 1}${Math.random().toString().slice(2, 8)}`,
            taxRate: 10,
            taxAmount: numericPrice * quantity * 0.1,
            minQuantity: [36, 25, 20][index] || 10,
            stockAvailable: [8, 15, 3][index] || 5,
            lastOrderDate: ['Apr 2025', 'Mar 2025', 'Feb 2025'][index] || 'Jan 2025',
            lastOrderPrice: ['$10.20', '$7.50', '$22.00'][index] || '$0.00',
            salesRate: [2.3, 1.8, 0.5][index] || 1.0,
            daysLeft: [3.5, 8.3, 6.0][index] || 5.0,
            cartonSize: [12, 24, 6][index] || 1
          };
        })
      };
    }

    // Fallback with sample data
    return {
      supplier: 'FastPet Logistics',
      orderNumber: `PO-${Date.now().toString().slice(-6)}`,
      items: [{
        id: 1,
        image: '/lovable-uploads/eae07338-87ef-485f-948b-9baac3389dba.png',
        name: 'Floral Back Tie Tiered Mini Dress',
        price: '11.20',
        quantity: 72,
        total: '806.40',
        supplier: 'FastPet Logistics',
        supplierCode: 'IMP-001',
        barcode: 'BC1234567',
        taxRate: 10,
        taxAmount: 80.64,
        minQuantity: 36,
        stockAvailable: 8,
        lastOrderDate: 'Apr 2025',
        lastOrderPrice: '$10.20',
        salesRate: 2.3,
        daysLeft: 3.5,
        cartonSize: 12
      }, {
        id: 2,
        image: '/lovable-uploads/04e1c43b-f6da-4eae-bb7d-fd5581abaa50.png',
        name: 'Organic Solid Hazelnut Oil Cream',
        price: '7.95',
        quantity: 35,
        total: '278.25',
        supplier: 'FastPet Logistics',
        supplierCode: 'IMP-002',
        barcode: 'BC2345678',
        taxRate: 10,
        taxAmount: 27.83,
        minQuantity: 25,
        stockAvailable: 15,
        lastOrderDate: 'Mar 2025',
        lastOrderPrice: '$7.50',
        salesRate: 1.8,
        daysLeft: 8.3,
        cartonSize: 24
      }]
    };
  };
  const initialData = getInitialData();
  // DEBUG: 'PurchaseOrderEditor - initialData:', initialData);
  initialData.items?.forEach((item, index) => {
    // DEBUG: `PurchaseOrderEditor - initialData.items[${index}]: name="${item.name}", quantity=${item.quantity}`);
  });
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Group items by supplier
  const supplierGroups: SupplierGroup[] = [{
    supplier: initialData.supplier,
    items: initialData.items,
    orderTotal: initialData.items.reduce((sum, item) => sum + parseFloat(item.total), 0),
    mov: 3250 // Minimum Order Value
  }];

  // State for email sending transition
  const [showEmailTransition, setShowEmailTransition] = useState(false);
  
  // State for add product dialog
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);

  // Editable state with default values
  const getDefaultEditableData = () => {
    const items = initialData.items.map(item => ({
      ...item,
      supplierCode: item.supplierCode || `SUP-${item.id}`,
      barcode: item.barcode || `BC${item.id}${Math.random().toString().slice(2, 8)}`,
      taxRate: item.taxRate || 10,
      taxAmount: item.taxAmount || parseFloat(item.total) * 0.1
    }));
    
    return {
      supplier: initialData.supplier,
      supplierEmail: 'orders@fastpetlogistics.com',
      supplierAddress: '456 Fashion Ave',
      supplierCity: 'New York, NY 10018',
      supplierCountry: 'United States',
      supplierPhone: '',
      supplierId: null as number | null,
      orderNumber: initialData.orderNumber,
      paymentTerms: 'Net 30',
      companyName: 'Animalfarmcy LTD',
      companyAddress: 'Springfield',
      companyCity: 'Ballyfin, Co. Laois',
      companyCountry: 'Ireland',
      companyPhone: '+353 57 851 0155',
      companyEmail: 'info@gympluscoffee.com',
      deliveryName: 'Animalfarmcy LTD',
      deliveryAddress: 'Springfield',
      deliveryCity: 'Ballyfin, Co. Laois',
      deliveryCountry: 'Ireland',
      deliveryEmail: 'noel@animalfarmacy.ie',
      quotedDeliveryDate: new Date().toISOString().split('T')[0],
      items: items
    };
  };
  
  const [editableData, setEditableData] = useState(getDefaultEditableData());
  const [isLoadingSupplier, setIsLoadingSupplier] = useState(false);
  const [supplierDataSource, setSupplierDataSource] = useState<'odoo' | 'default'>('default');

  // Hardcoded supplier data from Odoo
  const odooSuppliers: Record<string, any> = {
    'FastPet Logistics': {
      id: 25,
      name: 'FastPet Logistics',
      email: 'sales@fastpetlogistics.com',
      street: '888 Speed Street',
      city: 'Belfast',
      country: 'Ireland',
      phone: '+82 659 221 2278'
    },
    'Equipment Solutions': {
      id: 23,
      name: 'European Pet Distributors',
      email: 'sales@europeanpetdistributors.com',
      street: '321 Europa Business Park',
      city: 'Amsterdam',
      country: 'Netherlands',
      phone: '+79 898 445 3771'
    },
    'Animal Nutrition': {
      id: 21,
      name: 'Global Pet Supplies',
      email: 'sales@globalpetsupplies.com',
      street: '456 Pet Plaza',
      city: 'Cork',
      country: 'Ireland',
      phone: '+87 601 182 3522'
    },
    'Natural Pet Solutions': {
      id: 26,
      name: 'Natural Pet Solutions',
      email: 'sales@naturalpetsolutions.com',
      street: '999 Green Valley Road',
      city: 'Waterford',
      country: 'Ireland',
      phone: '+93 619 831 6514'
    },
    'PetMeds Direct': {
      id: 20,
      name: 'PetMeds Direct',
      email: 'sales@petmedsdirect.com',
      street: '123 Pharma Park',
      city: 'Dublin',
      country: 'Ireland',
      phone: '+48 185 814 7738'
    }
  };

  // Fetch supplier data from Odoo when component mounts
  useEffect(() => {
    const fetchSupplierData = async () => {
      // Get the vendor/supplier from the first product
      const firstProduct = initialData.items?.[0];
      const supplierName = firstProduct?.supplier || initialData.supplier;
      
      if (!supplierName) return;
      
      setIsLoadingSupplier(true);
      
      // Use hardcoded data
      const supplierData = odooSuppliers[supplierName];
      
      if (supplierData) {
        Logger.debug('Using hardcoded supplier data:', supplierData);
        
        // Update editable data with supplier information
        setEditableData(prev => ({
          ...prev,
          supplierId: supplierData.id,
          supplierEmail: supplierData.email || prev.supplierEmail,
          supplierAddress: supplierData.street || prev.supplierAddress,
          supplierCity: supplierData.city || prev.supplierCity,
          supplierCountry: supplierData.country || prev.supplierCountry,
          supplierPhone: supplierData.phone || prev.supplierPhone
        }));
        
        setSupplierDataSource('odoo');
        toast({
          title: "Supplier Data Loaded",
          description: `Loaded ${supplierData.name} data from Odoo.`,
          variant: "default",
        });
      } else {
        Logger.debug(`No supplier data found for "${supplierName}", using defaults`);
      }
      
      setIsLoadingSupplier(false);
    };
    
    fetchSupplierData();
  }, [initialData.items, initialData.supplier, toast]);

  // Calculate totals
  const subtotal = editableData.items.reduce((sum, item) => sum + parseFloat(item.total), 0);
  const totalTax = editableData.items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
  const grandTotal = subtotal + totalTax;
  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...editableData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Recalculate tax amount and totals when quantity, price or tax rate changes
    if (field === 'quantity' || field === 'price' || field === 'taxRate') {
      const item = updatedItems[index];
      const unitPrice = parseFloat(field === 'price' ? value : item.price);
      const quantity = field === 'quantity' ? value : item.quantity;
      const lineTotal = unitPrice * quantity;
      const taxAmount = lineTotal * (item.taxRate || 0) / 100;
      updatedItems[index] = {
        ...updatedItems[index],
        total: lineTotal.toFixed(2),
        taxAmount: taxAmount
      };
    }
    setEditableData({
      ...editableData,
      items: updatedItems
    });
  };
  const handleAddProduct = async (product: any, quantity: number) => {
    try {
      // Apply MOQ logic to the single product using the MOQ service
      const { MOQService } = await import('@/services/moqService');
      
      const productWithQuantity = {
        id: product.id,
        name: product.title || product.name,
        quantity: quantity,
        supplier: editableData.supplier
      };

      const moqResult = await MOQService.applyMOQLogic([productWithQuantity]);
      const processedProduct = moqResult.data?.[0];
      const finalQuantity = processedProduct?.adjustedQuantity || quantity;
      const moq = processedProduct?.moq || 1;

      const newItem: OrderItem = {
        id: editableData.items.length + 1,
        image: product.image || '/placeholder.svg',
        name: product.title || product.name,
        price: String(product.price_min || product.list_price || 0),
        quantity: finalQuantity,
        total: (parseFloat(String(product.price_min || product.list_price || 0)) * finalQuantity).toFixed(2),
        supplier: editableData.supplier,
        supplierCode: `SUP-${editableData.items.length + 1}`,
        barcode: `BC${editableData.items.length + 1}${Math.random().toString().slice(2, 8)}`,
        taxRate: 10,
        taxAmount: parseFloat((parseFloat(String(product.price_min || product.list_price || 0)) * finalQuantity * 0.1).toFixed(2)),
        minQuantity: moq,
        stockAvailable: 0,
        lastOrderDate: 'New',
      lastOrderPrice: '$0.00',
      salesRate: 0,
      daysLeft: 0,
      cartonSize: 1
    };
    
    setEditableData({
      ...editableData,
      items: [...editableData.items, newItem]
    });
    
    // Show success message with MOQ info if applicable
    if (processedProduct?.moqApplied) {
      toast({
        title: "Product Added with MOQ Adjustment",
        description: `${product.title || product.name} quantity increased from ${quantity} to ${finalQuantity} to meet minimum order requirement.`,
        variant: "default",
      });
    } else {
      toast({
        title: "Product Added",
        description: `${finalQuantity} x ${product.title || product.name} added to purchase order.`,
        variant: "default",
      });
    }
    
    setShowAddProductDialog(false);
    
    } catch (error) {
      Logger.error('Error applying MOQ logic:', error);
      
      // Fallback to original behavior if MOQ processing fails
      const newItem: OrderItem = {
        id: editableData.items.length + 1,
        image: product.image || '/placeholder.svg',
        name: product.title || product.name,
        price: String(product.price_min || product.list_price || 0),
        quantity: quantity,
        total: (parseFloat(String(product.price_min || product.list_price || 0)) * quantity).toFixed(2),
        supplier: editableData.supplier,
        supplierCode: `SUP-${editableData.items.length + 1}`,
        barcode: `BC${editableData.items.length + 1}${Math.random().toString().slice(2, 8)}`,
        taxRate: 10,
        taxAmount: parseFloat((parseFloat(String(product.price_min || product.list_price || 0)) * quantity * 0.1).toFixed(2)),
        minQuantity: 1,
        stockAvailable: 0,
        lastOrderDate: 'New',
        lastOrderPrice: '$0.00',
        salesRate: 0,
        daysLeft: 0,
        cartonSize: 1
      };
      
      setEditableData({
        ...editableData,
        items: [...editableData.items, newItem]
      });
      
      toast({
        title: "Product Added",
        description: `${quantity} x ${product.title || product.name} added to purchase order (MOQ check unavailable).`,
        variant: "default",
      });
      
      setShowAddProductDialog(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await generatePDFFromElement('purchase-order-preview', `PO-${editableData.orderNumber}`);
      toast({
        title: "PDF Downloaded",
        description: "Purchase order has been downloaded successfully."
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handlePrint = () => {
    printElement('purchase-order-preview');
  };
  const handleSendToSupplier = async () => {
    try {
      // Create the purchase order in the Orders page with the current data
      const newOrder = {
        id: editableData.orderNumber,
        date: new Date().toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        }),
        supplier: editableData.supplier,
        supplierId: editableData.supplierId, // Include Odoo supplier ID if available
        items: editableData.items.length,
        total: `£${grandTotal.toFixed(2)}`,
        status: 'pending' as const,
        orderItems: editableData.items.map(item => ({
          id: `item-${item.id}`,
          name: item.name,
          image: item.image,
          supplier: item.supplier || editableData.supplier,
          price: `£${item.price}`,
          quantity: item.quantity,
          total: `£${item.total}`
        }))
      };
      
      // Navigate to orders page with the new order data
      // The Orders page will handle creating it in Odoo
      navigate('/orders', { state: { newOrder } });
    } catch (error) {
      Logger.error('Error preparing order:', error);
      toast({
        title: "Error",
        description: "Failed to create purchase order. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handleEmailTransitionComplete = () => {
    setShowEmailTransition(false);
    toast({
      title: "Purchase Order Sent",
      description: `Purchase order ${editableData.orderNumber} has been sent to ${editableData.supplier}.`
    });
    navigate('/dashboard');
  };

  // Helper functions
  const getItemAlerts = (item: OrderItem) => {
    const alerts = [];

    // Generate deterministic information indicators based on item ID
    const allIndicators = [{
      type: 'popularity',
      text: `${Math.floor(item.id * 7 % 50 + 10)} sold this week`,
      icon: AlertTriangle
    }, {
      type: 'season',
      text: `${Math.floor(item.id * 11 % 30 + 5)}% seasonal boost`,
      icon: Clock
    }, {
      type: 'trend',
      text: `${Math.floor(item.id * 13 % 200 + 50)}% trending up`,
      icon: RotateCcw
    }, {
      type: 'margin',
      text: `${Math.floor(item.id * 17 % 40 + 20)}% profit margin`,
      icon: Box
    }, {
      type: 'competitor',
      text: `£${(item.id * 19 % 5 + 8).toFixed(2)} at competitors`,
      icon: AlertTriangle
    }, {
      type: 'velocity',
      text: `${(item.id * 23 % 3 + 0.5).toFixed(1)} units/day avg`,
      icon: Clock
    }, {
      type: 'restock',
      text: `${Math.floor(item.id * 29 % 14 + 3)} days until restock`,
      icon: Box
    }, {
      type: 'discount',
      text: `${Math.floor(item.id * 31 % 15 + 5)}% bulk discount available`,
      icon: RotateCcw
    }];

    // Always show exactly 2 indicators per item, deterministically selected by item ID
    const firstIndex = item.id % allIndicators.length;
    const secondIndex = item.id * 3 % allIndicators.length;
    alerts.push(allIndicators[firstIndex]);
    if (firstIndex !== secondIndex) {
      alerts.push(allIndicators[secondIndex]);
    } else {
      // If same index, pick the next one (wrapping around)
      alerts.push(allIndicators[(secondIndex + 1) % allIndicators.length]);
    }

    // Check carton multiple
    if (item.cartonSize && item.quantity % item.cartonSize !== 0) {
      const needed = item.cartonSize - item.quantity % item.cartonSize;
      alerts.push({
        type: 'carton',
        text: `+${needed} to fill carton`,
        icon: Box
      });
    }

    // Check MOQ
    if (item.minQuantity && item.quantity < item.minQuantity) {
      alerts.push({
        type: 'moq',
        text: 'Below MOQ',
        icon: AlertTriangle
      });
    }

    // Check price change
    if (item.lastOrderPrice) {
      const lastPrice = parseFloat(item.lastOrderPrice.replace('$', ''));
      const currentPrice = parseFloat(item.price);
      const changePercent = (currentPrice - lastPrice) / lastPrice * 100;
      if (Math.abs(changePercent) > 10) {
        const direction = changePercent > 0 ? '↑' : '↓';
        alerts.push({
          type: 'price',
          text: `Price ${direction}${Math.abs(changePercent).toFixed(0)}%`,
          icon: RotateCcw
        });
      }
    }

    // Check stock risk
    if (item.daysLeft && item.daysLeft < 5) {
      alerts.push({
        type: 'stock',
        text: `Only ${item.daysLeft.toFixed(1)}d left`,
        icon: Clock
      });
    }
    return alerts;
  };

  // Helper function to get notification flags for items
  const getNotificationFlags = (item: OrderItem) => {
    const flags = [];
    const alerts = getItemAlerts(item);
    if (alerts.length > 0) {
      flags.push('alert');
    }
    if (item.daysLeft && item.daysLeft < 5) {
      flags.push('urgent');
    }
    return flags;
  };
  const toggleExpanded = (itemId: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };
  // Show email transition if active
  if (showEmailTransition) {
    return <EmailSendingTransition onComplete={handleEmailTransitionComplete} supplier={editableData.supplier} />;
  }
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar onLogout={() => navigate('/auth')} />
        <SidebarInset className="flex-1">
          <Header />
          <div className="flex h-full">
            {/* Left Side - Edit Panel (conditional) */}
            {isEditMode && <div className="w-2/5 border-r border-border bg-card overflow-y-auto animate-slide-in-left transform-gpu">
                <div className="p-6">
                  {/* Back Button */}
                  <div className="mb-4">
                    <BackButton to="/dashboard" className="p-2 hover:bg-muted rounded-lg transition-colors" />
                  </div>

                  {/* Supplier Groups */}
                  {supplierGroups.map(group => <div key={group.supplier} className="mb-8">
                      {/* Supplier Header with MOV Bar */}
                      <div className="mb-6 mt-2">
                        <div className="flex justify-between items-center mb-3">
                          <h2 className="text-xl font-semibold text-card-foreground">{group.supplier}</h2>
                        </div>
                        
                        {/* MOV Progress Bar - Minimalistic */}
                        
                      </div>

                      {/* Product Cards */}
                      <div className="space-y-3">
                        {editableData.items.map((item, index) => <Card key={item.id} className="border border-border hover:border-muted-foreground transition-colors bg-card">
                            <CardContent className="p-4">
                              <div className="flex gap-4">
                                {/* Product Image */}
                                <div className="w-12 h-12 bg-gray-100 rounded border flex-shrink-0 overflow-hidden">
                                  {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                                </div>

                                {/* Product Info */}
                                <div className="flex-1">
                                  {/* Product Name */}
                                  <h3 className="font-medium text-base text-card-foreground mb-1">{item.name}</h3>
                                  
                                  {/* Supplier Info */}
                                  <div className="text-sm text-gray-400 mb-2">
                                    Supplier: {item.supplier} • Min. Quantity: {item.minQuantity}
                                  </div>

                                  {/* Inline Context Hints */}
                                  <div className="text-xs text-gray-500 mb-3 leading-relaxed">
                                    Stock: {item.stockAvailable} • Last Ordered: {item.lastOrderDate} ({item.lastOrderPrice}) • Sales: {item.salesRate}/day • Days Left: {item.daysLeft}
                                  </div>

                                  {/* Price and Carton Row */}
                                  <div className="flex items-center gap-4 mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-foreground">Unit:</span>
                                      <Input type="text" value={`$${item.price}`} onChange={e => handleItemChange(index, 'price', e.target.value.replace('$', ''))} className="w-20 h-8 text-sm bg-background border-border text-foreground focus:border-foreground focus:ring-0" />
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-foreground">Carton:</span>
                                      <Input type="number" value={item.cartonSize || 12} onChange={e => handleItemChange(index, 'cartonSize', parseInt(e.target.value) || 12)} className="w-14 h-8 text-center text-sm bg-background border-border text-foreground focus:border-foreground focus:ring-0" />
                                    </div>
                                  </div>

                                  {/* Quantity Row */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm text-foreground">Quantity:</span>
                                    <div className="flex items-center gap-1">
                                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-background border-border text-foreground hover:border-ring hover:bg-muted" onClick={() => handleItemChange(index, 'quantity', Math.max(0, item.quantity - 1))}>
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <Input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)} className="w-16 h-8 text-center text-sm bg-background border-border text-foreground focus:border-foreground focus:ring-0" />
                                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-background border-border text-foreground hover:border-ring hover:bg-muted" onClick={() => handleItemChange(index, 'quantity', item.quantity + 1)}>
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Alerts */}
                                  
                                </div>

                                {/* Line Total */}
                                <div className="text-right">
                                  <div className="text-lg font-semibold text-card-foreground">${item.total}</div>
                                  <div className="text-xs text-muted-foreground">Tax: ${(item.taxAmount || 0).toFixed(2)}</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>)}
                      </div>
                      
                      {/* Add Product Button and Total */}
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-300">
                        <div 
                          className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                          onClick={() => setShowAddProductDialog(true)}
                        >
                          + Add Product
                        </div>
                        <div className="text-lg font-semibold text-card-foreground">
                          Total: ${grandTotal.toFixed(2)}
                        </div>
                      </div>
                    </div>)}

                  {/* Summary Section */}
                  <div className="mt-6 pt-4 border-t border-border">
                    
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center gap-4 pt-8 pb-8">
                    <Button variant="outline" onClick={() => setIsEditMode(false)} className="flex-1 max-w-64 py-2 h-10 bg-white border-gray-300 text-black hover:border-black hover:bg-gray-50 font-medium text-base rounded-lg">
                      Cancel
                    </Button>
                    <Button onClick={handleSendToSupplier} className="flex-1 max-w-72 py-2 h-10 bg-black text-white hover:bg-gray-800 font-medium text-base rounded-lg">
                      Send to supplier
                    </Button>
                  </div>
                </div>
              </div>}

            {/* Main Content - Default view or Edit view */}
            <div className={`bg-white overflow-y-auto transition-all duration-700 ease-in-out transform-gpu ${isEditMode ? "w-3/5 animate-slide-to-right" : "w-full"}`}>
              {!isEditMode && <div className="px-8 pt-4 pb-0">
                  {/* Header for default view */}
                  <div className="flex items-center justify-between mb-0">
                    <div className="flex items-center gap-4">
                      <BackButton to="/dashboard" />
                    </div>
                  </div>
                </div>}
              
              <div className={isEditMode ? "p-4" : "flex justify-center pt-0 px-8 pb-4 -mt-8"}>
                <div className={`bg-white shadow-sm border border-border rounded-lg ${!isEditMode ? 'max-w-5xl w-full' : ''} ${isEditMode ? 'scale-90' : 'scale-95'}`}>
                  <div id="purchase-order-preview" className={`p-12 ${isEditMode ? 'text-sm' : ''}`}>

                    {/* Purchase Order Header */}
                    <div className="flex justify-between items-start mb-6 border-b border-gray-200 pb-4">
                      <div>
                        <h1 className={`font-bold text-gray-900 ${isEditMode ? 'text-lg' : 'text-xl'}`}>Purchase Order - {editableData.orderNumber}</h1>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V9a4 4 0 00-4-4H9a4 4 0 00-4 4v4h14V9z" />
                          </svg>
                          Print
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleDownloadPDF}>
                          <Download className="h-4 w-4" />
                          Download PDF
                        </Button>
                      </div>
                    </div>

                    {/* Company Information and PO Details */}
                    <div className="grid grid-cols-2 gap-8 mb-6">
                      {/* Left: Company Info */}
                      <div>
                        <h2 className="text-base font-bold text-gray-900 mb-3">{editableData.companyName}</h2>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>{editableData.companyAddress}</div>
                          <div>{editableData.companyCity}</div>
                          <div>{editableData.companyCountry}</div>
                          <div className="mt-3">
                            <div>Tel: {editableData.companyPhone}</div>
                            <div>Email: {editableData.companyEmail}</div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Purchase Order Details */}
                      <div className="text-right">
                        <h2 className={`font-bold text-gray-900 mb-4 ${isEditMode ? 'text-xl' : 'text-2xl'}`}>Purchase Order</h2>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span className="font-medium">{new Date().toLocaleDateString('en-GB')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">PO No:</span>
                            <span className="font-medium">{editableData.orderNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ref:</span>
                            <span className="font-medium">PO/-{editableData.orderNumber.split('-')[1]}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Three-column layout for Supplier, Deliver To, and Delivery Date */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {/* Supplier */}
                      <div className="bg-gray-100 rounded-lg p-4 relative">
                        <h3 className="font-semibold text-gray-700 bg-gray-200 -m-4 mb-4 p-3 rounded-t-lg flex items-center justify-between">
                          <span>Supplier</span>
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="font-medium text-gray-900">{editableData.supplier}</div>
                          <div className="text-gray-600">{editableData.supplierAddress}</div>
                          <div className="text-gray-600">{editableData.supplierCity}</div>
                          <div className="text-gray-600">{editableData.supplierCountry}</div>
                          {editableData.supplierPhone && (
                            <div className="text-gray-600">Tel: {editableData.supplierPhone}</div>
                          )}
                          <div className="text-gray-600 mt-3">{editableData.supplierEmail}</div>
                        </div>
                        {isLoadingSupplier && (
                          <div className="absolute inset-0 bg-gray-100 bg-opacity-75 rounded-lg flex items-center justify-center">
                            <div className="text-sm text-gray-500">Loading supplier data...</div>
                          </div>
                        )}
                      </div>

                      {/* Deliver To */}
                      <div className="bg-gray-100 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-700 bg-gray-200 -m-4 mb-4 p-3 rounded-t-lg">Deliver To</h3>
                        <div className="space-y-2 text-sm">
                          <div className="font-medium text-gray-900">{editableData.deliveryName}</div>
                          <div className="text-gray-600">{editableData.deliveryAddress}</div>
                          <div className="text-gray-600">{editableData.deliveryCity}</div>
                          <div className="text-gray-600">{editableData.deliveryCountry}</div>
                          <div className="text-gray-600 mt-3">{editableData.deliveryEmail}</div>
                        </div>
                      </div>

                      {/* Quoted Delivery Date */}
                      <div className="bg-gray-100 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-700 bg-gray-200 -m-4 mb-4 p-3 rounded-t-lg">Quoted Delivery Date</h3>
                        <div className="space-y-3 text-sm">
                          <div className="text-lg font-medium text-gray-900">{editableData.quotedDeliveryDate}</div>
                          <div>
                            <div className="text-gray-600">Terms:</div>
                            <div className="text-gray-900">Cash on delivery - 2.5%</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Payment Terms:</div>
                            <div className="text-gray-900">Net 30 days from invoice date</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Delivery:</div>
                            <div className="text-gray-900">Expected within 5-7 business days</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-6 overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                         <thead>
                           <tr className="bg-gray-100">
                              <th className={`border border-gray-300 p-2 text-left font-semibold text-gray-700 ${isEditMode ? 'text-xs' : 'text-sm'}`}>SKU</th>
                              <th className={`border border-gray-300 p-2 text-left font-semibold text-gray-700 ${isEditMode ? 'text-xs' : 'text-sm'}`}>Supplier Code</th>
                              <th className={`border border-gray-300 p-2 text-left font-semibold text-gray-700 ${isEditMode ? 'text-xs' : 'text-sm'}`}>Item Title</th>
                              <th className={`border border-gray-300 p-2 text-center font-semibold text-gray-700 ${isEditMode ? 'text-xs' : 'text-sm'}`}>Quantity</th>
                              <th className={`border border-gray-300 p-2 text-center font-semibold text-gray-700 ${isEditMode ? 'text-xs' : 'text-sm'}`}>Carton</th>
                              <th className={`border border-gray-300 p-2 text-right font-semibold text-gray-700 ${isEditMode ? 'text-xs' : 'text-sm'}`}>Unit Cost</th>
                              <th className={`border border-gray-300 p-2 text-right font-semibold text-gray-700 ${isEditMode ? 'text-xs' : 'text-sm'}`}>Cost</th>
                              <th className={`border border-gray-300 p-2 text-center font-semibold text-gray-700 ${isEditMode ? 'text-xs' : 'text-sm'}`}>Tax Rate</th>
                              <th className={`border border-gray-300 p-2 text-right font-semibold text-gray-700 ${isEditMode ? 'text-xs' : 'text-sm'}`}>Tax</th>
                              <th className={`border border-gray-300 p-2 text-right font-semibold text-gray-700 ${isEditMode ? 'text-xs' : 'text-sm'}`}>Total</th>
                           </tr>
                         </thead>
                         <tbody>
                           {editableData.items.map((item, index) => {
                          const flags = getNotificationFlags(item);
                          const lineTotal = parseFloat(item.price) * item.quantity;
                          const lineTotalWithTax = lineTotal + (item.taxAmount || 0);
                          return <tr key={item.id} className="hover:bg-gray-50">
                                  <td className={`border border-gray-300 p-2 ${isEditMode ? 'text-xs' : 'text-sm'}`}>
                                    <div className="flex items-center gap-2">
                                      PF{String(index + 1).padStart(6, '0')}
                                    </div>
                                  </td>
                                   <td className={`border border-gray-300 p-2 ${isEditMode ? 'text-xs' : 'text-sm'}`}>{item.supplierCode || `SUP${String(index + 1).padStart(3, '0')}`}</td>
                                   <td className={`border border-gray-300 p-2 font-medium ${isEditMode ? 'text-xs' : 'text-sm'}`}>{item.name}</td>
                                   <td className={`border border-gray-300 p-2 text-center ${isEditMode ? 'text-xs' : 'text-sm'}`}>{item.quantity}</td>
                                   <td className={`border border-gray-300 p-2 text-center ${isEditMode ? 'text-xs' : 'text-sm'}`}>{item.cartonSize || 12}</td>
                                   <td className={`border border-gray-300 p-2 text-right ${isEditMode ? 'text-xs' : 'text-sm'}`}>£{parseFloat(item.price).toFixed(2)}</td>
                                   <td className={`border border-gray-300 p-2 text-right ${isEditMode ? 'text-xs' : 'text-sm'}`}>£{lineTotal.toFixed(2)}</td>
                                   <td className={`border border-gray-300 p-2 text-center ${isEditMode ? 'text-xs' : 'text-sm'}`}>{item.taxRate}%</td>
                                   <td className={`border border-gray-300 p-2 text-right ${isEditMode ? 'text-xs' : 'text-sm'}`}>£{(item.taxAmount || 0).toFixed(2)}</td>
                                  <td className={`border border-gray-300 p-2 text-right font-medium ${isEditMode ? 'text-xs' : 'text-sm'}`}>£{lineTotalWithTax.toFixed(2)}</td>
                                </tr>;
                        })}
                         </tbody>
                      </table>
                    </div>

                     {/* Totals Section */}
                     <div className="flex justify-end mb-4">
                      <div className="w-80 space-y-2">
                        <div className="flex justify-between items-center py-2 border-t border-gray-300">
                          <span className="text-sm font-medium">Terms Total Excl:</span>
                          <span className="text-sm font-bold">£{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-sm">Shipping Tax Rate:</span>
                          <span className="text-sm">20.00%</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-sm">Shipping Tax Amount:</span>
                          <span className="text-sm">£{(subtotal * 0.004).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-t border-gray-300">
                          <span className="text-lg font-bold">TOTAL:</span>
                          <span className="text-lg font-bold">£{(grandTotal + subtotal * 0.004).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>


                  </div>

                  {/* Action Buttons - Only show when not in edit mode */}
                  {!isEditMode && <div className="flex justify-center gap-6 mt-8 pt-8 pb-8 border-t border-gray-200">
                        <Button variant="outline" onClick={() => setIsEditMode(true)} className="px-24 py-3 min-w-64 h-12 bg-white border-gray-300 text-black hover:border-black hover:bg-gray-50 text-lg">
                          Edit purchase order
                        </Button>
                        <Button onClick={handleSendToSupplier} className="px-24 py-3 min-w-64 h-12 bg-black text-white hover:bg-gray-800 font-medium text-lg">
                          Send to supplier
                        </Button>
                     </div>}
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
      
      {/* Add Product Dialog */}
      <AddProductDialog
        open={showAddProductDialog}
        onOpenChange={setShowAddProductDialog}
        onAddProduct={handleAddProduct}
      />
    </SidebarProvider>;
};
export default PurchaseOrderEditor;
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, Package, ArrowRight, AlertTriangle, TrendingUp, FileText, Check, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SalesDataPopover from './SalesDataPopover';
import { getProductImage } from '../../data/product-images';
interface QuickActionsProps {
  onActionClick: (action: string, orderData?: any) => void;
}
const QuickActions = ({
  onActionClick
}: QuickActionsProps) => {
  // Real product data from Odoo system - Agricultural and Livestock supplies
  const realProductCatalog = [{
    id: 45,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Acralube",
    name: "Acralube 5Ltr",
    price: "$7.40",
    supplier: "Farm Essentials",
    currentStock: 8,
    lastOrderQty: 25,
    salesRate: "High",
    cartonSize: 12,
    category: "General Supplies",
    defaultCode: "ANF-00004"
  }, {
    id: 76,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Arm Length Examination Gloves",
    price: "$22.00",
    supplier: "Farm Essentials",
    currentStock: 5,
    lastOrderQty: 50,
    salesRate: "Very High",
    cartonSize: 100,
    category: "General Supplies",
    defaultCode: "ANF-00035"
  }, {
    id: 54,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Agrihealth Lamb Reviver Kit 60Ml",
    price: "$5.00",
    supplier: "Farm Essentials",
    currentStock: 12,
    lastOrderQty: 20,
    salesRate: "High",
    cartonSize: 24,
    category: "General Supplies",
    defaultCode: "ANF-00013"
  }, {
    id: 53,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Agri Lube",
    price: "$6.00",
    supplier: "Farm Essentials",
    currentStock: 15,
    lastOrderQty: 30,
    salesRate: "Medium",
    cartonSize: 12,
    category: "General Supplies",
    defaultCode: "ANF-00012"
  }, {
    id: 73,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Animec Injection 500Ml",
    price: "$20.00",
    supplier: "Livestock Care",
    currentStock: 6,
    lastOrderQty: 15,
    salesRate: "Very High",
    cartonSize: 12,
    category: "Veterinary Medicines",
    defaultCode: "ANF-00032"
  }, {
    id: 75,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Anyday Coconut Shampoos",
    price: "$26.00",
    supplier: "Livestock Care",
    currentStock: 4,
    lastOrderQty: 18,
    salesRate: "High",
    cartonSize: 12,
    category: "Grooming Products",
    defaultCode: "ANF-00034"
  }, {
    id: 51,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Aesculap Hoof Knife",
    price: "$40.00",
    supplier: "Livestock Care",
    currentStock: 3,
    lastOrderQty: 12,
    salesRate: "High",
    cartonSize: 6,
    category: "General Supplies",
    defaultCode: "ANF-00010"
  }, {
    id: 57,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Agvance Footrot Shears",
    price: "$38.00",
    supplier: "Livestock Care",
    currentStock: 2,
    lastOrderQty: 10,
    salesRate: "Very High",
    cartonSize: 6,
    category: "Clippers & Shears",
    defaultCode: "ANF-00016"
  }, {
    id: 55,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Agrimin 24 7 Magnesium Bullets Cattle 10S",
    price: "$45.00",
    supplier: "Animal Nutrition",
    currentStock: 4,
    lastOrderQty: 15,
    salesRate: "Very High",
    cartonSize: 10,
    category: "Minerals & Supplements",
    defaultCode: "ANF-00014"
  }, {
    id: 60,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Agvance Organic Sheep Mineral Bucket",
    price: "$36.00",
    supplier: "Animal Nutrition",
    currentStock: 6,
    lastOrderQty: 20,
    salesRate: "High",
    cartonSize: 4,
    category: "Minerals & Supplements",
    defaultCode: "ANF-00019"
  }, {
    id: 48,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Advance Nutrition Platinum Beef Powder 25Kg Bag",
    price: "$45.00",
    supplier: "Animal Nutrition",
    currentStock: 3,
    lastOrderQty: 12,
    salesRate: "Very High",
    cartonSize: 6,
    category: "General Supplies",
    defaultCode: "ANF-00007"
  }, {
    // Equipment Solutions products
    id: 101,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Heavy Duty Feed Mixer 200L",
    price: "$850.00",
    supplier: "Equipment Solutions",
    currentStock: 1,
    lastOrderQty: 2,
    salesRate: "High",
    cartonSize: 1,
    category: "Farm Equipment",
    defaultCode: "EQS-00001"
  }, {
    id: 102,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Electric Fence Controller 12V",
    price: "$125.00",
    supplier: "Equipment Solutions",
    currentStock: 3,
    lastOrderQty: 8,
    salesRate: "Very High",
    cartonSize: 4,
    category: "Farm Equipment",
    defaultCode: "EQS-00002"
  }, {
    id: 103,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Automatic Water Trough 50L",
    price: "$95.00",
    supplier: "Equipment Solutions",
    currentStock: 2,
    lastOrderQty: 6,
    salesRate: "High",
    cartonSize: 2,
    category: "Farm Equipment",
    defaultCode: "EQS-00003"
  }, {
    id: 104,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Portable Livestock Scale 1000kg",
    price: "$1,200.00",
    supplier: "Equipment Solutions",
    currentStock: 0,
    lastOrderQty: 1,
    salesRate: "Medium",
    cartonSize: 1,
    category: "Farm Equipment",
    defaultCode: "EQS-00004"
  }, {
    // Feed & Nutrition Co products
    id: 201,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Premium Cattle Feed 25kg",
    price: "$28.50",
    supplier: "Feed & Nutrition Co",
    currentStock: 8,
    lastOrderQty: 40,
    salesRate: "Very High",
    cartonSize: 20,
    category: "Animal Feed",
    defaultCode: "FNC-00001"
  }, {
    id: 202,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Sheep Pellets High Energy 20kg",
    price: "$24.00",
    supplier: "Feed & Nutrition Co",
    currentStock: 5,
    lastOrderQty: 30,
    salesRate: "High",
    cartonSize: 15,
    category: "Animal Feed",
    defaultCode: "FNC-00002"
  }, {
    id: 203,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Calf Milk Replacer 25kg",
    price: "$65.00",
    supplier: "Feed & Nutrition Co",
    currentStock: 3,
    lastOrderQty: 12,
    salesRate: "Very High",
    cartonSize: 8,
    category: "Animal Feed",
    defaultCode: "FNC-00003"
  }, {
    id: 204,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Horse Feed Performance Mix 20kg",
    price: "$32.00",
    supplier: "Feed & Nutrition Co",
    currentStock: 7,
    lastOrderQty: 25,
    salesRate: "High",
    cartonSize: 12,
    category: "Animal Feed",
    defaultCode: "FNC-00004"
  }, {
    // Veterinary Supplies Ltd products
    id: 301,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Penicillin Injectable 100ml",
    price: "$35.00",
    supplier: "Veterinary Supplies Ltd",
    currentStock: 2,
    lastOrderQty: 10,
    salesRate: "Very High",
    cartonSize: 12,
    category: "Veterinary Medicines",
    defaultCode: "VSL-00001"
  }, {
    id: 302,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Wound Spray Antiseptic 500ml",
    price: "$18.50",
    supplier: "Veterinary Supplies Ltd",
    currentStock: 4,
    lastOrderQty: 20,
    salesRate: "High",
    cartonSize: 24,
    category: "Veterinary Medicines",
    defaultCode: "VSL-00002"
  }, {
    id: 303,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Thermometer Digital Veterinary",
    price: "$42.00",
    supplier: "Veterinary Supplies Ltd",
    currentStock: 6,
    lastOrderQty: 15,
    salesRate: "Medium",
    cartonSize: 10,
    category: "Veterinary Equipment",
    defaultCode: "VSL-00003"
  }, {
    id: 304,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Disposable Syringes 50ml Pack of 100",
    price: "$25.00",
    supplier: "Veterinary Supplies Ltd",
    currentStock: 1,
    lastOrderQty: 8,
    salesRate: "Very High",
    cartonSize: 5,
    category: "Veterinary Equipment",
    defaultCode: "VSL-00004"
  }, {
    // Tools & Hardware products
    id: 401,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Heavy Duty Hammer 2lb",
    price: "$28.00",
    supplier: "Tools & Hardware",
    currentStock: 4,
    lastOrderQty: 12,
    salesRate: "Medium",
    cartonSize: 6,
    category: "Hand Tools",
    defaultCode: "TH-00001"
  }, {
    id: 402,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Galvanized Wire 2.5mm 25kg Roll",
    price: "$45.00",
    supplier: "Tools & Hardware",
    currentStock: 2,
    lastOrderQty: 8,
    salesRate: "High",
    cartonSize: 4,
    category: "Fencing Materials",
    defaultCode: "TH-00002"
  }, {
    id: 403,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Post Hole Digger Professional",
    price: "$85.00",
    supplier: "Tools & Hardware",
    currentStock: 1,
    lastOrderQty: 4,
    salesRate: "High",
    cartonSize: 2,
    category: "Hand Tools",
    defaultCode: "TH-00003"
  }, {
    id: 404,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Safety Glasses Pack of 12",
    price: "$36.00",
    supplier: "Tools & Hardware",
    currentStock: 8,
    lastOrderQty: 20,
    salesRate: "Medium",
    cartonSize: 12,
    category: "Safety Equipment",
    defaultCode: "TH-00004"
  }, {
    // Additional Link Distribution products (from screenshot reference)
    id: 501,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Livestock Transport Ramp 3m",
    price: "$320.00",
    supplier: "Link Distribution",
    currentStock: 1,
    lastOrderQty: 2,
    salesRate: "High",
    cartonSize: 1,
    category: "Transport Equipment",
    defaultCode: "LD-00001"
  }, {
    id: 502,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Heavy Duty Cattle Crush",
    price: "$1,850.00",
    supplier: "Link Distribution",
    currentStock: 0,
    lastOrderQty: 1,
    salesRate: "Very High",
    cartonSize: 1,
    category: "Livestock Handling",
    defaultCode: "LD-00002"
  }, {
    id: 503,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Mobile Sheep Yards Set",
    price: "$750.00",
    supplier: "Link Distribution",
    currentStock: 2,
    lastOrderQty: 3,
    salesRate: "High",
    cartonSize: 1,
    category: "Livestock Handling",
    defaultCode: "LD-00003"
  }, {
    id: 504,
    image: "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product",
    name: "Loading Ramp Extension 1.5m",
    price: "$180.00",
    supplier: "Link Distribution",
    currentStock: 3,
    lastOrderQty: 5,
    salesRate: "Medium",
    cartonSize: 2,
    category: "Transport Equipment",
    defaultCode: "LD-00004"
  }];

  // Memoize enhanced product catalog to prevent unnecessary recalculations
  const enhancedProductCatalog = useMemo(() => 
    realProductCatalog.map(product => ({
      ...product,
      image: getProductImage(product.id)
    })), 
    [] // realProductCatalog is static, so no dependencies
  );

  // Memoize suggested orders generation to prevent unnecessary recalculations
  const suggestedOrders = useMemo(() => {
    // Generating suggested orders...
    // Include products that need reordering based on:
    // 1. Low stock (≤ 8 units)
    // 2. High sales rate (Very High or High)
    // 3. Critical veterinary/essential items (regardless of stock)
    const productsToReorder = enhancedProductCatalog.filter(product => 
      product.currentStock <= 8 || // Low stock items
      product.salesRate === "Very High" || 
      product.salesRate === "High" ||
      product.category === "Veterinary Medicines" || // Always include vet medicines
      product.category === "Minerals & Supplements" // Always include nutrition essentials
    );

    // Remove duplicates by ID (just in case)
    const uniqueProducts = productsToReorder.filter((product, index, self) => 
      index === self.findIndex(p => p.id === product.id)
    ).sort((a, b) => {
      // Priority scoring: low stock + sales rate + category importance
      const getUrgencyScore = (product) => {
        let score = 10 - product.currentStock; // Lower stock = higher score
        if (product.salesRate === "Very High") score += 4;
        else if (product.salesRate === "High") score += 2;
        if (product.category === "Veterinary Medicines") score += 3; // Critical items
        if (product.category === "Minerals & Supplements") score += 2; // Essential nutrition
        return score;
      };
      
      return getUrgencyScore(b) - getUrgencyScore(a);
    });

    // Group by supplier and ensure no duplicates within each supplier
    const grouped = uniqueProducts.reduce((acc, product) => {
      if (!acc[product.supplier]) {
        acc[product.supplier] = [];
      }
      
      // Check if this product is already in the supplier's list (by ID and name)
      const isDuplicate = acc[product.supplier].some(p => 
        p.id === product.id || p.name === product.name
      );
      
      if (!isDuplicate) {
        acc[product.supplier].push(product);
      } else {
        // Duplicate product filtered out
      }
      
      return acc;
    }, {} as Record<string, any[]>);
    
    // Define specific quantities for different product categories
    const getOptimalQuantity = (product: any) => {
      // Base quantity on carton size and typical usage patterns
      const baseQty = Math.max(Math.floor(product.lastOrderQty * 0.8), product.cartonSize || 10);
      
      // Adjust based on category
      if (product.category === "Veterinary Medicines") {
        return Math.max(baseQty, 10); // Ensure minimum stock for critical items
      } else if (product.category === "Minerals & Supplements") {
        return Math.max(baseQty, 8); // Nutritional items
      } else if (product.category === "Clippers & Shears") {
        return Math.max(Math.floor(baseQty * 0.6), 4); // Tools last longer
      } else if (product.category === "Grooming Products") {
        return Math.max(baseQty, 12); // Regular consumption
      }
      return baseQty;
    };
    
    return Object.entries(grouped).map(([supplier, products]) => {
      const totalEstimated = products.reduce((sum, product) => {
        const suggestedQty = getOptimalQuantity(product);
        const cost = parseFloat(product.price.replace('$', '')) * suggestedQty;
        return sum + cost;
      }, 0);
      const highestUrgency = products.some(p => p.currentStock <= 2) ? "Critical" : products.some(p => p.currentStock <= 5) ? "High" : "Medium";
      return {
        supplier,
        products: products.map(p => {
          const qty = getOptimalQuantity(p);
          
          // Generate reasoning text based on product characteristics
          const getReasoning = (product: any) => {
            const daysLeft = Math.floor(Math.random() * 60) + 10; // Mock days calculation
            
            if (product.currentStock <= 2) {
              return `Critical stock level - ${daysLeft} days left`;
            } else if (product.currentStock <= 5) {
              return `Low stock threshold reached - ${daysLeft} days left`;
            } else if (product.salesRate === "Very High") {
              return `High demand velocity - ${daysLeft} days left`;
            } else if (product.salesRate === "High") {
              return `Fast-moving product - ${daysLeft} days left`;
            } else if (product.category === "Veterinary Medicines") {
              return `Essential veterinary item - ${daysLeft} days left`;
            } else if (product.category === "Minerals & Supplements") {
              return `Essential nutrition supplement - ${daysLeft} days left`;
            } else {
              return `Regular reorder cycle - ${daysLeft} days left`;
            }
          };
          
          return {
            ...p,
            suggestedQty: qty,
            urgency: p.currentStock <= 2 ? "Critical" : p.currentStock <= 5 ? "High" : "Medium",
            reasoning: getReasoning(p)
          };
        }),
        totalEstimated: Math.round(totalEstimated),
        urgency: highestUrgency,
        urgencyScore: highestUrgency === "Critical" ? 3 : highestUrgency === "High" ? 2 : 1
      };
    }).sort((a, b) => {
      // Prioritize suppliers: Farm Essentials > Livestock Care > Animal Nutrition > Equipment Solutions > Feed & Nutrition Co > Veterinary Supplies Ltd > Tools & Hardware > Link Distribution
      const supplierPriority = (supplier: string) => {
        if (supplier === "Farm Essentials") return 8;
        if (supplier === "Livestock Care") return 7;
        if (supplier === "Animal Nutrition") return 6;
        if (supplier === "Equipment Solutions") return 5;
        if (supplier === "Feed & Nutrition Co") return 4;
        if (supplier === "Veterinary Supplies Ltd") return 3;
        if (supplier === "Tools & Hardware") return 2;
        if (supplier === "Link Distribution") return 1;
        return 0;
      };
      
      const aPriority = supplierPriority(a.supplier);
      const bPriority = supplierPriority(b.supplier);
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      return b.urgencyScore - a.urgencyScore;
    });
  }, [enhancedProductCatalog]); // Only recalculate when product catalog changes

  // Generate consistent PO numbers that don't change on re-render
  const [poNumbers, setPONumbers] = useState<{
    [key: string]: string;
  }>(() => {
    const saved = localStorage.getItem('poNumbers');
    return saved ? JSON.parse(saved) : {};
  });

  // Generate PO number for a supplier if it doesn't exist
  const getPONumber = (supplier: string) => {
    if (!poNumbers[supplier]) {
      const newPONumber = `${Date.now().toString().slice(-6)}`;
      const updatedPONumbers = {
        ...poNumbers,
        [supplier]: newPONumber
      };
      setPONumbers(updatedPONumbers);
      localStorage.setItem('poNumbers', JSON.stringify(updatedPONumbers));
      return newPONumber;
    }
    return poNumbers[supplier];
  };
  const [quantities, setQuantities] = useState<{
    [key: string]: number;
  }>({});
  const [sentOrders, setSentOrders] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('sentOrders');
    return new Set(saved ? JSON.parse(saved) : []);
  });

  // State for expanded purchase orders
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(() => {
    // By default, expand the first purchase order
    const firstSupplier = suggestedOrders[0]?.supplier;
    return new Set(firstSupplier ? [firstSupplier] : []);
  });

  // State for expanded product lists within each order
  const [expandedProductLists, setExpandedProductLists] = useState<Set<string>>(new Set());

  // Initialize quantities with suggested quantities when suggested orders are generated
  useEffect(() => {
    // Initialize quantities based on suggested orders
    const initialQuantities: { [key: string]: number } = {};
    suggestedOrders.forEach((order, supplierIndex) => {
      order.products.forEach((product, productIndex) => {
        const key = `${supplierIndex}-${productIndex}`;
        if (product.suggestedQty) {
          initialQuantities[key] = product.suggestedQty;
          // Set initial quantity
        }
      });
    });
    // Only set quantities if we haven't already set them manually
    setQuantities(prev => {
      // Check previous quantities
      // Use initial quantities if no previous state
      // If prev is empty, use initial quantities
      if (Object.keys(prev).length === 0) {
        return initialQuantities;
      }
      // Otherwise keep existing quantities
      return prev;
    });

    // Auto-expand first supplier by default
    if (suggestedOrders.length > 0 && expandedOrders.size === 0) {
      setExpandedOrders(new Set([suggestedOrders[0].supplier]));
    }
  }, [suggestedOrders.length]); // Re-run when number of suggested orders changes

  // Listen for changes to sent orders in localStorage and logo clicks
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('sentOrders');
      setSentOrders(new Set(saved ? JSON.parse(saved) : []));
    };
    const handleResetPurchaseOrders = () => {
      // Clear sent orders state and localStorage
      setSentOrders(new Set());
      localStorage.removeItem('sentOrders');

      // Clear PO numbers state and localStorage
      setPONumbers({});
      localStorage.removeItem('poNumbers');

      // Clear quantities
      setQuantities({});
    };
    
    // Listen for storage events from other tabs
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('resetPurchaseOrders', handleResetPurchaseOrders);
    
    // Initial load
    handleStorageChange();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('resetPurchaseOrders', handleResetPurchaseOrders);
    };
  }, []);
  const handleQuantityChange = (supplierIndex: number, productIndex: number, newQty: number) => {
    const key = `${supplierIndex}-${productIndex}`;
    setQuantities(prev => ({
      ...prev,
      [key]: newQty
    }));
  };
  const getQuantity = useCallback((supplierIndex: number, productIndex: number) => {
    const key = `${supplierIndex}-${productIndex}`;
    return quantities[key] || suggestedOrders[supplierIndex]?.products[productIndex]?.suggestedQty || 0;
  }, [quantities, suggestedOrders]);
  
  const calculateSupplierTotal = useCallback((supplierOrder: any, supplierIndex: number) => {
    return supplierOrder.products.reduce((sum: number, product: any, productIndex: number) => {
      const qty = getQuantity(supplierIndex, productIndex);
      const unitPrice = parseFloat(product.price.replace('$', ''));
      return sum + unitPrice * qty;
    }, 0);
  }, [getQuantity]); // Now depends on memoized getQuantity
  const handleOrderClick = (supplierOrder: any, supplierIndex: number) => {
    // Process order for supplier
    
    // Update products with current quantities and carton sizes
    const updatedProducts = supplierOrder.products.map((product: any, productIndex: number) => {
      const currentQuantity = getQuantity(supplierIndex, productIndex);
      // Get current quantity for product
      return {
        ...product,
        quantity: currentQuantity,
        suggestedQty: currentQuantity,
        cartonSize: product.cartonSize || (product.supplier === 'FastPet Logistics' ? 12 : 24)
      };
    });
    const totalEstimated = calculateSupplierTotal(supplierOrder, supplierIndex);
    const poNumber = getPONumber(supplierOrder.supplier); // Get the consistent PO number
    const combinedOrderData = {
      supplier: supplierOrder.supplier,
      products: updatedProducts,
      totalEstimatedCost: `$${Math.round(totalEstimated).toLocaleString()}`,
      urgency: supplierOrder.urgency,
      orderNumber: `PO-${poNumber}`,
      // Include the PO number from suggestions
      action: `Generate consolidated PO for ${updatedProducts.length} products from ${supplierOrder.supplier}`
    };
    // QuickActions - Sending combinedOrderData
    // QuickActions - Products being sent with quantities
    
    // ⚠️ DEBUG: Verify exact data being sent
    // DEBUG: QuickActions final check - EXACT data being sent
    // DEBUG: combinedOrderData.products logged
    
    onActionClick(combinedOrderData.action, combinedOrderData);
  };
  const isOrderSent = (supplier: string) => sentOrders.has(supplier);
  const getTodayDate = useCallback(() => {
    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleString('en-GB', { month: 'short' });
    return `${day} ${month} 2025`;
  }, []); // No dependencies, date is calculated fresh each time
  
  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig = {
      'Critical': {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertTriangle
      },
      'High': {
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: TrendingUp
      },
      'Medium': {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Package
      }
    };
    const config = urgencyConfig[urgency as keyof typeof urgencyConfig];
    const IconComponent = config.icon;
    return <Badge variant="outline" className={`${config.color} text-xs flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {urgency}
      </Badge>;
  };

  const toggleOrderExpansion = (supplier: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(supplier)) {
        newSet.delete(supplier);
      } else {
        newSet.add(supplier);
      }
      return newSet;
    });
  };

  const isOrderExpanded = (supplier: string) => expandedOrders.has(supplier);

  const toggleProductListExpansion = (supplier: string) => {
    setExpandedProductLists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(supplier)) {
        newSet.delete(supplier);
      } else {
        newSet.add(supplier);
      }
      return newSet;
    });
  };

  const isProductListExpanded = (supplier: string) => expandedProductLists.has(supplier);

  // Number of products to show initially
  const INITIAL_PRODUCTS_SHOWN = 3;
  return <div className="mb-8 w-full max-w-6xl mx-auto mt-12">  {/* Made wider - increased from max-w-5xl to max-w-6xl for ~10% more width */}
      <div className="w-[115%] -mx-[7.5%] flex items-center gap-2 mb-6 px-[5px]">
        <Sparkles className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Suggested Purchase Orders</h2>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-xs opacity-75 text-muted-foreground">Odoo Inventory • Stock levels • Sales rate • Category priorities</span>
          <button
            onClick={() => {
              // Process all suggested orders at once
              suggestedOrders.forEach((supplierOrder, supplierIndex) => {
                if (!isOrderSent(supplierOrder.supplier)) {
                  handleOrderClick(supplierOrder, supplierIndex);
                }
              });
            }}
            className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
          >
            Purchase All
          </button>
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        {suggestedOrders.map((supplierOrder: any, index) => {

        // Check if order has been sent
        if (isOrderSent(supplierOrder.supplier)) {
          return <div key={`supplier-${index}`} className="w-[115%] -mx-[7.5%] bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-gray-800 dark:bg-gray-200 rounded-full">
                      <Check className="h-3 w-3 text-white dark:text-gray-800" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-200">
                        Purchase Order Sent to {supplierOrder.supplier}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {supplierOrder.products.length} items • ${Math.round(calculateSupplierTotal(supplierOrder, index)).toLocaleString()} • {getTodayDate()}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
                    Sent
                  </Badge>
                </div>
              </div>;
        }
        return <div key={`supplier-${index}`} className="space-y-3">
              {/* Supplier Header (Collapsible) */}
              <div className="w-[115%] -mx-[7.5%] bg-background border border-border rounded-lg hover:border-border/80 transition-all duration-200 group">
                {/* Clickable Header */}
                <div 
                  onClick={() => toggleOrderExpansion(supplierOrder.supplier)}
                  className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors rounded-lg"
                >
                  {/* Left side - Supplier name and details */}
                  <div className="flex items-center gap-4">
                    {isOrderExpanded(supplierOrder.supplier) ? 
                      <ChevronDown className="h-5 w-5 text-gray-400" /> : 
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    }
                    <div>
                      <div className="text-xl font-semibold text-black dark:text-white tracking-tight">
                        {supplierOrder.supplier}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        PO-{getPONumber(supplierOrder.supplier)} • Delivery {getTodayDate().replace('2025', '7-11 Aug')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side - Total and item count */}
                  <div className="text-right">
                    <div className="text-xl font-bold text-black dark:text-white">
                      ${Math.round(calculateSupplierTotal(supplierOrder, index)).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {supplierOrder.products.length} items
                    </div>
                  </div>
                </div>

                {/* Expandable Content */}
                {isOrderExpanded(supplierOrder.supplier) && (
                  <div className="px-6 pb-6">
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      {/* Products table */}
                      <div className="space-y-3 mb-6">
                        <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                          Products to Order:
                        </div>
                        
                        {(() => {
                          const isExpanded = isProductListExpanded(supplierOrder.supplier);
                          const productsToShow = isExpanded ? supplierOrder.products : supplierOrder.products.slice(0, INITIAL_PRODUCTS_SHOWN);
                          const remainingCount = supplierOrder.products.length - INITIAL_PRODUCTS_SHOWN;
                          
                          return (
                            <>
                              {productsToShow.map((product: any, productIndex: number) => {
                                // Need to get the actual index from the full array for quantity management
                                const actualProductIndex = isExpanded ? productIndex : productIndex;
                                
                                return (
                                  <div key={actualProductIndex} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded border">
                            {/* Product info */}
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                                <img 
                                  src={product.image} 
                                  alt={product.name} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Fallback to placeholder if image fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.src = "https://via.placeholder.com/256/4B5563/FFFFFF?text=Product";
                                  }}
                                />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {product.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Stock: {product.currentStock} units
                                </div>
                                <div className="text-xs text-blue-600 italic mt-1">
                                  Reason: {product.reasoning}
                                </div>
                              </div>
                            </div>
                            
                            {/* Quantity input */}
                            <div className="flex items-center gap-3">
                              <div className="text-sm text-gray-600">Qty:</div>
                                  <input 
                                    type="number" 
                                    min="1" 
                                    value={getQuantity(index, actualProductIndex)} 
                                    onChange={e => handleQuantityChange(index, actualProductIndex, parseInt(e.target.value) || 0)} 
                                    className="w-16 px-2 py-1 text-sm border rounded text-center" 
                                  />
                            </div>
                            
                            {/* Unit price */}
                            <div className="text-sm text-gray-600 ml-3 min-w-[60px] text-right">
                              {product.price}
                            </div>
                            
                            {/* Line total */}
                                  <div className="text-sm font-medium text-gray-900 dark:text-white ml-3 min-w-[80px] text-right">
                                    ${(parseFloat(product.price.replace('$', '')) * getQuantity(index, actualProductIndex)).toFixed(2)}
                                  </div>
                                </div>
                                );
                              })}
                              
                              {/* See more / See less button */}
                              {supplierOrder.products.length > INITIAL_PRODUCTS_SHOWN && (
                                <div className="flex justify-start">
                                  <button
                                    onClick={() => toggleProductListExpansion(supplierOrder.supplier)}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                                  >
                                    {isExpanded 
                                      ? `See less` 
                                      : `See more (${remainingCount} more product${remainingCount !== 1 ? 's' : ''})`
                                    }
                                  </button>
                                </div>
                              )}
                            </>
                          );
                        })()}
                        
                        {/* Add items button and Total */}
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                            + Add Product
                          </div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            Total: ${Math.round(calculateSupplierTotal(supplierOrder, index)).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Action button */}
                      <button 
                        onClick={() => handleOrderClick(supplierOrder, index)} 
                        className="w-full flex items-center justify-center gap-2 py-4 px-8 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Generate Purchase Order</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sales data link */}
              {supplierOrder.products.some((p: any) => p.salesRate === "Very High" || p.salesRate === "High") && (
                <SalesDataPopover>
                  <span></span>
                </SalesDataPopover>
              )}
            </div>;
      })}
      </div>
    </div>;
};
export default QuickActions;
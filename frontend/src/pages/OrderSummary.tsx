import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Filter, Trash2, Plus, Minus, CheckCircle, MessageSquare, Eye, X, Loader2 } from 'lucide-react';
import BackButton from "@/components/ui/back-button";
import { useToast } from "@/hooks/use-toast";
import MovProgressBar from '@/components/MovProgressBar';
import { Button } from "@/components/ui/button";
import OrderProcessingTransition from '@/components/OrderProcessingTransition';
import PurchaseOrderGenerationTransition from '@/components/PurchaseOrderGenerationTransition';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from '@/components/dashboard/AppSidebar';
import { supabase } from '@/integrations/supabase/client';
import { useVectorSearch } from '@/hooks/useVectorSearch';
import { useMOQLogic } from '@/hooks/useMOQLogic';
import { Logger } from '@/services/Logger';
import type { VectorProduct as SearchProduct, SearchStrategy } from '@/types/search.types';
import { useOpenAIQueryParser, parsedQueryToVectorSearchParams } from '@/hooks/useOpenAIQueryParser';
import SearchPerformanceMonitor from '@/components/search/SearchPerformanceMonitor';
import SimilarProducts from '@/components/search/SimilarProducts';
import { AddProductDialog } from '@/components/orders/AddProductDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Product {
  id: number;
  name: string;
  image: string;
  supplier: string;
  minQuantity: number;
  unitPrice: string;
  quantity: number;
  moq?: number; // Minimum Order Quantity from Odoo
  moqApplied?: boolean; // Whether MOQ was applied
  originalQuantity?: number; // Original requested quantity
  moqSource?: 'odoo' | 'default' | 'fallback'; // Source of MOQ data
}

const OrderSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { processProductsWithMOQ, isProcessing: isMOQProcessing } = useMOQLogic();
  const { parseQueryAsync } = useOpenAIQueryParser();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('query') || '';
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [selectedProductImage, setSelectedProductImage] = useState("/lovable-uploads/a25deb07-bdcd-40e4-a79f-6afecbdd777e.png");
  const [showProcessingTransition, setShowProcessingTransition] = useState(false);
  const [showPOTransition, setShowPOTransition] = useState(false);
  const [isSpecificOrder, setIsSpecificOrder] = useState(false);
  const [searchResultsLoaded, setSearchResultsLoaded] = useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [isPerformingInitialSearch, setIsPerformingInitialSearch] = useState(false);
  const [moqProcessingInfo, setMoqProcessingInfo] = useState<{
    moqDataFetched: boolean;
    moqAdjustmentsMade: number;
    fallbackUsed: boolean;
    processingTime: number;
  } | null>(null);

  // Initialize vector search hook
  const {
    searchByVendor,
    setSearchQuery,
    setSearchStrategy,
    products: searchResults,
    isLoading: isSearching,
    error: searchError,
    performanceMetrics,
    trackSearchAnalytics,
    getSimilarProducts,
    advancedSearchAsync
  } = useVectorSearch({
    defaultStrategy: 'hybrid',
    onSuccess: (response) => {
      // Vector search successful
      if (response.products.length) {
        handleSearchResults(response.products);
        // Track analytics
        trackSearchAnalytics(response.query, response.total_results);
      }
    },
    onError: (error) => {
      Logger.error("Vector search failed:", error);
      toast({
        title: "Search Error",
        description: "Failed to search products. Using default catalog.",
        variant: "destructive"
      });
    }
  });
  
  // Function to perform search from URL query
  const performSearchFromQuery = async (query: string) => {
    try {
      // Show loading state
      setIsPerformingInitialSearch(true);
      setSearchResultsLoaded(false);
      setIsSpecificOrder(true);
      
      // Step 1: Parse the query with OpenAI
      const parsedData = await parseQueryAsync(query);
      
      if (!parsedData || !parsedData.products || !Array.isArray(parsedData.products)) {
        Logger.error("OrderSummary: Invalid parsed data structure", { parsedData });
        setFashionForwardProducts([]);
        setSearchResultsLoaded(true);
        setIsPerformingInitialSearch(false);
        toast({
          title: "No products found",
          description: "Use the add product button to add products manually.",
          variant: "default",
        });
        return;
      }
      
      // Step 2: Convert to search parameters and search
      const searchParamsArray = parsedQueryToVectorSearchParams(parsedData);
      
      // Perform parallel vector searches for all products
      const searchPromises = searchParamsArray.map(params => 
        advancedSearchAsync(params).catch(error => {
          Logger.error("OrderSummary: Error searching for product", error);
          return null;
        })
      );
      
      const searchResponses = await Promise.all(searchPromises);
      
      // Collect all search results
      let searchResults = searchParamsArray.map((params, index) => {
        const response = searchResponses[index];
        if (response && response.products && response.products.length > 0) {
          const product = response.products[0];
          return {
            ...product,
            quantity: params.quantity
          };
        }
        return null;
      }).filter(result => result !== null);
      
      // Step 3: Apply MOQ logic
      if (searchResults.length > 0) {
        try {
          const moqResult = await processProductsWithMOQ(searchResults);
          searchResults = moqResult.products;
          setMoqProcessingInfo(moqResult.moqInfo);
        } catch (error) {
          Logger.error('OrderSummary: MOQ processing failed', error);
        }
      }
      
      // Handle the results
      handleSearchResults(searchResults);
      setSearchResultsLoaded(true);
      setIsPerformingInitialSearch(false);
      
      // Show toast if no results
      if (searchResults.length === 0) {
        toast({
          title: "No products found",
          description: "Use the add product button to add products manually.",
          variant: "default",
        });
      }
      
    } catch (error) {
      Logger.error("OrderSummary: Error processing query", error);
      setFashionForwardProducts([]);
      setSearchResultsLoaded(true);
      setIsSpecificOrder(true);
      setIsPerformingInitialSearch(false);
      toast({
        title: "Error processing search",
        description: "Please try searching from the dashboard.",
        variant: "destructive",
      });
    }
  };

  // Handle search results
  const handleSearchResults = (products: SearchProduct[]) => {
    // Handle search results
    
    // For search results, use the specific order UI which shows products in a simple format
    if (products.length > 0) {
      // Transform and set the products for display
      const transformedProducts = transformSearchProducts(products);
      // Products transformed
      
      // Use Fashion Forward products state to display search results
      setFashionForwardProducts(transformedProducts);
      setIsSpecificOrder(true);
      setSearchResultsLoaded(true);
    } else {
      // No search results - clear all products to show empty state
      setFashionForwardProducts([]);
      setIndependentSuppliers([]);
      setCommeAvantProducts([]);
      setStellarGoodsProducts([]);
      setNovaBrandsProducts([]);
      setEchoSupplyProducts([]);
      setIsSpecificOrder(true);
      setSearchResultsLoaded(true);
    }
  };

  // Transform search products to match local Product interface
  const transformSearchProducts = (searchProducts: SearchProduct[]): Product[] => {
    return searchProducts.map((sp, index) => ({
      id: typeof sp.id === 'number' ? sp.id : index + 1,
      name: sp.name || sp.title,
      image: sp.image || (sp.images && sp.images.length > 0 ? sp.images[0].src : null) || '/placeholder.svg',
      supplier: sp.supplier || sp.vendor,
      minQuantity: sp.minQuantity || 1,
      unitPrice: sp.unitPrice || (sp.price_min ? `$${sp.price_min.toFixed(2)}` : '$0.00'),
      quantity: sp.quantity || sp.minQuantity || 1,
      moq: sp.moq,
      moqApplied: sp.moqApplied,
      originalQuantity: sp.originalQuantity,
      moqSource: sp.moqSource
    }));
  };

  // Check for specific order data on component mount
  useEffect(() => {
    // "OrderSummary: Checking for stored order data");
    const storedOrderData = sessionStorage.getItem('orderSummaryData');
    // "OrderSummary: Stored data:", storedOrderData);
    
    if (storedOrderData) {
      const orderData = JSON.parse(storedOrderData);
      // "OrderSummary: Parsed data:", orderData);
      
      // Handle new intelligent search data structure
      if (orderData.searchResults && orderData.parsedData) {
        // "OrderSummary: Processing intelligent search results");
        
        // Store MOQ processing info if available
        if (orderData.moqProcessingInfo) {
          setMoqProcessingInfo(orderData.moqProcessingInfo);
        }
        
        // The search results already have the correct quantities from SearchBar
        // Just ensure minQuantity is set
        const enhancedProducts = orderData.searchResults.map((product: SearchProduct) => ({
          ...product,
          minQuantity: product.minQuantity || 1
        }));
        
        // Handle the search results
        handleSearchResults(enhancedProducts);
        
        // Ensure we show the simplified view
        setSearchResultsLoaded(true);
        
        // Clean up sessionStorage
        sessionStorage.removeItem('orderSummaryData');
        return;
      }
      
      // Handle legacy specific order format
      if (orderData.isSpecificOrder) {
        // "OrderSummary: Setting specific order mode");
        setIsSpecificOrder(true);
        setFashionForwardProducts(orderData.products);
        sessionStorage.removeItem('orderSummaryData');
        setSearchResultsLoaded(true);
        return; // Skip search if we have specific order data
      }
    }

    // If we have a search query from URL, perform the search
    if (searchQuery) {
      performSearchFromQuery(searchQuery);
    } else {
      // "OrderSummary: No search query found");
      // Set searchResultsLoaded to true to show empty simplified view
      setSearchResultsLoaded(true);
      setIsSpecificOrder(true);
      setFashionForwardProducts([]);
    }
  }, [searchQuery]);

  // Add Fashion Forward products state
  const [fashionForwardProducts, setFashionForwardProducts] = useState<Product[]>([]);

  const [independentSuppliers, setIndependentSuppliers] = useState<Product[]>([]);

  const [commeAvantProducts, setCommeAvantProducts] = useState<Product[]>([]);

  const [stellarGoodsProducts, setStellarGoodsProducts] = useState<Product[]>([]);

  const [novaBrandsProducts, setNovaBrandsProducts] = useState<Product[]>([]);

  const [echoSupplyProducts, setEchoSupplyProducts] = useState<Product[]>([]);

  const [orderValue, setOrderValue] = useState({
    subtotal: '$24,000.00',
    salesTax: '$2,400.00',
    totalItems: '0',
    shipping: 'FREE',
    grandTotal: '$26,400.00',
    totalSuppliers: '4'
  });

  const thumbnails = [
    "/lovable-uploads/a25deb07-bdcd-40e4-a79f-6afecbdd777e.png",
    "/lovable-uploads/5b596d50-da50-4030-9d26-bf381e82a36c.png",
    "/lovable-uploads/6ea6ab0b-4930-4303-80da-a1685b15c2f3.png",
    "/lovable-uploads/90aa2a49-82df-4998-97ee-c77b558cf526.png",
    "/lovable-uploads/ee5a6158-0f47-49b2-808f-02c56bc0f8d9.png"
  ];

  const extractPrice = (priceString: string): number => {
    return parseFloat(priceString.replace('$', ''));
  };

  const formatPrice = (price: number): string => {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateSectionTotal = (products: Product[]): number => {
    return products.reduce((total, product) => {
      const unitPrice = extractPrice(product.unitPrice);
      return total + (unitPrice * product.quantity);
    }, 0);
  };

  const calculateTotalQuantity = (): number => {
    return [...independentSuppliers, ...commeAvantProducts, 
            ...stellarGoodsProducts, ...novaBrandsProducts, ...echoSupplyProducts].reduce((total, product) => {
      return total + product.quantity;
    }, 0);
  };

  const calculateTotalItems = (): number => {
    return [...independentSuppliers, ...commeAvantProducts,
            ...stellarGoodsProducts, ...novaBrandsProducts, ...echoSupplyProducts].length;
  };

  const calculateGrandTotal = (): number => {
    const subtotal = [...independentSuppliers, ...commeAvantProducts,
                      ...stellarGoodsProducts, ...novaBrandsProducts, ...echoSupplyProducts].reduce((total, product) => {
      const unitPrice = extractPrice(product.unitPrice);
      return total + (unitPrice * product.quantity);
    }, 0);
    
    const salesTax = subtotal * 0.1;
    return subtotal + salesTax;
  };

  const impalaMovTarget = 3250;
  const commeAvantMovTarget = 3000;
  const stellarGoodsMovTarget = 0;
  const novaBrandsMovTarget = 1800;
  const echoSupplyMovTarget = 1200;
  
  const isImpalaMovMet = calculateSectionTotal(independentSuppliers) >= impalaMovTarget;
  const isCommeAvantMovMet = calculateSectionTotal(commeAvantProducts) >= commeAvantMovTarget;
  const isStellarGoodsMovMet = true; // Since no products in Stellar Goods now
  const isNovaBrandsMovMet = calculateSectionTotal(novaBrandsProducts) >= novaBrandsMovTarget;
  const isEchoSupplyMovMet = calculateSectionTotal(echoSupplyProducts) >= echoSupplyMovTarget;
  
  const isPayButtonEnabled = isImpalaMovMet && isCommeAvantMovMet && 
                             isStellarGoodsMovMet && isNovaBrandsMovMet && isEchoSupplyMovMet;

  useEffect(() => {
    calculateTotals();
  }, [independentSuppliers, commeAvantProducts, stellarGoodsProducts, novaBrandsProducts, echoSupplyProducts]);

  const calculateTotals = () => {
    // Calculate subtotal from actual product totals
    let subtotal = 0;
    
    [...independentSuppliers, ...commeAvantProducts, 
     ...stellarGoodsProducts, ...novaBrandsProducts, ...echoSupplyProducts].forEach(product => {
      const unitPrice = extractPrice(product.unitPrice);
      subtotal += unitPrice * product.quantity;
    });

    const salesTax = subtotal * 0.1;
    const grandTotal = subtotal + salesTax;
    const totalItems = calculateTotalItems();
    
    setOrderValue({
      subtotal: formatPrice(subtotal),
      salesTax: formatPrice(salesTax),
      totalItems: totalItems.toString(),
      shipping: 'FREE',
      grandTotal: formatPrice(grandTotal),
      totalSuppliers: '4'
    });
  };

  const handleAddProductFromDialog = async (product: any, quantity: number) => {
    try {
      // Log the product to check vendor field
      console.log("Adding product:", product);
      console.log("Product vendor:", product.vendor);
      
      // Apply MOQ logic to the single product
      const productWithQuantity = {
        id: product.id,
        name: product.title,
        quantity: quantity,
        supplier: product.vendor
      };

      const moqResult = await processProductsWithMOQ([productWithQuantity]);
      const processedProduct = moqResult.products[0];
      const finalQuantity = processedProduct.quantity;

      // Transform the product from search result format to our Product format
      const newProduct: Product = {
        id: product.id,
        name: product.title,
        image: product.images?.[0]?.src || '/placeholder.svg',
        supplier: product.vendor,
        minQuantity: 1,
        unitPrice: product.price_min ? `$${product.price_min.toFixed(2)}` : '$0.00',
        quantity: finalQuantity
      };

      // Add to fashion forward products (used in specific order mode)
      setFashionForwardProducts(prev => [...prev, newProduct]);
      
      // Show success message
      toast({
        title: "Product Added",
        description: `${product.title} added to your order.`,
        variant: "default",
      });
       
    } catch (error) {
      Logger.error('Error applying MOQ logic:', error);
      
      // Fallback to original behavior if MOQ processing fails
      const newProduct: Product = {
        id: product.id,
        name: product.title,
        image: product.images?.[0]?.src || '/placeholder.svg',
        supplier: product.vendor,
        minQuantity: 1,
        unitPrice: product.price_min ? `$${product.price_min.toFixed(2)}` : '$0.00',
        quantity: quantity
      };

      setFashionForwardProducts(prev => [...prev, newProduct]);
      
      toast({
        title: "Product Added",
        description: `${quantity} x ${product.title} added to order.`,
        variant: "default",
      });
    }
    
    // Close the dialog
    setAddProductDialogOpen(false);
  };

  const handleQuantityChange = (productId: number, increment: boolean, productType: 'independent' | 'commeavant' | 'stellargoods' | 'novabrands' | 'echosupply' | 'fashionforward') => {
    let productArray: Product[];
    let setProductArray: React.Dispatch<React.SetStateAction<Product[]>>;
    
    if (productType === 'independent') {
      productArray = independentSuppliers;
      setProductArray = setIndependentSuppliers;
    } else if (productType === 'commeavant') {
      productArray = commeAvantProducts;
      setProductArray = setCommeAvantProducts;
    } else if (productType === 'stellargoods') {
      productArray = stellarGoodsProducts;
      setProductArray = setStellarGoodsProducts;
    } else if (productType === 'novabrands') {
      productArray = novaBrandsProducts;
      setProductArray = setNovaBrandsProducts;
    } else if (productType === 'fashionforward') {
      productArray = fashionForwardProducts;
      setProductArray = setFashionForwardProducts;
    } else {
      productArray = echoSupplyProducts;
      setProductArray = setEchoSupplyProducts;
    }
    
    const updatedProducts = productArray.map(product => {
      if (product.id === productId) {
        // Special handling for Floral Back Tie Tiered Mini Dress (id: 1) - quantities must be multiples of 6
        if (product.id === 1) {
          const currentQuantity = product.quantity;
          let newQuantity;
          
          if (increment) {
            newQuantity = currentQuantity + 6;
          } else {
            newQuantity = Math.max(36, currentQuantity - 6);
          }
          
          if (!increment && currentQuantity <= 36) {
            toast({
              title: "Minimum quantity reached",
              description: "Quantity cannot be less than 36 for this product.",
              variant: "default",
            });
            return product;
          }
          
          return { ...product, quantity: newQuantity };
        } 
        // Special handling for 2021 Pinot Noir Reserve (id: 2) - quantities must be multiples of 24
        else if (product.id === 2) {
          const currentQuantity = product.quantity;
          let newQuantity;
          
          if (increment) {
            newQuantity = currentQuantity + 24;
          } else {
            newQuantity = Math.max(24, currentQuantity - 24);
          }
          
          if (!increment && currentQuantity <= 24) {
            toast({
              title: "Minimum quantity reached",
              description: "Quantity cannot be less than 24 for this product.",
              variant: "default",
            });
            return product;
          }
          
          return { ...product, quantity: newQuantity };
        } else {
          // Regular handling for other products
          const newQuantity = increment ? product.quantity + 1 : Math.max(1, product.quantity - 1);
          
          if (!increment && product.quantity <= 1) {
            toast({
              title: "Minimum quantity reached",
              description: "Quantity cannot be less than 1.",
              variant: "default",
            });
            return product;
          }
          
          return { ...product, quantity: newQuantity };
        }
      }
      return product;
    });
    
    setProductArray(updatedProducts);
  };

  const handleRemoveItem = (productId: number) => {
    if (independentSuppliers.some(p => p.id === productId)) {
      setIndependentSuppliers(independentSuppliers.filter(p => p.id !== productId));
    } else if (commeAvantProducts.some(p => p.id === productId)) {
      setCommeAvantProducts(commeAvantProducts.filter(p => p.id !== productId));
    } else if (stellarGoodsProducts.some(p => p.id === productId)) {
      setStellarGoodsProducts(stellarGoodsProducts.filter(p => p.id !== productId));
    } else if (novaBrandsProducts.some(p => p.id === productId)) {
      setNovaBrandsProducts(novaBrandsProducts.filter(p => p.id !== productId));
    } else {
      setEchoSupplyProducts(echoSupplyProducts.filter(p => p.id !== productId));
    }
    
    toast({
      title: "Item removed",
      description: "The item has been removed from your cart.",
      variant: "default",
    });
  };

  const handlePayNow = () => {
    if (!isPayButtonEnabled) {
      toast({
        title: "Minimum Order Value not met",
        description: "Please ensure you meet the minimum order value for all suppliers.",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare order items data for the PO editor
    const orderItems = [
      ...independentSuppliers.map(product => ({
        id: product.id,
        image: product.image,
        name: product.name,
        price: product.unitPrice,
        quantity: product.quantity,
        total: formatPrice(extractPrice(product.unitPrice) * product.quantity),
        supplier: product.supplier
      })),
      ...commeAvantProducts.map(product => ({
        id: product.id,
        image: product.image,
        name: product.name,
        price: product.unitPrice,
        quantity: product.quantity,
        total: formatPrice(extractPrice(product.unitPrice) * product.quantity),
        supplier: "Comme Avant"
      })),
      ...stellarGoodsProducts.map(product => ({
        id: product.id,
        image: product.image,
        name: product.name,
        price: product.unitPrice,
        quantity: product.quantity,
        total: formatPrice(extractPrice(product.unitPrice) * product.quantity),
        supplier: "Stellar Goods"
      })),
      ...novaBrandsProducts.map(product => ({
        id: product.id,
        image: product.image,
        name: product.name,
        price: product.unitPrice,
        quantity: product.quantity,
        total: formatPrice(extractPrice(product.unitPrice) * product.quantity),
        supplier: "Nova Brands"
      })),
      ...echoSupplyProducts.map(product => ({
        id: product.id,
        image: product.image,
        name: product.name,
        price: product.unitPrice,
        quantity: product.quantity,
        total: formatPrice(extractPrice(product.unitPrice) * product.quantity),
        supplier: "Echo Supply"
      }))
    ];

    // Navigate to PO editor with order data
    navigate('/purchase-order-editor', {
      state: {
        supplier: "Multiple Suppliers", // We'll handle multiple suppliers in the editor
        orderNumber: `PO-${Date.now().toString().slice(-6)}`,
        items: orderItems
      }
    });
  };

  const handleProcessingComplete = () => {
    // Prepare order items data for the confirmation page
    const orderItems = [
      ...independentSuppliers.map(product => ({
        id: product.id,
        image: product.image,
        name: product.name,
        price: product.unitPrice,
        quantity: product.quantity,
        total: formatPrice(extractPrice(product.unitPrice) * product.quantity)
      })),
      ...commeAvantProducts.map(product => ({
        id: product.id,
        image: product.image,
        name: product.name,
        price: product.unitPrice,
        quantity: product.quantity,
        total: formatPrice(extractPrice(product.unitPrice) * product.quantity)
      })),
      ...stellarGoodsProducts.map(product => ({
        id: product.id,
        image: product.image,
        name: product.name,
        price: product.unitPrice,
        quantity: product.quantity,
        total: formatPrice(extractPrice(product.unitPrice) * product.quantity)
      })),
      ...novaBrandsProducts.map(product => ({
        id: product.id,
        image: product.image,
        name: product.name,
        price: product.unitPrice,
        quantity: product.quantity,
        total: formatPrice(extractPrice(product.unitPrice) * product.quantity)
      })),
      ...echoSupplyProducts.map(product => ({
        id: product.id,
        image: product.image,
        name: product.name,
        price: product.unitPrice,
        quantity: product.quantity,
        total: formatPrice(extractPrice(product.unitPrice) * product.quantity)
      }))
    ];
    
    navigate('/order-confirmation', { 
      state: { 
        orderData: {
          subtotal: orderValue.subtotal,
          salesTax: orderValue.salesTax,
          shipping: orderValue.shipping,
          grandTotal: orderValue.grandTotal,
          totalItems: orderValue.totalItems
        },
        orderItems: orderItems
      } 
    });
  };

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
      toast({
        title: "Logged out",
        description: "You have been successfully logged out"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Show processing transition if active
  if (showProcessingTransition) {
    return <OrderProcessingTransition onComplete={handleProcessingComplete} />;
  }

  // Show loading state when performing initial search from URL
  if (isPerformingInitialSearch) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50">
          <AppSidebar onLogout={handleLogout} />
          <SidebarInset>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-lg text-gray-600">Searching for products...</p>
                <p className="text-sm text-gray-500 mt-2">Please wait while we process your request</p>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  // Always use the simplified render for search results
  if (isSpecificOrder || searchResultsLoaded) {
    // "OrderSummary: Rendering specific order UI with products:", fashionForwardProducts);
    
    const subtotal = fashionForwardProducts.reduce((sum, p) => sum + (extractPrice(p.unitPrice) * p.quantity), 0);
    const total = subtotal;
    const currentSupplier = fashionForwardProducts[0]?.supplier || 'Unknown Supplier';
    
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50">
          <AppSidebar onLogout={handleLogout} />
          <SidebarInset>
            <div className="min-h-screen bg-gray-50">
              <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
                <div className="w-full px-4 lg:px-6 xl:px-8">
                  <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                      <SidebarTrigger className="mr-3" />
                      <BackButton to="/dashboard" className="mr-3" />
                      <h1 className="text-xl font-bold text-black">Purchase Order</h1>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </header>

              <main className="w-full max-w-4xl mx-auto px-6 pt-8 pb-8">
                {/* Purchase Order Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-8 py-6 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold text-black mb-2">PURCHASE ORDER</h2>
                        <p className="text-gray-600">PO-{Date.now().toString().slice(-6)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 mb-1">Supplier:</p>
                        <p className="text-lg font-semibold text-black">{currentSupplier}</p>
                      </div>
                    </div>
                  </div>

                  {/* Products to Order Section */}
                  <div className="px-8 py-6">
                    <h3 className="text-lg font-semibold text-black mb-6">Products to Order:</h3>
                    
                    {fashionForwardProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="text-base font-medium text-black">{product.name}</h4>
                            <p className="text-sm text-gray-600">Stock: 3 units</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-8">
                          <div className="text-center">
                            <p className="text-sm text-gray-600 mb-1">Qty:</p>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleQuantityChange(product.id, false, 'fashionforward')}
                                className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-lg font-medium w-8 text-center">{product.quantity}</span>
                              <button
                                onClick={() => handleQuantityChange(product.id, true, 'fashionforward')}
                                className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-sm text-gray-600 mb-1">Price</p>
                            <p className="text-lg font-medium">{product.unitPrice}</p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-sm text-gray-600 mb-1">Total</p>
                            <p className="text-lg font-semibold text-black">
                              ${(extractPrice(product.unitPrice) * product.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add Product Button */}
                    <button 
                      className="w-full mt-6 py-3 px-4 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
                      onClick={() => setAddProductDialogOpen(true)}
                    >
                      + Add Product
                    </button>
                  </div>

                  {/* Order Total */}
                  <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-black">Total: ${total.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    {/* Generate Purchase Order Button */}
                    <Button
                      size="lg"
                      className="w-full h-12 bg-black text-white hover:bg-gray-800 font-medium rounded-lg"
                      onClick={() => {
                        // "Generate PO button clicked in specific order mode");
                        // "Fashion Forward Products:", fashionForwardProducts);
                        // Show transition first
                        setShowPOTransition(true);
                      }}
                    >
                      📄 Generate Purchase Order
                    </Button>
                  </div>
                </div>
              </main>
            </div>
          </SidebarInset>
        </div>
      {/* Purchase Order Generation Transition */}
      {showPOTransition && (
        <PurchaseOrderGenerationTransition
          onComplete={() => {
            // "PO Generation transition completed for specific order");
            // Get current supplier from the first product
            const currentSupplier = fashionForwardProducts[0]?.supplier || 'Unknown Supplier';
            
            // Prepare data for PO editor
            const orderDataToPass = {
              supplier: currentSupplier,
              orderNumber: `PO-${Date.now().toString().slice(-6)}`,
              products: fashionForwardProducts.map(product => ({
                id: product.id,
                title: product.name,
                image: product.image,
                price: product.unitPrice.replace('$', ''),
                estimatedCost: product.unitPrice.replace('$', ''),
                quantity: product.quantity,
                supplier: product.supplier,
                cartonSize: 24
              }))
            };
            
            // "Storing PO data:", orderDataToPass);
            sessionStorage.setItem('purchaseOrderData', JSON.stringify(orderDataToPass));
            navigate('/purchase-order-editor');
          }}
        />
      )}
      
      {/* Add Product Dialog */}
      <AddProductDialog
        open={addProductDialogOpen}
        onOpenChange={setAddProductDialogOpen}
        onAddProduct={handleAddProductFromDialog}
      />
      </SidebarProvider>
    );
  }

  // Show loading state while searching
  if (isSearching && !searchResultsLoaded) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50">
          <AppSidebar onLogout={handleLogout} />
          <SidebarInset>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Searching for products...</p>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar onLogout={handleLogout} />
        <SidebarInset>
          <div className="min-h-screen bg-gray-50 pb-20">
            <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
              <div className="w-full px-4 lg:px-6 xl:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    <SidebarTrigger className="mr-3 transition-all duration-200 ease-in-out hover:scale-105" />
                    <BackButton 
                      to="/dashboard" 
                      className="mr-3 transition-all duration-200 ease-in-out hover:scale-105"
                    />
                    <h1 className="text-xl font-bold text-gray-900">Order Details</h1>
                  </div>
                  <div className="flex items-center space-x-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="px-3 py-1.5 rounded-md border border-gray-300 flex items-center space-x-1.5 bg-white hover:bg-gray-50 transition-all duration-200 ease-in-out hover:shadow-sm text-sm">
                          <Filter size={16} />
                          <span>Filters</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 animate-in fade-in-0 zoom-in-95 duration-200">
                        <DropdownMenuItem className="transition-colors duration-150 ease-in-out">
                          Sort by Price: Low to High
                        </DropdownMenuItem>
                        <DropdownMenuItem className="transition-colors duration-150 ease-in-out">
                          Sort by Price: High to Low
                        </DropdownMenuItem>
                        <DropdownMenuItem className="transition-colors duration-150 ease-in-out">
                          Sort by Quantity
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="transition-colors duration-150 ease-in-out">
                          Filter by Supplier
                        </DropdownMenuItem>
                        <DropdownMenuItem className="transition-colors duration-150 ease-in-out">
                          Filter by Category
                        </DropdownMenuItem>
                        <DropdownMenuItem className="transition-colors duration-150 ease-in-out">
                          Filter by MOV Status
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="transition-colors duration-150 ease-in-out">
                          Show Low Stock Items
                        </DropdownMenuItem>
                        <DropdownMenuItem className="transition-colors duration-150 ease-in-out">
                          Show High Value Items
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </header>

            <main className="w-full px-6 lg:px-12 xl:px-16 pt-6">
              {/* MOQ Processing Info Banner */}
              {moqProcessingInfo && moqProcessingInfo.moqAdjustmentsMade > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Minimum Order Quantities Applied
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          {moqProcessingInfo.moqAdjustmentsMade} product{moqProcessingInfo.moqAdjustmentsMade > 1 ? 's' : ''} 
                          {moqProcessingInfo.moqAdjustmentsMade > 1 ? ' were' : ' was'} adjusted to meet supplier minimum order requirements.
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-xs">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full ${
                            moqProcessingInfo.moqDataFetched 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {moqProcessingInfo.moqDataFetched ? 'Live MOQ Data' : 'Fallback MOQ'}
                          </span>
                          <span className="text-blue-600">
                            Processing time: {moqProcessingInfo.processingTime}ms
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 transition-all duration-300 ease-in-out hover:shadow-sm">
                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Subtotal</p>
                    <p className="font-semibold">{orderValue.subtotal}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sales Tax (10%)</p>
                    <p className="font-semibold">{orderValue.salesTax}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Grand Total</p>
                    <p className="font-semibold">{orderValue.grandTotal}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Items</p>
                    <p className="font-semibold">{orderValue.totalItems}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Suppliers</p>
                    <p className="font-semibold">{orderValue.totalSuppliers}</p>
                  </div>
                </div>
              </div>

              {/* Search Performance Monitor */}
              {searchQuery && performanceMetrics && (
                <SearchPerformanceMonitor
                  performanceMetrics={performanceMetrics}
                  strategy="hybrid"
                  resultsCount={calculateTotalItems()}
                  query={searchQuery}
                  debugInfo={undefined}
                  isVisible={false}
                  className="mb-6"
                />
              )}

              {/* Impala Section (now includes former Bran Marion products) */}
              <div className="mb-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-sm">
                  <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center transition-all duration-200 ease-in-out">
                    <h3 className="font-medium text-gray-900">Impala</h3>
                    <div className="ml-auto flex items-center space-x-3">
                      <MovProgressBar 
                        orderTotal={calculateSectionTotal(independentSuppliers)}
                        movTarget={impalaMovTarget}
                      />
                      <span className="text-sm text-gray-500">MOV: ${impalaMovTarget.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                    {independentSuppliers.map((product) => (
                      <div key={product.id} className="p-4 flex items-start transition-all duration-200 ease-in-out hover:bg-gray-50">
                        <div className="flex-shrink-0 w-20 h-24 mr-4 bg-gray-100 rounded-md overflow-hidden transition-all duration-200 ease-in-out hover:shadow-sm">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 ease-in-out hover:scale-105" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            {product.id === 1 ? (
                              <button 
                                onClick={() => setIsProductDialogOpen(true)}
                                className="text-sm font-medium text-gray-900 truncate hover:text-brand-500 underline text-left transition-colors duration-200 ease-in-out"
                              >
                                {product.name}
                              </button>
                            ) : (
                              <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                            )}
                            <button onClick={() => handleRemoveItem(product.id)} className="text-gray-400 hover:text-brand-500 transition-all duration-200 ease-in-out hover:scale-110">
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Supplier: {product.supplier}</p>
                          <p className="text-sm text-gray-500">Min. Quantity: {product.minQuantity}</p>
                          {product.moq && product.moq > 1 && (
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-blue-600 font-medium">MOQ: {product.moq}</p>
                              {product.moqApplied && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Applied (was {product.originalQuantity})
                                </span>
                              )}
                            </div>
                          )}
                          {/* MOQ Information Display */}
                          {product.moq && product.moq > 1 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 border border-blue-200">
                                MOQ: {product.moq}
                              </span>
                              {product.moqApplied && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 border border-amber-200">
                                  Quantity adjusted from {product.originalQuantity}
                                </span>
                              )}
                              {product.moqSource && product.moqSource !== 'fallback' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 border border-green-200">
                                  Source: {product.moqSource === 'odoo' ? 'Odoo' : 'Default'}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-medium">Unit Price: {product.unitPrice}</span>
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-900 text-sm mr-2">Quantity:</span>
                              <button
                                onClick={() => handleQuantityChange(product.id, false, 'independent')}
                                className="p-1 rounded-md border border-gray-300 hover:bg-gray-100 transition-all duration-150 ease-in-out hover:scale-105"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-sm px-2 transition-all duration-200 ease-in-out">{product.quantity}</span>
                              <button
                                onClick={() => handleQuantityChange(product.id, true, 'independent')}
                                className="p-1 rounded-md border border-gray-300 hover:bg-gray-100 transition-all duration-150 ease-in-out hover:scale-105"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Comme Avant Section */}
              <div className="mb-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-sm">
                  <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center transition-all duration-200 ease-in-out">
                    <h3 className="font-medium text-gray-900">Comme Avant</h3>
                    <div className="ml-auto flex items-center space-x-3">
                      <MovProgressBar 
                        orderTotal={calculateSectionTotal(commeAvantProducts)}
                        movTarget={commeAvantMovTarget}
                      />
                      <span className="text-sm text-gray-500">MOV: ${commeAvantMovTarget.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                    {commeAvantProducts.map((product) => (
                      <div key={product.id} className="p-4 flex items-start transition-all duration-200 ease-in-out hover:bg-gray-50">
                        <div className="flex-shrink-0 w-20 h-24 mr-4 bg-gray-100 rounded-md overflow-hidden transition-all duration-200 ease-in-out hover:shadow-sm">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 ease-in-out hover:scale-105" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                            <button onClick={() => handleRemoveItem(product.id)} className="text-gray-400 hover:text-brand-500 transition-all duration-200 ease-in-out hover:scale-110">
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Supplier: {product.supplier}</p>
                          <p className="text-sm text-gray-500">Min. Quantity: {product.minQuantity}</p>
                          {product.moq && product.moq > 1 && (
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-blue-600 font-medium">MOQ: {product.moq}</p>
                              {product.moqApplied && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Applied (was {product.originalQuantity})
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-medium">Unit Price: {product.unitPrice}</span>
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-900 text-sm mr-2">Quantity:</span>
                              <button
                                onClick={() => handleQuantityChange(product.id, false, 'commeavant')}
                                className="p-1 rounded-md border border-gray-300 hover:bg-gray-100 transition-all duration-150 ease-in-out hover:scale-105"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-sm px-2 transition-all duration-200 ease-in-out">{product.quantity}</span>
                              <button
                                onClick={() => handleQuantityChange(product.id, true, 'commeavant')}
                                className="p-1 rounded-md border border-gray-300 hover:bg-gray-100 transition-all duration-150 ease-in-out hover:scale-105"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Nova Brands Section */}
              <div className="mb-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-sm">
                  <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center transition-all duration-200 ease-in-out">
                    <h3 className="font-medium text-gray-900">Nova Brands</h3>
                    <div className="ml-auto flex items-center space-x-3">
                      <MovProgressBar 
                        orderTotal={calculateSectionTotal(novaBrandsProducts)}
                        movTarget={novaBrandsMovTarget}
                      />
                      <span className="text-sm text-gray-500">MOV: ${novaBrandsMovTarget.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                    {novaBrandsProducts.map((product) => (
                      <div key={product.id} className="p-4 flex items-start transition-all duration-200 ease-in-out hover:bg-gray-50">
                        <div className="flex-shrink-0 w-20 h-24 mr-4 bg-gray-100 rounded-md overflow-hidden transition-all duration-200 ease-in-out hover:shadow-sm">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 ease-in-out hover:scale-105" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                            <button onClick={() => handleRemoveItem(product.id)} className="text-gray-400 hover:text-brand-500 transition-all duration-200 ease-in-out hover:scale-110">
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Supplier: {product.supplier}</p>
                          <p className="text-sm text-gray-500">Min. Quantity: {product.minQuantity}</p>
                          {product.moq && product.moq > 1 && (
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-blue-600 font-medium">MOQ: {product.moq}</p>
                              {product.moqApplied && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Applied (was {product.originalQuantity})
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-medium">Unit Price: {product.unitPrice}</span>
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-900 text-sm mr-2">Quantity:</span>
                              <button
                                onClick={() => handleQuantityChange(product.id, false, 'novabrands')}
                                className="p-1 rounded-md border border-gray-300 hover:bg-gray-100 transition-all duration-150 ease-in-out hover:scale-105"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-sm px-2 transition-all duration-200 ease-in-out">{product.quantity}</span>
                              <button
                                onClick={() => handleQuantityChange(product.id, true, 'novabrands')}
                                className="p-1 rounded-md border border-gray-300 hover:bg-gray-100 transition-all duration-150 ease-in-out hover:scale-105"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Echo Supply Section */}
              <div className="mb-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-sm">
                  <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center transition-all duration-200 ease-in-out">
                    <h3 className="font-medium text-gray-900">Echo Supply</h3>
                    <div className="ml-auto flex items-center space-x-3">
                      <MovProgressBar 
                        orderTotal={calculateSectionTotal(echoSupplyProducts)}
                        movTarget={echoSupplyMovTarget}
                      />
                      <span className="text-sm text-gray-500">MOV: ${echoSupplyMovTarget.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                    {echoSupplyProducts.map((product) => (
                      <div key={product.id} className="p-4 flex items-start transition-all duration-200 ease-in-out hover:bg-gray-50">
                        <div className="flex-shrink-0 w-20 h-24 mr-4 bg-gray-100 rounded-md overflow-hidden transition-all duration-200 ease-in-out hover:shadow-sm">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 ease-in-out hover:scale-105" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                            <button onClick={() => handleRemoveItem(product.id)} className="text-gray-400 hover:text-brand-500 transition-all duration-200 ease-in-out hover:scale-110">
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Supplier: {product.supplier}</p>
                          <p className="text-sm text-gray-500">Min. Quantity: {product.minQuantity}</p>
                          {product.moq && product.moq > 1 && (
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-blue-600 font-medium">MOQ: {product.moq}</p>
                              {product.moqApplied && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Applied (was {product.originalQuantity})
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-medium">Unit Price: {product.unitPrice}</span>
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-900 text-sm mr-2">Quantity:</span>
                              <button
                                onClick={() => handleQuantityChange(product.id, false, 'echosupply')}
                                className="p-1 rounded-md border border-gray-300 hover:bg-gray-100 transition-all duration-150 ease-in-out hover:scale-105"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-sm px-2 transition-all duration-200 ease-in-out">{product.quantity}</span>
                              <button
                                onClick={() => handleQuantityChange(product.id, true, 'echosupply')}
                                className="p-1 rounded-md border border-gray-300 hover:bg-gray-100 transition-all duration-150 ease-in-out hover:scale-105"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-10">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 flex justify-end">
                  <div className="w-64 flex justify-end">
                    <Button
                      size="lg"
                      className="h-12 bg-black text-white hover:bg-gray-800 font-medium transition-all duration-200 transform hover:scale-[1.02]"
                      onClick={handlePayNow}
                    >
                      Generate POs
                    </Button>
                  </div>
                </div>
              </div>
            </main>

            {/* Product Details Dialog */}
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
              <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-300">
                <DialogHeader>
                  <DialogTitle>Product Details</DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col md:flex-row h-full">
                    <div className="flex flex-row md:flex-col gap-2 md:mr-4 mb-4 md:mb-0">
                      {thumbnails.map((thumb, idx) => (
                        <div 
                          key={idx} 
                          className={`w-12 md:w-16 h-16 md:h-20 rounded-md overflow-hidden border cursor-pointer transition-all duration-200 ease-in-out hover:scale-105 ${selectedProductImage === thumb ? 'border-brand-500 shadow-sm' : 'hover:border-brand-500 hover:shadow-sm'}`}
                          onClick={() => setSelectedProductImage(thumb)}
                        >
                          <img src={thumb} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-300 ease-in-out" />
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex-grow flex flex-col h-full">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex-grow transition-all duration-300 ease-in-out hover:shadow-sm">
                        <img
                          src={selectedProductImage}
                          alt="Floral Back Tie Tiered Mini Dress"
                          className="w-full h-full object-cover transition-transform duration-500 ease-in-out"
                        />
                      </div>
                      
                      <div className="border rounded-lg p-4 mt-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex justify-center items-center">
                            <img 
                              src="/lovable-uploads/a9fe6291-ad62-4a09-b635-c551a2d05dc6.png" 
                              alt="Ynique logo" 
                              className="h-3 object-contain" 
                            />
                          </div>
                          
                          <div className="flex justify-center items-center">
                            <img 
                              src="/lovable-uploads/1419346a-c4b9-4c20-b223-7e89dc95dc95.png" 
                              alt="Faire logo" 
                              className="h-24 object-contain" 
                            />
                          </div>
                          
                          <div>
                            <h3 className="font-semibold mb-1">Supplier Details</h3>
                            <p className="text-sm">Name: Ynique</p>
                            <p className="text-sm">Location: France</p>
                            <p className="text-sm">Shipping: From Faire</p>
                            <p className="text-sm">Rating: 4.8 ★ (28)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Floral Back Tie Tiered Mini Dress</h2>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-500 block mb-1">Color</label>
                        <Select defaultValue="green">
                          <SelectTrigger className="w-full transition-all duration-200 ease-in-out hover:shadow-sm">
                            <SelectValue placeholder="Select color" />
                          </SelectTrigger>
                          <SelectContent className="animate-in fade-in-0 zoom-in-95 duration-200">
                            <SelectItem value="green" className="transition-colors duration-150 ease-in-out">Green</SelectItem>
                            <SelectItem value="blue" className="transition-colors duration-150 ease-in-out">Blue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 block mb-1">Quantity</label>
                        <Select defaultValue="6">
                          <SelectTrigger className="w-full transition-all duration-200 ease-in-out hover:shadow-sm">
                            <SelectValue placeholder="Select quantity" />
                          </SelectTrigger>
                          <SelectContent className="animate-in fade-in-0 zoom-in-95 duration-200">
                            <SelectItem value="6" className="transition-colors duration-150 ease-in-out">6 pieces</SelectItem>
                            <SelectItem value="12" className="transition-colors duration-150 ease-in-out">12 pieces</SelectItem>
                            <SelectItem value="18" className="transition-colors duration-150 ease-in-out">18 pieces</SelectItem>
                            <SelectItem value="24" className="transition-colors duration-150 ease-in-out">24 pieces</SelectItem>
                            <SelectItem value="30" className="transition-colors duration-150 ease-in-out">30 pieces</SelectItem>
                            <SelectItem value="36" className="transition-colors duration-150 ease-in-out">36 pieces</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <h3 className="text-sm text-gray-500">Department</h3>
                        <p>Women's Clothing</p>
                      </div>
                      <div>
                        <h3 className="text-sm text-gray-500">Category</h3>
                        <p>Dresses</p>
                      </div>
                    </div>

                    <button className="w-full bg-brand-500 text-white py-3 rounded-lg hover:bg-brand-600 transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-[1.02]">
                      Update Order
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                      <button className="flex items-center justify-center space-x-2 py-2 border rounded-lg hover:bg-gray-50 transition-all duration-200 ease-in-out hover:shadow-sm hover:scale-[1.02]">
                        <MessageSquare className="h-4 w-4" />
                        <span>Message Supplier</span>
                      </button>
                      <button className="flex items-center justify-center space-x-2 py-2 border rounded-lg hover:bg-gray-50 transition-all duration-200 ease-in-out hover:shadow-sm hover:scale-[1.02]">
                        <Eye className="h-4 w-4" />
                        <span>Add to Watch List</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold">Product Description</h3>
                      <p className="text-gray-600">
                        Add a touch of whimsy to your wardrobe with this adorable mini dress, featuring a feminine floral pattern, ruffled details, and a tiered design that creates a playful, flowy silhouette. With a ruched bust, tie strap detail, and back cut-out, this sleeveless dress is a stylish and eye-catching choice for a night out or special occasion.
                      </p>
                    </div>

                    <div className="border rounded-lg p-4 space-y-4">
                      <h3 className="font-semibold">Product Details</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="text-gray-500">Made in</h4>
                          <p>China</p>
                        </div>
                        <div>
                          <h4 className="text-gray-500">Care Instructions</h4>
                          <p>Hand wash</p>
                        </div>
                        <div>
                          <h4 className="text-gray-500">Fabric</h4>
                          <p>100% Polyester</p>
                        </div>
                        <div>
                          <h4 className="text-gray-500">Season</h4>
                          <p>Spring/Summer</p>
                        </div>
                        <div>
                          <h4 className="text-gray-500">Weight</h4>
                          <p>200 g (7.05 oz)</p>
                        </div>
                        <div>
                          <h4 className="text-gray-500">Dimensions</h4>
                          <p>33 x 21 x 1 cm (13 x 8.3 x 0.4 in)</p>
                        </div>
                      </div>
                    </div>

                    {/* Similar Products Section */}
                    <SimilarProducts
                      productId={1}
                      productTitle="Floral Back Tie Tiered Mini Dress"
                      productDescription="Add a touch of whimsy to your wardrobe with this adorable mini dress, featuring a feminine floral pattern, ruffled details, and a tiered design that creates a playful, flowy silhouette."
                      maxResults={4}
                      onProductClick={(product) => {
                        // 'Similar product clicked:', product);
                        toast({
                          title: "Similar Product",
                          description: `You clicked on ${product.title}`,
                          variant: "default"
                        });
                      }}
                      className="mt-6"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default OrderSummary;

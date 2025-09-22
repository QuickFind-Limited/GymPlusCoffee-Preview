import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { CheckCircle, Package } from "lucide-react";

const OrderSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Generate a random order ID
  const generateOrderId = () => {
    return `ORD-${Math.floor(Math.random() * 900000) + 100000}`;
  };

  // Format today's date as a string with 2025 as the year
  const getTodayDate = () => {
    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleString('en-GB', { month: 'short' });
    return `${day} ${month} 2025`;
  };

  const handleViewOrders = () => {
    // Get order data from location state or create default
    const orderData = location.state?.orderData || {};
    
    // Create an order object with the data from checkout
    const newOrder = {
      id: generateOrderId(),
      date: getTodayDate(),
      supplier: 'Multiple Suppliers',
      items: parseInt(orderData.totalItems) || 6,
      total: orderData.grandTotal || '$1,595.50',
      status: 'pending' as const,
      orderItems: location.state?.orderItems || []
    };

    // Navigate to orders page with the new order data
    navigate('/orders', { 
      state: { 
        newOrder: newOrder
      }
    });
  };

  const handlePlaceNewOrder = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="auth-card w-full max-w-md">
        <div className="auth-card-inner text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Orders placed
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base">
              Purchase order emails have been sent.
            </p>
          </div>
          
          <div className="space-y-3 pt-4">
            <Button 
              onClick={handleViewOrders}
              className="auth-button bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              <Package className="w-4 h-4 mr-2" />
              View Orders
            </Button>
            
            <Button 
              onClick={handlePlaceNewOrder}
              variant="ghost"
              className="w-full py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all duration-200"
            >
              Place new order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;

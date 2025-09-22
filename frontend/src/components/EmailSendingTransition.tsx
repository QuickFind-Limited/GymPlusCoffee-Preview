import React, { useState, useEffect } from 'react';
import { Mail, Paperclip, Send, Check } from 'lucide-react';

interface EmailSendingTransitionProps {
  onComplete: () => void;
  supplier?: string;
}

const EmailSendingTransition = ({ onComplete, supplier }: EmailSendingTransitionProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showOrderSent, setShowOrderSent] = useState(false);
  
  const steps = [
    { text: "Generating email", icon: Mail },
    { text: "Attaching purchase order", icon: Paperclip },
    { text: "Sending to supplier", icon: Send }
  ];

  useEffect(() => {
    const intervals = [1500, 2000, 2500]; // Different timing for each step
    
    if (currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, intervals[currentStep]);
      
      return () => clearTimeout(timer);
    } else if (!showOrderSent) {
      // Show "Order Sent" after the last step
      const timer = setTimeout(() => {
        setShowOrderSent(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // After showing "Order Sent", complete the transition
      const timer = setTimeout(() => {
        if (supplier) {
          // Mark this supplier's order as sent in localStorage
          const sentOrders = JSON.parse(localStorage.getItem('sentOrders') || '[]');
          if (!sentOrders.includes(supplier)) {
            sentOrders.push(supplier);
            localStorage.setItem('sentOrders', JSON.stringify(sentOrders));
          }
        }
        onComplete();
      }, 2000); // Reduced to 2 seconds
      
      return () => clearTimeout(timer);
    }
  }, [currentStep, showOrderSent, onComplete, supplier]);

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        {showOrderSent ? (
          <div className="flex items-center justify-center gap-3 mb-8">
            <Check className="h-6 w-6 text-green-600" />
            <h1 className="text-xl font-semibold text-foreground tracking-tight animate-fade-in">
              Order Sent
            </h1>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 mb-8">
            <CurrentIcon className="h-5 w-5 text-foreground" />
            <h1 className="text-xl font-semibold text-foreground tracking-tight animate-fade-in">
              {steps[currentStep].text}
            </h1>
            <div className="w-4 h-4">
              <div className="w-4 h-4 border-2 border-muted border-t-foreground rounded-full animate-spin"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailSendingTransition;

import React, { useState, useEffect } from 'react';
import { FileText, Mail, Send, LoaderCircle, Database } from 'lucide-react';
import Header from '@/components/dashboard/Header';

interface OrderProcessingStep {
  text: string;
  icon: React.ReactNode;
  completed: boolean;
}

const OrderProcessingTransition = ({ onComplete }: { onComplete: () => void }) => {
  const [steps] = useState<OrderProcessingStep[]>([
    { text: "Creating purchase orders...", icon: <FileText size={24} />, completed: false },
    { text: "Gathering supplier email addresses...", icon: <Mail size={24} />, completed: false },
    { text: "Preparing purchase order emails...", icon: <Send size={24} />, completed: false },
    { text: "Building order in ERP", icon: <Database size={24} />, completed: false },
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        // All steps completed, wait a moment then complete
        setTimeout(() => {
          onComplete();
        }, 1000);
      }
    }, 2000); // 2 seconds per step
    
    return () => clearTimeout(timer);
  }, [currentStep, steps.length, onComplete]);
  
  return (
    <div className="fixed inset-0 bg-background flex flex-col z-50">
      <Header />
      
      <div className="flex-grow flex flex-col items-center justify-center">
        <div className="flex items-center gap-4">
          <LoaderCircle className="h-6 w-6 text-black dark:text-white animate-spin" />
          <div className="text-black dark:text-white">
            {steps[currentStep].icon}
          </div>
          <h1 className="text-2xl font-bold text-black dark:text-white tracking-tight">
            {steps[currentStep].text}
          </h1>
        </div>
      </div>
    </div>
  );
};

export default OrderProcessingTransition;

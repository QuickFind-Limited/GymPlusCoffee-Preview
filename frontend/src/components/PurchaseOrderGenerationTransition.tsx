import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';

interface PurchaseOrderGenerationTransitionProps {
  onComplete: () => void;
}

const PurchaseOrderGenerationTransition = ({ onComplete }: PurchaseOrderGenerationTransitionProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    "Identifying SKUs",
    "Fetching supplier email...",
    "Generating purchase order"
  ];

  useEffect(() => {
    const intervals = [1500, 2000, 2500]; // Different timing for each step
    
    if (currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, intervals[currentStep]);
      
      return () => clearTimeout(timer);
    } else {
      // After the last step, wait a bit then call onComplete
      const timer = setTimeout(() => {
        onComplete();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentStep, onComplete]);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <FileText className="h-5 w-5 text-foreground" />
          <h1 className="text-xl font-semibold text-foreground tracking-tight animate-fade-in">
            {steps[currentStep]}
          </h1>
          <div className="w-4 h-4">
            <div className="w-4 h-4 border-2 border-muted border-t-foreground rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderGenerationTransition;
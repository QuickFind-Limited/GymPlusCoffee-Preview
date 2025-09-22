
import React, { useState, useEffect } from 'react';
import { Database, ShieldAlert, FileText, Mail } from 'lucide-react';
import Header from '@/components/dashboard/Header';

interface LoadingStep {
  text: string;
  icon: React.ReactNode;
  completed: boolean;
}

const LoadingTransition = ({ onComplete }: { onComplete: () => void }) => {
  const [steps, setSteps] = useState<LoadingStep[]>([
    { text: "Gathering product details", icon: <Database size={24} />, completed: false },
    { text: "Analysing past orders", icon: <Mail size={24} />, completed: false },
    { text: "Checking for anomalies", icon: <ShieldAlert size={24} />, completed: false },
    { text: "Preparing order details", icon: <FileText size={24} />, completed: false },
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep < steps.length) {
        // Update the current step to completed
        setSteps(prevSteps => 
          prevSteps.map((step, idx) => 
            idx === currentStep ? { ...step, completed: true } : step
          )
        );
        
        // Move to next step after a delay
        if (currentStep < steps.length - 1) {
          setTimeout(() => {
            setCurrentStep(prev => prev + 1);
          }, 250); // Small delay to show completion before moving to next step
        } else {
          // All steps completed
          setTimeout(() => {
            onComplete();
          }, 1000);
        }
      }
    }, currentStep === 0 ? 500 : 3000); // First step starts quickly, others have 3s delay
    
    return () => clearTimeout(timer);
  }, [currentStep, steps.length, onComplete]);
  
  return (
    <div className="fixed inset-0 bg-background flex flex-col z-50">
      <Header />
      
      <div className="flex-grow flex flex-col items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6">
          <div className="space-y-8 mt-8 w-full flex flex-col items-center">
            <div className="w-full max-w-sm pl-16">
              {steps.map((step, index) => (
                <div 
                  key={index} 
                  className={`flex items-center space-x-4 transition-opacity duration-500 mb-8 ${
                    index > currentStep ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  <div className={`relative flex items-center justify-center ${
                    step.completed ? 'text-primary' : 
                    index === currentStep ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    <div className="absolute inset-0 rounded-full bg-background"></div>
                    
                    {index === currentStep && !step.completed && (
                      <div className="absolute inset-0 rounded-full border-2 border-dotted border-primary animate-spin" style={{ animationDuration: '3s' }}></div>
                    )}
                    
                    {step.completed && (
                      <div className="absolute inset-0 rounded-full border-2 border-solid border-primary"></div>
                    )}
                    
                    <div className="relative p-3">
                      {step.icon}
                    </div>
                  </div>
                  <div>
                    <p className={`text-lg font-medium ${
                      step.completed ? 'text-primary' : 
                      index === currentStep ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingTransition;

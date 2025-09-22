
import React, { useState, useEffect } from 'react';
import Header from '@/components/dashboard/Header';

const LoginTransition = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [showBrand, setShowBrand] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    // Progress animation - start immediately
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsComplete(true);
          setTimeout(() => {
            onComplete();
          }, 500);
          return 100;
        }
        return prev + 3;
      });
    }, 30);
    
    return () => {
      clearInterval(progressInterval);
    };
  }, [onComplete]);
  
  return (
    <div className="fixed inset-0 bg-white flex flex-col z-50 transition-all duration-1000">
      {showBrand ? (
        // Brand introduction phase
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center animate-in fade-in-0 scale-in-95 duration-1000">
            <h1 className="text-6xl font-bold text-black tracking-tight mb-4 animate-pulse">
              Source.
            </h1>
            <div className="w-24 h-0.5 bg-black mx-auto animate-in slide-in-from-left-5 duration-700 delay-500"></div>
          </div>
        </div>
      ) : (
        // Loading phase
        <>
          <Header />
          <div className="flex-grow flex items-center justify-center">
            <div className="text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
              <div className="mb-8">
                <h2 className="text-2xl font-medium text-gray-800 mb-6">
                  Welcome to Source
                </h2>
                <div className="w-80 h-1 bg-gray-100 rounded-full mx-auto overflow-hidden">
                  <div 
                    className="h-full bg-black rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LoginTransition;

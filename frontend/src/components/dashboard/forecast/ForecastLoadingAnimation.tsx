/**
 * ForecastLoadingAnimation Component - Loading state with counter and text switching
 * 
 * Backend Integration Point: Shows realistic loading progression for AI forecast generation
 * This component simulates the time needed for real AI model processing
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, LoaderCircle, Timer } from 'lucide-react';

interface ForecastLoadingAnimationProps {
  onComplete: () => void;
  minimumDuration?: number; // in seconds, default 15
}

const ForecastLoadingAnimation: React.FC<ForecastLoadingAnimationProps> = ({ 
  onComplete, 
  minimumDuration = 15 
}) => {
  const [counter, setCounter] = useState(0);
  const [currentText, setCurrentText] = useState('');
  // Stopwatch: shows seconds until generation begins
  useEffect(() => {
    const id = setInterval(() => setCounter((c) => c + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const loadingTexts = [
    'Analyzing historical sales patterns...',
    'Processing seasonal demand trends...',
    'Calculating optimal inventory levels...',
    'Evaluating supplier lead times...',
    'Identifying stockout risks...',
    'Building demand forecasting models...',
    'Optimizing purchase recommendations...',
    'Generating actionable insights...',
    'Finalizing forecast analysis...',
    'Preparing comprehensive report...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(prev => {
        const newCounter = prev + 1;
        
        // Update text every 1.5 seconds
        if (newCounter % 2 === 0) {
          const textIndex = Math.floor((newCounter / 2) - 1) % loadingTexts.length;
          setCurrentText(loadingTexts[textIndex] || loadingTexts[0]);
        }
        
        // Complete after minimum duration
        if (newCounter >= minimumDuration) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 500);
          return newCounter;
        }
        
        return newCounter;
      });
    }, 1000);

    // Set initial text
    setCurrentText(loadingTexts[0]);

    return () => clearInterval(interval);
  }, [minimumDuration, onComplete]);

  return (
    <div className="space-y-4">
      {/* Simple loading indicator like purchase order flow */}
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        <span className="text-sm text-gray-600">Building demand forecasting models...</span>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Timer className="h-3.5 w-3.5" />
          <span>{counter}s</span>
        </div>
      </div>
    </div>
  );
};

export default ForecastLoadingAnimation;
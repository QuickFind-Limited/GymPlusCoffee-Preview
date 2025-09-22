import React, { useState, useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';
/**
 * ReasoningDisplay Component - AI Processing Indicator
 * 
 * BACKEND INTEGRATION NOTES FOR YOAN'S AI:
 * 
 * This component shows AI "thinking" before generating responses. It's designed for real-time LLM integration:
 * 
 * 1. REAL-TIME AI REASONING STAGES:
 *    - Currently uses mock reasoning steps with simulated timing
 *    - Replace getReasoningSteps() with real-time updates from your AI processing pipeline
 *    - Each step represents an actual stage in your LLM's reasoning process
 *    - Steps can be updated live as the AI processes (e.g., "Searching database...", "Analyzing patterns...")
 * 
 * 2. BACKEND STREAM INTEGRATION:
 *    - Component expects an onComplete callback that triggers when reasoning finishes
 *    - onComplete() should initiate the actual LLM response streaming to TypewriterText
 *    - The reasoning-to-response handoff is seamless for users
 *    - generationStarted state controls when spinner stops (when LLM output begins)
 * 
 * 3. DYNAMIC REASONING CONTENT:
 *    - Steps are currently generated based on promptType and query content
 *    - Your backend can send real reasoning steps via WebSocket/SSE
 *    - Each step update should include: {id, text, completed, duration}
 *    - Component automatically handles step progression and timing
 * 
 * 4. BACKEND INTEGRATION EXAMPLE:
 *    ```
 *    // Replace mock steps with real-time updates:
 *    const handleReasoningUpdate = (step: ReasoningStep) => {
 *      setSteps(prev => prev.map(s => s.id === step.id ? step : s));
 *    };
 *    
 *    const handleReasoningComplete = () => {
 *      setGenerationStarted(true);
 *      onComplete(); // Triggers LLM response stream
 *    };
 *    ```
 * 
 * 5. PERFORMANCE NOTES:
 *    - Component auto-hides after reasoning completes to keep UI clean
 *    - Spinner stops exactly when LLM generation begins for smooth transitions
 *    - Label rotation keeps users engaged during longer reasoning processes
 */

interface ReasoningStep {
  id: string;
  text: string;
  completed: boolean;
  duration: number; // ms to complete this step - can be real processing time
}

interface ReasoningDisplayProps {
  promptType: 'forecast' | 'analysis' | 'action' | 'replenishment';
  query: string;
  onComplete: () => void;
}

// Backend Integration Point: These reasoning steps simulate the actual AI analysis process
// In production, these would be replaced with real-time updates from the analysis engine
const getReasoningSteps = (promptType: string, query: string): ReasoningStep[] => {
  const lowerQuery = query.toLowerCase();
  
  if (promptType === 'forecast') {
    const steps: ReasoningStep[] = [
      {
        id: '1',
        text: 'Searching internal data...',
        completed: false,
        duration: 1800
      },
      {
        id: '2', 
        text: 'Looking through NetSuite and Shopify for fleeces/sweatshirts sales history...',
        completed: false,
        duration: 2200
      },
      {
        id: '3',
        text: 'Analyzing stockout patterns',
        completed: false,
        duration: 1500
      }
    ];

    // Add specific steps based on query content
    if (lowerQuery.includes('stockout') || lowerQuery.includes('stock out')) {
      steps.push({
        id: '4',
        text: 'Found 23 SKUs that ran out early last season. Calculating missed sales opportunities...',
        completed: false,
        duration: 2000
      });
    }

    if (lowerQuery.includes('fleece') || lowerQuery.includes('sweatshirt') || lowerQuery.includes('hoodie')) {
      steps.push({
        id: '5',
        text: 'Calculating lost revenue',
        completed: false,
        duration: 1200
      });
      steps.push({
        id: '6',
        text: '6 products missed 4-8 weeks of peak selling. Estimated £48,000 in lost sales.',
        completed: false,
        duration: 1000
      });
      steps.push({
        id: '7',
        text: 'Building size curve',
        completed: false,
        duration: 1500
      });
      steps.push({
        id: '8',
        text: 'Historical mix: S (28%), M (42%), L (30%). Adjusting for stockout bias in larger sizes.',
        completed: false,
        duration: 1200
      });
    }

    steps.push({
      id: 'final',
      text: 'Generating forecast',
      completed: false,
      duration: 800
    });
    
    steps.push({
      id: 'complete',
      text: 'Base (9,500) + Missed sales (2,100) + Growth (2,320) = 13,224 units recommended.',
      completed: false,
      duration: 1000
    });

    return steps;
  }

  if (promptType === 'analysis') {
    return [
      {
        id: '1',
        text: 'Searching product database...',
        completed: false,
        duration: 1200
      },
      {
        id: '2',
        text: 'Cross-referencing sales and inventory data...',
        completed: false,
        duration: 1800
      },
      {
        id: '3',
        text: 'Identifying performance patterns...',
        completed: false,
        duration: 1500
      },
      {
        id: '4',
        text: 'Compiling insights...',
        completed: false,
        duration: 1000
      }
    ];
  }

  if (promptType === 'replenishment') {
    return [
      {
        id: '1',
        text: 'Parsing product requirements...',
        completed: false,
        duration: 1000
      },
      {
        id: '2',
        text: 'Looking up SKUs and pricing...',
        completed: false,
        duration: 1500
      },
      {
        id: '3',
        text: 'Analyzing sales patterns for size distribution...',
        completed: false,
        duration: 1800
      },
      {
        id: '4',
        text: 'Calculating optimal allocation...',
        completed: false,
        duration: 1200
      },
      {
        id: '5',
        text: 'Generating purchase order details...',
        completed: false,
        duration: 1000
      }
    ];
  }

  // Default for other types
  return [
    {
      id: '1',
      text: 'Processing request...',
      completed: false,
      duration: 1000
    },
    {
      id: '2',
      text: 'Analyzing data...',
      completed: false,
      duration: 1200
    },
    {
      id: '3',
      text: 'Preparing response...',
      completed: false,
      duration: 800
    }
  ];
};

const ReasoningDisplay: React.FC<ReasoningDisplayProps> = ({ 
  promptType, 
  query, 
  onComplete 
}) => {
  const [steps, setSteps] = useState<ReasoningStep[]>(() => getReasoningSteps(promptType, query));
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const hasCompletedRef = useRef(false);
  const [label, setLabel] = useState<string>('Processing request');
  const labelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [generationStarted, setGenerationStarted] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const stopwatchRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (currentStepIndex >= steps.length) {
      if (hasCompletedRef.current) return; // Prevent multiple completions
      hasCompletedRef.current = true;
      setIsComplete(true);
      // Wait a moment before calling onComplete to show the final state
      setTimeout(() => {
        setGenerationStarted(true); // Stop spinner when text begins generating
        // Hide the reasoning display after a brief delay once generation starts
        setTimeout(() => {
          setShouldHide(true);
        }, 1000);
        onComplete();
      }, 500);
      return;
    }

    const currentStep = steps[currentStepIndex];
    const timer = setTimeout(() => {
      // Mark current step as completed
      setSteps(prevSteps => 
        prevSteps.map((step, index) => 
          index === currentStepIndex ? { ...step, completed: true } : step
        )
      );

      // Move to next step after a brief pause
      setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, 300);
    }, currentStep.duration);

    return () => clearTimeout(timer);
  }, [currentStepIndex, steps, onComplete]);

  // Label rotation: start with 'Processing request' for 1s, then randomly switch
  useEffect(() => {
    setLabel('Processing request');
    const startTimer = setTimeout(() => {
      const words = ['Searching', 'Understanding'];
      labelIntervalRef.current = setInterval(() => {
        const word = words[Math.floor(Math.random() * words.length)];
        setLabel(word);
      }, 1000);
    }, 1000);

    return () => {
      clearTimeout(startTimer);
      if (labelIntervalRef.current) clearInterval(labelIntervalRef.current);
    };
  }, [promptType, query]);

  // Stop rotation when complete
  useEffect(() => {
    if (isComplete && labelIntervalRef.current) {
      clearInterval(labelIntervalRef.current);
      labelIntervalRef.current = null;
    }
}, [isComplete]);

// Stopwatch: show seconds elapsed until generation starts
useEffect(() => {
  if (generationStarted) {
    if (stopwatchRef.current) {
      clearInterval(stopwatchRef.current);
      stopwatchRef.current = null;
    }
    return;
  }
  stopwatchRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  return () => {
    if (stopwatchRef.current) {
      clearInterval(stopwatchRef.current);
      stopwatchRef.current = null;
    }
  };
}, [generationStarted]);

  // Don't render anything if we should hide
  if (shouldHide) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl">
      {/* Single-line reasoning indicator - larger and closer to main text size */}
      <div className="flex items-center gap-3 text-muted-foreground animate-enter">
        <div className={`w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full ${generationStarted ? '' : 'animate-spin'}`} />
        <p className="text-base pulse">{label}…</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
          <Timer className="h-3.5 w-3.5" />
          <span>{elapsed}s</span>
        </div>
      </div>
    </div>
  );
};

export default ReasoningDisplay;
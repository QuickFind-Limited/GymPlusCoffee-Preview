import React, { useState, useEffect, useRef } from 'react';

/**
 * TypewriterText Component - LLM Integration Ready
 * 
 * BACKEND INTEGRATION NOTES FOR YOAN'S AI:
 * 
 * This component is designed to seamlessly integrate with real LLM streaming responses:
 * 
 * 1. TOKENIZED OUTPUT COMPATIBILITY:
 *    - Currently simulates token-by-token generation with varying delays
 *    - Replace getRandomDelay() with actual token arrival timing from your LLM
 *    - The chunk-based rendering (getChunkSize()) mimics real token streaming
 *    - Each setDisplayedText() call represents receiving a new token/chunk
 * 
 * 2. REAL-TIME STREAMING INTEGRATION:
 *    - Replace setTimeout logic with WebSocket/SSE event handlers
 *    - onUpdate callback fires on each token - use for live scroll-to-bottom
 *    - onComplete callback fires once when stream ends - use for showing action buttons
 *    - displayedText state can be directly fed from streaming token accumulator
 * 
 * 3. PERFORMANCE CONSIDERATIONS:
 *    - Component handles rapid token updates efficiently via React state batching
 *    - Text rendering optimized with whitespace-pre-wrap for formatting preservation
 *    - Cursor animation automatically stops when streaming completes
 * 
 * 4. BACKEND INTEGRATION EXAMPLE:
 *    ```
 *    // Replace the setTimeout logic with:
 *    const handleTokenReceived = (token: string) => {
 *      setDisplayedText(prev => prev + token);
 *      setCurrentIndex(prev => prev + token.length);
 *      onUpdate?.(currentIndex + token.length);
 *    };
 *    
 *    const handleStreamComplete = () => {
 *      onComplete?.();
 *    };
 *    ```
 */

interface TypewriterTextProps {
  text: string;
  className?: string;
  onUpdate?: (length: number) => void; // Called on each token to allow scroll-to-bottom
  onComplete?: () => void; // Called once when LLM stream finishes - shows action buttons
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ text, className = '', onUpdate, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const getRandomDelay = () => {
        // Simulate tokenized generation with varying delays
        const tokenTypes = [
          { delay: 10, probability: 0.45 },  // Very fast tokens
          { delay: 20, probability: 0.30 },  // Fast tokens
          { delay: 40, probability: 0.20 },  // Medium tokens
          { delay: 80, probability: 0.05 },  // Occasional pauses
        ];
        
        const random = Math.random();
        let cumulativeProbability = 0;
        
        for (const tokenType of tokenTypes) {
          cumulativeProbability += tokenType.probability;
          if (random <= cumulativeProbability) {
            return tokenType.delay;
          }
        }
        
        return 20; // Fallback
      };

      const getChunkSize = () => {
        // Sometimes generate multiple characters at once (like partial words/tokens)
        const random = Math.random();
        if (random < 0.4) return 1;      // Single character
        if (random < 0.7) return 2;      // Two characters
        if (random < 0.9) return 3;      // Three characters
        return Math.min(5, text.length - currentIndex); // Up to 5 characters
      };

      const timeout = setTimeout(() => {
        const chunkSize = getChunkSize();
        const nextIndex = Math.min(currentIndex + chunkSize, text.length);
        setDisplayedText(text.slice(0, nextIndex));
        setCurrentIndex(nextIndex);
        onUpdate?.(nextIndex);
      }, getRandomDelay());

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    hasCompletedRef.current = false;
  }, [text]);

  // Fire onComplete once when generation finishes
  useEffect(() => {
    if (currentIndex >= text.length && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onComplete?.();
    }
  }, [currentIndex, text.length, onComplete]);

  return (
    <div className={`break-words leading-relaxed ${className}`}>
      {displayedText.split(/\n\s*\n/).map((paragraph, index) => {
        // Skip empty paragraphs
        if (!paragraph.trim()) return null;
        
        return (
          <div key={index} className="mb-8">
            <div className="whitespace-pre-line leading-8">
              {paragraph}
            </div>
          </div>
        );
      })}
      {currentIndex < text.length && (
        <span className="animate-pulse text-primary inline-block ml-1">|</span>
      )}
    </div>
  );
};

export default TypewriterText;
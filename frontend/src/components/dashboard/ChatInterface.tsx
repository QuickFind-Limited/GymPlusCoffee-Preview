/**
 * ChatInterface Component - Main LLM Integration Hub
 * 
 * BACKEND INTEGRATION NOTES FOR YOAN'S AI:
 * 
 * This is the primary component that orchestrates LLM interactions. It's designed for seamless backend integration:
 * 
 * 1. MESSAGE FLOW ARCHITECTURE:
 *    - ChatMessage interface defines the data structure for all conversations
 *    - Each message has type: 'text' | 'forecast' | 'reasoning' for different response types
 *    - promptType field ('forecast' | 'analysis' | 'action') determines AI processing approach
 *    - Message state management ready for real-time streaming updates
 * 
 * 2. PROMPT CLASSIFICATION SYSTEM:
 *    - determinePromptType() analyzes user input to route to appropriate AI workflows
 *    - "create" -> action flow (purchase orders, automation)
 *    - "show me" -> analysis flow (data queries, reporting)
 *    - "forecast" -> prediction flow (demand planning, projections)
 *    - Your backend can enhance this classification with NLP/intent recognition
 * 
 * 3. REASONING-TO-RESPONSE PIPELINE:
 *    - handleReasoningComplete() is called when AI "thinking" finishes
 *    - This triggers the actual LLM response generation via TypewriterText streaming
 *    - Seamless handoff from reasoning indicator to response generation
 *    - Ready for WebSocket/SSE integration for real-time AI communication
 * 
 * 4. STRUCTURED RESPONSE HANDLING:
 *    - Purchase Order detection (isPurchaseOrderMessage) triggers action buttons
 *    - Content parsing (extractPONumber, extractTotalQuantity, extractTotalValue) for structured data
 *    - Component automatically shows appropriate UI elements based on response content
 *    - Extensible for other structured response types (reports, alerts, etc.)
 * 
 * 5. SCROLL & UX OPTIMIZATION:
 *    - Auto-scroll during text generation keeps user focused on latest content
 *    - finishedMessages state controls when action buttons appear (post-generation)
 *    - History collapse/expand for clean conversation management
 *    - Optimized for long conversation threads and complex responses
 * 
 * 6. BACKEND INTEGRATION EXAMPLE:
 *    ```
 *    // Replace mock responses with real LLM streaming:
 *    const handleLLMResponse = async (query: string, promptType: string) => {
 *      const stream = await yourLLMService.streamResponse(query, promptType);
 *      
 *      for await (const chunk of stream) {
 *        // Update TypewriterText with real tokens
 *        updateResponseContent(chunk.text);
 *        
 *        // Handle structured data extraction
 *        if (chunk.structured_data) {
 *          setStructuredData(chunk.structured_data);
 *        }
 *      }
 *    };
 *    ```
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import TypewriterText from './TypewriterText';
import ForecastPreview from './forecast/ForecastPreview';
import ForecastLoadingAnimation from './forecast/ForecastLoadingAnimation';
import ReasoningDisplay from './ReasoningDisplay';
import PurchaseOrderActions from '../purchase-orders/PurchaseOrderActions';
import { processReplenishmentQuery } from './ReplenishmentOrderParser';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  // Message rendering type. 'text' is default. 'forecast' renders a forecast preview widget
  type?: 'text' | 'forecast' | 'reasoning' | 'forecast-loading';
  // Optional iframe src if user provided an embeddable sheet to preview
  iframeSrc?: string;
  // For reasoning messages - determines the analysis approach
  promptType?: 'forecast' | 'analysis' | 'action' | 'replenishment' | 'financial-target-follow-up';
}

interface ChatInterfaceProps {
  initialQuery?: string;
  onSubmit: (query: string) => void;
}

const ChatInterface = ({ 
  initialQuery, 
  onSubmit
}: ChatInterfaceProps) => {
  console.log('🎯 ChatInterface mounted with initialQuery:', initialQuery);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showHistory, setShowHistory] = useState(true); // When false, only show latest exchange
  const [isCollapsingHistory, setIsCollapsingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [finishedMessages, setFinishedMessages] = useState<Record<string, boolean>>({});
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Load conversation history from localStorage on mount
  useEffect(() => {
    // Don't load history if we have an initial query to process
    if (initialQuery && initialQuery.trim()) {
      // For initial query, start with empty messages to avoid conflicts
      setMessages([]);
      return;
    }
    
    const savedHistory = localStorage.getItem('chat-history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setMessages(parsedHistory.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    } else {
      // Add default greeting message when no history exists
      const greetingMessage: ChatMessage = {
        id: 'greeting',
        content: 'Hey , what can I do for you today Liam?',
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages([greetingMessage]);
    }
  }, [initialQuery]);

  // Save conversation history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat-history', JSON.stringify(messages));
    }
  }, [messages]);

  // Handle scroll to show/hide back to top button
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const scrollTop = scrollContainerRef.current.scrollTop;
        setShowBackToTop(scrollTop > 300); // Show after scrolling 300px
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    console.log('🔧 Initial load effect triggered:', { hasInitialQuery: !!(initialQuery && initialQuery.trim()) });
    
    if (initialQuery && initialQuery.trim()) {
      console.log('🚀 Marking as not initial load');
      // Mark as not initial load since we're handling it specially
      setIsInitialLoad(false);
    }
  }, [initialQuery]);

  // Enhanced effect to handle initial message as first conversation entry
  useEffect(() => {
    console.log('🔍 Initial query effect triggered:', { initialQuery, messagesLength: messages.length });
    
    // Only process if we have an initial query and messages array is empty (after being cleared above)
    if (initialQuery && initialQuery.trim() && messages.length === 0) {
      console.log('✅ Adding initial query as first message:', initialQuery);
      
      // Start with a fresh conversation for the initial query
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: initialQuery.trim(),
        role: 'user',
        timestamp: new Date()
      };
      
      setMessages([userMessage]);
      
      // Process the assistant response after a brief delay
      setTimeout(() => {
        handleInitialQueryResponse(initialQuery.trim());
      }, 500);
    }
  }, [initialQuery, messages.length]);

  // Handle initial query response
  const handleInitialQueryResponse = (query: string) => {
    // Determine response type based on query analysis
    const promptType = determinePromptType(query);
    const iframeTagMatch = query.match(/<iframe[^>]*src=["']([^"']+)["'][^>]*>/i);
    const urlMatch = query.match(/https?:\/\/\S+/i);
    const rawSrc = iframeTagMatch?.[1] || urlMatch?.[0];
    const iframeSrc = rawSrc ? rawSrc.replace(/&amp;/g, '&') : undefined;
    const isEmbedUrl = !!(rawSrc && /docs.google.com\/spreadsheets|pubhtml/i.test(rawSrc));

    if (promptType || iframeTagMatch || isEmbedUrl) {
      // Show reasoning display first for analytical prompts
      setTimeout(() => {
        const reasoningMessage: ChatMessage = {
          id: (Date.now() + Math.random()).toString(),
          content: query,
          role: 'assistant',
          timestamp: new Date(),
          type: 'reasoning',
          promptType: promptType || 'forecast',
          iframeSrc,
        };
        setMessages(prev => [...prev, reasoningMessage]);
      }, 300);
    } else {
      // Default simple bot response for non-analytical queries
      setTimeout(() => {
        // Check if user said "hey" or similar casual greeting
        const lowerQuery = query.toLowerCase().trim();
        let responseText = "I understand your request. For more specific analysis, try using keywords like 'show me', 'analyze', 'create', 'forecast', or 'rank' to help me provide more detailed insights and actions.";
        
        if (lowerQuery === 'hey' || lowerQuery === 'hi' || lowerQuery === 'hello') {
          responseText = "Hey how can i help you today?";
        }
        
        const botResponse: ChatMessage = {
          id: (Date.now() + Math.random()).toString(),
          content: responseText,
          role: 'assistant',
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, botResponse]);
        setFinishedMessages(prev => ({ ...prev, [botResponse.id]: false }));
      }, 1000);
    }
  };

  useEffect(() => {
    // Only scroll to bottom for user-initiated messages, not assistant responses
    // Keep scroll at top for assistant responses unless user manually scrolls
    if (!isInitialLoad && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Only auto-scroll for user messages, not assistant messages
      if (lastMessage?.role === 'user') {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (isInitialLoad && messages.length > 0) {
      // Scroll to top on initial load
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [messages, isInitialLoad]);

  const historyMessages = messages.slice(0, -2);
  const latestMessages = messages.slice(-2);

  // Backend Integration Point: Analyzes prompt to determine appropriate AI reasoning approach
  const determinePromptType = (query: string): 'forecast' | 'analysis' | 'action' | 'replenishment' | null => {
    const lowered = query.toLowerCase();
    console.log('Analyzing query:', query);
    console.log('Lowered query:', lowered);

    // Check for financial target follow-up responses - prioritize this detection
    const hasFinancialNumbers = /\b(25|30|25-30|20|40|15|35)\b/.test(lowered);
    const hasPercentage = lowered.includes('%') || lowered.includes('percent');
    const hasGrowthLanguage = lowered.includes('increase') || lowered.includes('growth') || lowered.includes('target') || lowered.includes('improve');
    const hasTeamContext = lowered.includes('myself and the team') || lowered.includes('looking to get') || lowered.includes('we are looking');
    const hasForecastContext = lowered.includes('forecast') || lowered.includes('build this into');
    
    const isFinancialTargetResponse = (hasFinancialNumbers && hasPercentage && (hasGrowthLanguage || hasForecastContext)) || 
                                     (hasTeamContext && (hasGrowthLanguage || hasPercentage));
    
    console.log('Financial target detection details:', { 
      hasFinancialNumbers, 
      hasPercentage, 
      hasGrowthLanguage, 
      hasTeamContext, 
      hasForecastContext,
      isFinancialTargetResponse 
    });
    
    if (isFinancialTargetResponse) {
      console.log('Detected as financial target - returning forecast');
      return 'forecast'; // Treat as forecast to regenerate with financial targets
    }

    // Check for replenishment purchase order queries first (more specific)
    if (lowered.includes('replenishment') && lowered.includes('purchase order')) {
      console.log('Detected as replenishment');
      return 'replenishment';
    }

    // Explicit keyword routing per product requirements:
    // - "Forecast" -> Forecast generate flow
    // - "Show me" -> Basic prompt (analysis) flow
    // - "Create" -> Action (purchase order) flow
    if (lowered.includes('forecast')) {
      console.log('Detected as regular forecast');
      return 'forecast';
    }
    if (lowered.includes('show me')) {
      console.log('Detected as analysis');
      return 'analysis';
    }
    if (lowered.includes('create')) {
      console.log('Detected as action');
      return 'action';
    }

    console.log('No specific type detected - returning null');
    // Fallback: no special flow
    return null;
  };

  // Utility: detects if a message is a structured Purchase Order so we can show actions below it
  const isPurchaseOrderMessage = (text: string) => {
    return /Purchase Order Details|PO-\d{4}-\d{4}|Note:\s*This order will be assigned PO number/i.test(text);
  };

  // Utility: extracts the PO number (e.g., PO-2025-0847) from the assistant message
  const extractPONumber = (text: string) => {
    const match = text.match(/PO-\d{4}-\d{4}/);
    return match ? match[0] : undefined;
  };

  // Utility: extracts total quantity from PO message (e.g., "Total Quantity: 120 units")
  const extractTotalQuantity = (text: string) => {
    const match = text.match(/Total Quantity:\s*(.+)/i);
    return match ? match[1].trim() : undefined;
  };

  // Utility: extracts total order value from PO message (e.g., "Total Order Value: £2,940.00")
  const extractTotalValue = (text: string) => {
    const match = text.match(/Total Order Value:\s*(.+)/i);
    return match ? match[1].trim() : undefined;
  };

  // Backend Integration Point: Called when reasoning completes to show final result
  const handleReasoningComplete = (query: string, iframeSrc?: string, promptType?: 'forecast' | 'analysis' | 'action' | 'replenishment' | 'financial-target-follow-up') => {
    
    /**
     * BACKEND INTEGRATION NOTES FOR YOAN'S AI - RESPONSE GENERATION:
     * 
     * This function handles the three main AI workflows after reasoning completes:
     * 
     * 1. FORECAST FLOW (promptType === 'forecast'):
     *    - Generates complex analytical responses with structured data outputs
     *    - Should integrate with your forecasting AI models and data analysis engines
     *    - Responses include executive summaries, actionable insights, and file generation
     *    - Replace mock content with real AI-generated forecasts and projections
     *    - Can include embedded charts, tables, and downloadable reports
     * 
     * 2. ANALYSIS FLOW (promptType === 'analysis'): 
     *    - Provides straightforward data analysis and operational insights
     *    - Should connect to your business intelligence and reporting systems
     *    - Responses focus on immediate actionable findings and performance metrics
     *    - Replace mock content with real-time data analysis from your systems
     *    - Optimized for quick decision-making and operational visibility
     * 
     * 3. ACTION FLOW (promptType === 'action'):
     *    - Creates structured documents like purchase orders with embedded actions
     *    - Should integrate with your ERP, procurement, and workflow automation systems
     *    - Responses include structured data that can be parsed and acted upon
     *    - Replace mock PO content with real document generation from your business logic
     *    - Enables direct system integration via action buttons and external links
     * 
     * INTEGRATION PATTERNS:
     * - Replace setTimeout delays with real AI processing time
     * - Add error handling for failed AI responses
     * - Include loading states during actual processing
     * - Support streaming responses for long-running analysis
     * - Add structured data extraction for automated workflows
     */
    
    if (promptType === 'forecast') {
      // Check if this is a financial target follow-up response - use same logic as determinePromptType
      const lowered = query.toLowerCase();
      const hasFinancialNumbers = /\b(25|30|25-30|20|40|15|35)\b/.test(lowered);
      const hasPercentage = lowered.includes('%') || lowered.includes('percent');
      const hasGrowthLanguage = lowered.includes('increase') || lowered.includes('growth') || lowered.includes('target') || lowered.includes('improve');
      const hasTeamContext = lowered.includes('myself and the team') || lowered.includes('looking to get') || lowered.includes('we are looking');
      const hasForecastContext = lowered.includes('forecast') || lowered.includes('build this into') || lowered.includes('take this into account');
      
      const isFinancialTargetResponse = (hasFinancialNumbers && hasPercentage && (hasGrowthLanguage || hasForecastContext)) || 
                                       (hasTeamContext && (hasGrowthLanguage || hasPercentage));
      
      console.log('handleReasoningComplete - Financial target detection:', { 
        hasFinancialNumbers, 
        hasPercentage, 
        hasGrowthLanguage, 
        hasTeamContext, 
        hasForecastContext,
        isFinancialTargetResponse 
      });
      
      if (isFinancialTargetResponse) {
        // FINANCIAL TARGET FOLLOW-UP - Updated forecast with 25% increase target
        // Backend Integration Point: Replace with real AI service that takes financial targets and regenerates forecast
        const financialTargetContent = `Of course, no problem above is a regenerated forecast accounting for a 25% financial increase, lead times have been adjusted along with other critical information to reach this target.

Updated Executive Summary - 25% Growth Target

• Forecast confidence: High probability with adjusted volume projections to meet 25% revenue increase target

• Primary demand drivers: Autumn/Winter categories now targeting 42% YoY growth trajectory (adjusted from 34%), with fleeces leading expansion at 3.1x velocity multiplier

• Lead time risk: Accelerated procurement timeline to 5-month window to support increased volume; recommend 25% safety stock buffer for aggressive growth targets

• Revenue opportunity: Projected £309K incremental revenue vs. last season (+25% target achieved), assuming optimized inventory levels and enhanced marketing investment

• Key assumptions flagged: Growth projections now assume enhanced supply chain capacity, aggressive marketing spend increase, and expanded SKU availability

Actionable Outputs

📊 Generated analysis files:
• Enhanced_Forecast_AW2025_25pct.xlsx - Updated category projections for 25% growth
• Aggressive_Stockout_Prevention_Plan.pdf - Risk mitigation for higher volumes  
• Accelerated_Procurement_Timeline.csv - Optimized ordering schedule for growth targets`;

        // Create updated forecast message with typewriter text effect
        const updatedForecastMessage: ChatMessage = {
          id: (Date.now() + Math.random()).toString(),
          content: financialTargetContent, // Use full content for TypewriterText component
          role: 'assistant',
          timestamp: new Date(),
          type: 'forecast', // Keep as forecast type to show with CSV
          iframeSrc, // Include updated CSV data
        };
        
        setMessages(prev => [...prev, updatedForecastMessage]);
        // Initialize as unfinished so TypewriterText can handle the effect
        setFinishedMessages(prev => ({ ...prev, [updatedForecastMessage.id]: false }));
      } else {
        // ORIGINAL FORECAST FLOW - Complex Analysis & Reporting
        // Backend Integration Point: Replace with real forecasting AI and data analysis
        const advancedMessage: ChatMessage = {
          id: (Date.now() + Math.random()).toString(),
          content: `I've analyzed your complete AW24 sales data to build the initial AW25 buy plan. With the 6-month lead time, you need to place orders by end of July for September delivery.


Key Performance Metrics from Last Year (AW24)


📊 AW24 Actual Performance
Total Units Sold: 9,500 units
Total Revenue: £495,000
Peak Selling Period: Weeks 10–16 (Oct 28 – Dec 15)
Average Weekly Velocity: 365 units/week (when in stock)
Stockout Impact: 23 of 47 SKUs ran out before season end

⚠️ Critical Finding
You lost £48,000 in revenue due to stockouts. During peak weeks, you were selling 520 units/week but couldn't maintain inventory levels.

AW25 Initial Buy Plan – Ready for July Order


📈 Recommended Initial Order
Total Units to Order: 13,224 units (+39% vs AW24)
Order Value: £689,000
Order Deadline: July 31, 2025
Expected Delivery: Early September 2025
Season Coverage: September 2025 – February 2026


What This Forecast Includes
• Core AW24 performers with growth applied
• Recovery units for last year's stockouts (+2,100 units)  
• 2-week safety stock on top 10 items
• Adjusted size curves based on actual sell-through


Top 3 Critical Products to Order Now


1. Oversized Hoodie - Charcoal ⭐YOUR CASH COW
July Order: 3,840 units
Investment: £200k
Why Order Big: Your #1 seller that never stocked out. Consistent 62 units/week all season. This product alone drove 34% of category revenue — protect this momentum.


2. Snap Collar Sweatshirt - Teal 🚨 HIGHEST UPSIDE
July Order: 2,100 units (+40% vs last year)
Investment: £109k
Why Order Big: Ran out in Week 12 last year, missing 6 crucial weeks including Black Friday. True demand is 40% higher than what you sold.


3. Classic Crew Sweatshirt - Grey 💰 VELOCITY SURPRISE
July Order: 1,250 units (+40% vs last year)
Investment: £65k
Why Order Big: Sold 3x faster than forecasted. Ran out Week 10, missing the entire Black Friday period when it could have sold 120+ units in one week alone.


`,
          role: 'assistant',
          timestamp: new Date(),
          type: 'forecast',
          iframeSrc,
        };
        setMessages(prev => [...prev, advancedMessage]);
        // Initialize as unfinished so any action buttons appear after text generation
        setFinishedMessages(prev => ({ ...prev, [advancedMessage.id]: false }));
      }
      
    } else if (promptType === 'analysis') {
      // ANALYSIS FLOW - Operational Insights & Performance Data
      // Backend Integration Point: Replace with real business intelligence and data analysis
      const analysisMessage: ChatMessage = {
        id: (Date.now() + Math.random()).toString(),
        content: `Analysis complete based on latest operational data. Here are the key findings requiring immediate attention.

## **Performance Summary**

• **Top performers**: Hoodies and loungewear categories driving 67% of total volume, with Navy colorway leading at 23% share

• **Inventory status**: Currently maintaining 127 active variants across all categories, with 94% availability rate

• **Quality alerts**: 3 SKUs showing elevated return rates (>12% vs. 3.2% baseline) - investigation initiated

• **Operational efficiency**: Fulfillment rate at 94.2%, exceeding target by 4.2 percentage points

## **Immediate Action Items**

• **Restock priority**: Navy hoodies L/XL sizes showing <2 weeks inventory remaining

• **Quality investigation**: Product #7834 (Grey Sweatshirt) requires immediate supplier review due to 15.3% return rate

• **Growth opportunity**: Fleece category demand up 41% month-over-month - consider expanding size range

• **Performance trend**: 23% overall growth trajectory maintained across best-selling categories`,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, analysisMessage]);
      // Initialize as unfinished so any action buttons appear after text generation
      setFinishedMessages(prev => ({ ...prev, [analysisMessage.id]: false }));
      
    } else if (promptType === 'action') {
      // ACTION FLOW - Document Generation & System Integration
      // Backend Integration Point: Replace with real document generation and ERP integration
      const actionMessage: ChatMessage = {
        id: (Date.now() + Math.random()).toString(),
        content: `I'll create a replenishment purchase order for the Everyday Essentials Hoodie in Navy. Here's what I've prepared:

Purchase Order Details
----------------------------------------------------------------

Product: Everyday Essentials Hoodie, Navy
Total Quantity: 120 units
SKU: EEH-NAVY-001

Size Distribution
Large (L): 48 units (40%)
Extra Large (XL): 72 units (60%)

Based on recent sales data, I've allocated more units to XL as it's been selling 50% faster than Large in this style.

Supplier: Primary Apparel Co.
Expected Delivery: 14–21 days
Unit Cost: £24.50
Total Order Value: £2,940.00

Stock Position After Replenishment
Large: Current 12 → After 60
XL: Current 8 → After 80

This will cover approximately 6 weeks of demand based on current sell-through rates.

Please review and click "Confirm Order" to submit this PO to Odoo, or let me know if you'd like to adjust the quantities.

------------------------------------------------------
Note: This order will be assigned PO number PO-2025-0847 once confirmed.`,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, actionMessage]);
      // Initialize as unfinished so PO action buttons appear only after text generation completes
      setFinishedMessages(prev => ({ ...prev, [actionMessage.id]: false }));
      
    } else if (promptType === 'replenishment') {
      // REPLENISHMENT FLOW - Detailed Purchase Order Generation
      // Backend Integration Point: Replace with real product matching and ERP integration
      const replenishmentResponse = processReplenishmentQuery(query);
      
      if (replenishmentResponse) {
        const replenishmentMessage: ChatMessage = {
          id: (Date.now() + Math.random()).toString(),
          content: replenishmentResponse,
          role: 'assistant',
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, replenishmentMessage]);
        // Initialize as unfinished so PO action buttons appear only after text generation completes
        setFinishedMessages(prev => ({ ...prev, [replenishmentMessage.id]: false }));
      } else {
        // Fallback to regular action flow if replenishment parsing fails
        handleReasoningComplete(query, iframeSrc, 'action');
      }
    }
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
      }
    });
  };

  // Unified pipeline to process any query (initial, quick prompts, or manual submit)
  const processQuery = (query: string) => {
    if (!query.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: query.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    // Immediately hide history when a new prompt is submitted
    setShowHistory(false);
    setIsCollapsingHistory(false);
    setIsInitialLoad(false);

    // Determine response type based on query analysis
    const promptType = determinePromptType(query);
    const iframeTagMatch = query.match(/<iframe[^>]*src=["']([^"']+)["'][^>]*>/i);
    const urlMatch = query.match(/https?:\/\/\S+/i);
    const rawSrc = iframeTagMatch?.[1] || urlMatch?.[0];
    const iframeSrc = rawSrc ? rawSrc.replace(/&amp;/g, '&') : undefined;
    const isEmbedUrl = !!(rawSrc && /docs.google.com\/spreadsheets|pubhtml/i.test(rawSrc));

    if (promptType || iframeTagMatch || isEmbedUrl) {
      // Show reasoning display first for analytical prompts
      setTimeout(() => {
        const reasoningMessage: ChatMessage = {
          id: (Date.now() + Math.random()).toString(),
          content: query,
          role: 'assistant',
          timestamp: new Date(),
          type: 'reasoning',
          promptType: promptType || 'forecast', // default to forecast for iframe/embed URLs
          iframeSrc,
        };
        setMessages(prev => [...prev, reasoningMessage]);
      }, 300);
      // Final response added by handleReasoningComplete when reasoning finishes
    } else {
      // Default simple bot response for non-analytical queries
      setTimeout(() => {
        // Check if user said "hey" or similar casual greeting
        const lowerQuery = query.toLowerCase().trim();
        let responseText = "I understand your request. For more specific analysis, try using keywords like 'show me', 'analyze', 'create', 'forecast', or 'rank' to help me provide more detailed insights and actions.";
        
        if (lowerQuery === 'hey' || lowerQuery === 'hi' || lowerQuery === 'hello') {
          responseText = "Hey how can i help you today?";
        }
        
        const botResponse: ChatMessage = {
          id: (Date.now() + Math.random()).toString(),
          content: responseText,
          role: 'assistant',
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, botResponse]);
        setFinishedMessages(prev => ({ ...prev, [botResponse.id]: false }));
      }, 1000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processQuery(inputValue.trim());
    setInputValue('');
  };
  const quickPrompts = [
    "Show me recent orders",
    "What's available in cleaning supplies?",
    "I need safety equipment",
    "Check inventory status"
  ];

  const handleQuickPrompt = (prompt: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: prompt,
      role: 'user',
      timestamp: new Date()
    };

  setMessages(prev => [...prev, newMessage]);
  // Immediately hide history when new prompt is submitted - no delays or animations
  setShowHistory(false);
  setIsCollapsingHistory(false);
  setIsInitialLoad(false);
  
    // Backend Integration Point: Use same logic as main submit for quick prompts
    const promptType = determinePromptType(prompt);
    const iframeTagMatch = prompt.match(/<iframe[^>]*src=["']([^"']+)["'][^>]*>/i);
    const urlMatch = prompt.match(/https?:\/\/\S+/i);
    const rawSrc = iframeTagMatch?.[1] || urlMatch?.[0];
    const iframeSrc = rawSrc ? rawSrc.replace(/&amp;/g, '&') : undefined;
    const isEmbedUrl = !!(rawSrc && /docs.google.com\/spreadsheets|pubhtml/i.test(rawSrc));

    if (promptType || iframeTagMatch || isEmbedUrl) {
      // Show reasoning display first for analytical prompts
      setTimeout(() => {
        const reasoningMessage: ChatMessage = {
          id: (Date.now() + Math.random()).toString(),
          content: prompt,
          role: 'assistant',
          timestamp: new Date(),
          type: 'reasoning',
          promptType: promptType || 'forecast',
        };
        setMessages(prev => [...prev, reasoningMessage]);
        // Don't auto-scroll for assistant reasoning messages
      }, 300);
      // Note: The final response will be added by handleReasoningComplete when reasoning finishes
    } else {
      // Default simple bot response for non-analytical queries
      setTimeout(() => {
        const botResponse: ChatMessage = {
          id: (Date.now() + Math.random()).toString(),
          content: "I understand you're looking for information. For more detailed analysis, try using specific keywords like 'show me best performers', 'create purchase order', or 'forecast sales'.",
          role: 'assistant',
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, botResponse]);
        // Don't auto-scroll for assistant responses
      }, 1000);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      {/* Messages area - full height when there are messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-36 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <h1 className="text-3xl font-medium mb-2 text-gray-900 dark:text-white">How can I help you today?</h1>
              <p className="text-base mb-8">Ask me anything about procurement, products, or orders.</p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-3xl mx-auto px-4 py-6">
            <div className="space-y-8 transition-all duration-300">
              {showHistory && historyMessages.length > 0 && (
                <div className="space-y-8">
                  {historyMessages.map((message) => (
                    <div key={message.id} className="w-full">
                      {message.role === 'user' ? (
                        <div className="flex justify-end">
                          <div className="max-w-xl bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                            <p className="text-lg font-medium leading-relaxed">{message.content}</p>
                          </div>
                        </div>
                      ) : (
                         <div className="flex justify-start">
                           <div className="max-w-3xl">
                               {message.type === 'forecast' ? (
                                 <ForecastPreview 
                                   query={message.content} 
                                   content={message.content} // Pass content for custom financial target responses
                                   iframeSrc={message.iframeSrc}
                                   onUpdate={() => scrollToBottom()} // Scroll as text is generated
                                   onComplete={() => {
                                     setFinishedMessages(prev => ({ ...prev, [message.id]: true }));
                                   }}
                                 />
                              ) : message.type === 'forecast-loading' ? (
                                <ForecastLoadingAnimation 
                                  onComplete={() => handleReasoningComplete(message.content, message.iframeSrc, message.promptType)}
                                  minimumDuration={15}
                                />
                              ) : message.type === 'reasoning' ? (
                               <ReasoningDisplay 
                                 promptType={message.promptType === 'financial-target-follow-up' ? 'forecast' : (message.promptType || 'forecast')}
                                 query={message.content}
                                 onComplete={() => handleReasoningComplete(message.content, message.iframeSrc, message.promptType === 'financial-target-follow-up' ? 'forecast' : message.promptType)}
                               />
                              ) : (
                                <>
                                  <TypewriterText 
                                    text={message.content} 
                                    className="text-lg font-medium leading-relaxed"
                                    onUpdate={() => scrollToBottom()}
                                    onComplete={() => {
                                      setFinishedMessages(prev => ({ ...prev, [message.id]: true }));
                                      scrollToBottom();
                                    }}
                                  />
                                  {isPurchaseOrderMessage(message.content) && finishedMessages[message.id] && (
                                    <PurchaseOrderActions 
                                      poNumber={extractPONumber(message.content)}
                                      totalQuantity={extractTotalQuantity(message.content)}
                                      totalValue={extractTotalValue(message.content)}
                                      // Backend Integration Point: replace with real Odoo PO URL from backend response
                                      odooUrl={extractPONumber(message.content) ? `https://odoo.example.com/purchase-orders/${extractPONumber(message.content)}` : undefined}
                                    />
                                  )}
                                </>
                             )}
                           </div>
                         </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-8 animate-enter">
                {latestMessages.map((message) => (
                  <div key={message.id} className="w-full">
                    {message.role === 'user' ? (
                      <div className="flex justify-end">
                        <div className="max-w-xl bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                           <p className="text-lg font-medium leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    ) : (
                       <div className="flex justify-start">
                         <div className="max-w-3xl">
                              {message.type === 'forecast' ? (
                                <ForecastPreview 
                                  key={`forecast-${message.id}`} // Stable key to prevent unnecessary re-renders
                                  query={message.content} 
                                  content={message.content} // Pass content for custom financial target responses
                                  iframeSrc={message.iframeSrc}
                                  onUpdate={() => scrollToBottom()} // Scroll as text is generated
                                  onComplete={() => {
                                    setFinishedMessages(prev => ({ ...prev, [message.id]: true }));
                                  }}
                                />
                            ) : message.type === 'forecast-loading' ? (
                              <ForecastLoadingAnimation 
                                onComplete={() => handleReasoningComplete(message.content, message.iframeSrc, message.promptType)}
                                minimumDuration={15}
                              />
                            ) : message.type === 'reasoning' ? (
                               <ReasoningDisplay 
                                 promptType={message.promptType === 'financial-target-follow-up' ? 'forecast' : (message.promptType || 'forecast')}
                                 query={message.content}
                                 onComplete={() => handleReasoningComplete(message.content, message.iframeSrc, message.promptType === 'financial-target-follow-up' ? 'forecast' : message.promptType)}
                               />
                            ) : (
                              <>
                                <TypewriterText 
                                  text={message.content} 
                                  className="text-lg font-medium leading-relaxed"
                                  onUpdate={() => scrollToBottom()}
                                  onComplete={() => {
                                    setFinishedMessages(prev => ({ ...prev, [message.id]: true }));
                                    scrollToBottom();
                                  }}
                                />
                                 {isPurchaseOrderMessage(message.content) && finishedMessages[message.id] && (
                                   <PurchaseOrderActions 
                                     poNumber={extractPONumber(message.content)}
                                     totalQuantity={extractTotalQuantity(message.content)}
                                     totalValue={extractTotalValue(message.content)}
                                     // Backend Integration Point: replace with real Odoo PO URL from backend response
                                     odooUrl={extractPONumber(message.content) ? `https://odoo.example.com/purchase-orders/${extractPONumber(message.content)}` : undefined}
                                   />
                                 )}
                              </>
                           )}
                         </div>
                       </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Back to Top Button - positioned to the left of the prompt box */}
      {showBackToTop && (
        <div className="fixed bottom-20 left-4 z-40">
          <button
            onClick={scrollToTop}
            className="w-10 h-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border border-gray-200 dark:border-gray-700 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-900 transition-colors flex items-center justify-center"
            aria-label="Back to top"
          >
            <ChevronUp className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      )}

      {/* Input area - floating overlay fixed to viewport bottom, ChatGPT-like */}
      <div className="sticky bottom-0 z-50">
        <div className="mx-auto max-w-4xl w-full px-4 pb-4">
          <div className="pointer-events-auto rounded-3xl border-2 border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 shadow-lg">
            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Message..."
                className="w-full pl-4 pr-14 py-4 text-base bg-transparent focus:outline-none focus:border-transparent focus:ring-0 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="absolute bottom-2 right-2 p-2 flex items-center group"
              >
                <div className="p-1.5 rounded-lg bg-primary text-white group-hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <Send className="h-4 w-4" />
                </div>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
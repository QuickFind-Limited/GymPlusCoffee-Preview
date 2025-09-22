/**
 * ResizableForecastView Component - Split View with Resizable Chat Panel
 * 
 * BACKEND INTEGRATION NOTES FOR YOAN'S AI:
 * 
 * This component provides a resizable split-pane view with forecast data on the left 
 * and persistent chat interface on the right. Key integration points:
 * 
 * 1. RESIZABLE LAYOUT:
 *    - Uses react-resizable-panels for smooth drag-to-resize functionality
 *    - Default 60/40 split between forecast content and chat
 *    - Minimum panel sizes prevent UI from breaking on extreme resize
 *    - Layout state persists during session for better UX
 * 
 * 2. PERSISTENT CHAT HISTORY:
 *    - Chat history remains accessible across all forecast views
 *    - Users can continue conversations when switching between different forecasts
 *    - History automatically saves to localStorage for session persistence
 * 
 * 3. INTEGRATION POINTS:
 *    - Forecast content on left updates based on query context
 *    - Chat on right maintains conversation context and history
 *    - Resizable handle allows users to adjust view priorities
 *    - Both panels work independently without affecting each other's state
 */

import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import ChatInterface from '@/components/dashboard/ChatInterface';

interface ResizableForecastViewProps {
  children: React.ReactNode; // Forecast content for left panel
  chatQuery?: string; // Initial query for chat context
}

const ResizableForecastView: React.FC<ResizableForecastViewProps> = ({ 
  children, 
  chatQuery = "forecast" 
}) => {
  return (
    <div className="h-full w-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel: Forecast Content */}
        <ResizablePanel defaultSize={60} minSize={30}>
          <div className="h-full overflow-auto p-6">
            {children}
          </div>
        </ResizablePanel>
        
        {/* Resizable Handle */}
        <ResizableHandle withHandle />
        
        {/* Right Panel: Chat Interface */}
        <ResizablePanel defaultSize={40} minSize={25}>
          <div className="h-full bg-gray-50 border-l border-gray-200">
            <ChatInterface 
              initialQuery={chatQuery}
              onSubmit={(query) => {
                console.log('Chat query submitted in resizable view:', query);
                // Backend Integration Point: Handle continued conversation
                // The chat history will automatically persist across view changes
              }}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default ResizableForecastView;
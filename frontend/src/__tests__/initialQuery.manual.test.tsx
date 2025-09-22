/**
 * Manual test to verify initialQuery functionality
 * Run this test manually by navigating to a URL with message parameter
 */

import React from 'react';
import ChatInterface from '@/components/dashboard/ChatInterface';

// This component simulates what happens in Dashboard.tsx
const TestInitialQuery: React.FC = () => {
  const initialQuery = "show me recent orders"; // Simulate extracted URL parameter

  const handleSubmit = (query: string) => {
    console.log('Submitted query:', query);
  };

  return (
    <div>
      <h1>Initial Query Test</h1>
      <p>Expected behavior: The message "{initialQuery}" should appear as the first user message</p>
      <ChatInterface 
        initialQuery={initialQuery} 
        onSubmit={handleSubmit} 
      />
    </div>
  );
};

export default TestInitialQuery;

/**
 * EXPECTED BEHAVIOR:
 * 1. When this component renders, "show me recent orders" should appear as first user message
 * 2. An AI response should be generated automatically
 * 3. The conversation should start properly without any empty state
 * 
 * BUG THAT WAS FIXED:
 * Previously, the initialQuery was received but never added to the messages array,
 * causing users to see an empty conversation instead of their initial message.
 */
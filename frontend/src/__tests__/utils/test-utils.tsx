import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
import { FinancialDataProvider } from '@/contexts/FinancialDataContext';

/**
 * Test utilities for message flow testing
 * Provides wrapped providers for testing React components
 */

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <UserProvider>
            <FinancialDataProvider>
              {children}
            </FinancialDataProvider>
          </UserProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

/**
 * Mock message data for testing
 */
export const mockChatMessage = {
  id: 'test-message-1',
  content: 'Test message content',
  role: 'user' as const,
  timestamp: new Date('2025-01-01T10:00:00Z'),
  type: 'text' as const,
};

export const mockAssistantMessage = {
  id: 'test-message-2',
  content: 'Assistant response content',
  role: 'assistant' as const,
  timestamp: new Date('2025-01-01T10:01:00Z'),
  type: 'text' as const,
};

export const mockStreamEvent = {
  id: 'stream-event-1',
  type: 'message' as const,
  timestamp: new Date().toISOString(),
  display: 'Processing your request...',
  data: { role: 'assistant' },
  full_content: 'Full message content',
};

/**
 * Mock user authentication state
 */
export const mockAuthUser = {
  id: 'user-123',
  email: 'test@example.com',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

/**
 * Helper function to wait for async operations
 */
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
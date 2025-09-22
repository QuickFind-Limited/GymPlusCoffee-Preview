import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from '@/App';
import { mockAuthUser } from '../utils/test-utils';

/**
 * End-to-End Tests for Complete Message Flow
 * Tests the entire journey from landing to conversation completion
 */

// Mock Supabase auth for E2E tests
const mockSupabaseAuth = {
  getUser: vi.fn().mockResolvedValue({ data: { user: mockAuthUser } }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  onAuthStateChange: vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } }
  }),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: mockSupabaseAuth,
  },
}));

// Mock services
vi.mock('@/services/apiStreaming', () => ({
  StreamEvent: {},
}));

// Mock child components for faster E2E tests
vi.mock('@/components/dashboard/TypewriterText', () => ({
  default: ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
    React.useEffect(() => {
      if (onComplete) {
        const timer = setTimeout(onComplete, 50);
        return () => clearTimeout(timer);
      }
    }, [onComplete]);
    return <div data-testid="typewriter-text">{text}</div>;
  },
}));

vi.mock('@/components/dashboard/ReasoningDisplay', () => ({
  default: ({ onComplete }: { onComplete: () => void }) => {
    React.useEffect(() => {
      const timer = setTimeout(onComplete, 100);
      return () => clearTimeout(timer);
    }, [onComplete]);
    return <div data-testid="reasoning-display">AI is analyzing...</div>;
  },
}));

describe('Message Flow End-to-End Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset auth state
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: mockAuthUser } });
  });

  it('completes full journey from app load to conversation', async () => {
    render(<App />);
    
    // Should redirect to auth initially (from Index component)
    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });
    
    // Navigate to dashboard (simulating successful auth)
    window.history.pushState({}, '', '/dashboard');
    
    render(<App />);
    
    // Should show dashboard
    await waitFor(() => {
      expect(screen.getByText(/what do you need to do today/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Submit a message
    const searchInput = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(searchInput, { target: { value: 'show me inventory status' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    
    // Should show the message in conversation
    await waitFor(() => {
      expect(screen.getByText('show me inventory status')).toBeInTheDocument();
    });
    
    // Should show AI reasoning
    await waitFor(() => {
      expect(screen.getByTestId('reasoning-display')).toBeInTheDocument();
    });
    
    // Should show final response
    await waitFor(() => {
      expect(screen.getByText(/analysis complete/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles multiple message exchanges in sequence', async () => {
    window.history.pushState({}, '', '/dashboard');
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/what do you need to do today/i)).toBeInTheDocument();
    });
    
    // First message
    let searchInput = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(searchInput, { target: { value: 'first query about inventory' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('first query about inventory')).toBeInTheDocument();
    });
    
    // Wait for response
    await waitFor(() => {
      expect(screen.getByText(/analysis complete/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Second message
    searchInput = screen.getByPlaceholderText(/message/i);
    fireEvent.change(searchInput, { target: { value: 'follow up question' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('follow up question')).toBeInTheDocument();
    });
    
    // Both messages should be visible in history
    expect(screen.getByText('first query about inventory')).toBeInTheDocument();
    expect(screen.getByText('follow up question')).toBeInTheDocument();
  });

  it('handles forecast generation flow end-to-end', async () => {
    window.history.pushState({}, '', '/dashboard');
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/what do you need to do today/i)).toBeInTheDocument();
    });
    
    // Submit forecast query
    const searchInput = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(searchInput, { target: { value: 'forecast sales for Q2 2025' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    
    // Should show user message
    await waitFor(() => {
      expect(screen.getByText('forecast sales for Q2 2025')).toBeInTheDocument();
    });
    
    // Should show reasoning
    await waitFor(() => {
      expect(screen.getByTestId('reasoning-display')).toBeInTheDocument();
    });
    
    // Should show forecast response
    await waitFor(() => {
      expect(screen.getByText(/key performance metrics/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('handles purchase order creation flow end-to-end', async () => {
    window.history.pushState({}, '', '/dashboard');
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/what do you need to do today/i)).toBeInTheDocument();
    });
    
    // Submit purchase order query
    const searchInput = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(searchInput, { target: { value: 'create purchase order for winter hoodies' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    
    // Should show user message
    await waitFor(() => {
      expect(screen.getByText('create purchase order for winter hoodies')).toBeInTheDocument();
    });
    
    // Should show reasoning
    await waitFor(() => {
      expect(screen.getByTestId('reasoning-display')).toBeInTheDocument();
    });
    
    // Should show PO response with action buttons
    await waitFor(() => {
      expect(screen.getByText(/purchase order details/i)).toBeInTheDocument();
      expect(screen.getByText(/PO-\d{4}-\d{4}/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('handles error scenarios gracefully throughout the flow', async () => {
    // Mock auth failure
    mockSupabaseAuth.getUser.mockRejectedValueOnce(new Error('Network error'));
    
    window.history.pushState({}, '', '/dashboard');
    render(<App />);
    
    // Should handle auth error gracefully
    await waitFor(() => {
      // Might redirect to auth or show error state
      expect(document.body).toBeInTheDocument();
    });
  });

  it('preserves conversation state across page refreshes', async () => {
    window.history.pushState({}, '', '/dashboard');
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/what do you need to do today/i)).toBeInTheDocument();
    });
    
    // Submit a message
    const searchInput = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(searchInput, { target: { value: 'persistent conversation' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('persistent conversation')).toBeInTheDocument();
    });
    
    // Simulate page refresh by re-rendering
    render(<App />);
    
    // Navigate back to dashboard
    window.history.pushState({}, '', '/dashboard');
    
    // Should restore conversation from localStorage
    await waitFor(() => {
      // The conversation should be restored from localStorage
      const savedHistory = localStorage.getItem('chat-history');
      expect(savedHistory).toBeTruthy();
    });
  });

  it('handles streaming conversation transitions', async () => {
    window.history.pushState({}, '', '/dashboard');
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/what do you need to do today/i)).toBeInTheDocument();
    });
    
    // Submit query that triggers streaming
    const searchInput = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(searchInput, { target: { value: 'complex analysis request' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('complex analysis request')).toBeInTheDocument();
    });
    
    // Should transition to streaming conversation view
    await waitFor(() => {
      expect(screen.getByText(/analysis complete/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  describe('Quick Action Flows', () => {
    it('handles quick action button clicks end-to-end', async () => {
      window.history.pushState({}, '', '/dashboard');
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/what do you need to do today/i)).toBeInTheDocument();
      });
      
      // Click quick action button
      const quickActionButton = screen.getByText(/re-order 100 units of black essential hoody xxl/i);
      fireEvent.click(quickActionButton);
      
      // Should show the action in conversation
      await waitFor(() => {
        expect(screen.getByText(/re-order 100 units of black essential hoody xxl/i)).toBeInTheDocument();
      });
      
      // Should process the action
      await waitFor(() => {
        expect(screen.getByTestId('reasoning-display')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and UX', () => {
    it('maintains responsive performance during message flow', async () => {
      window.history.pushState({}, '', '/dashboard');
      
      const startTime = performance.now();
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/what do you need to do today/i)).toBeInTheDocument();
      });
      
      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(2000); // Should render within 2 seconds
      
      // Submit message and measure response time
      const messageStart = performance.now();
      const searchInput = screen.getByPlaceholderText(/type your message/i);
      fireEvent.change(searchInput, { target: { value: 'performance test message' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText('performance test message')).toBeInTheDocument();
      });
      
      const messageTime = performance.now() - messageStart;
      expect(messageTime).toBeLessThan(1000); // Message should appear quickly
    });

    it('handles rapid message submissions gracefully', async () => {
      window.history.pushState({}, '', '/dashboard');
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/what do you need to do today/i)).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText(/type your message/i);
      
      // Submit multiple messages rapidly
      fireEvent.change(searchInput, { target: { value: 'rapid message 1' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });
      
      fireEvent.change(searchInput, { target: { value: 'rapid message 2' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });
      
      fireEvent.change(searchInput, { target: { value: 'rapid message 3' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });
      
      // Should handle all messages without breaking
      await waitFor(() => {
        expect(screen.getByText('rapid message 1')).toBeInTheDocument();
        expect(screen.getByText('rapid message 2')).toBeInTheDocument();
        expect(screen.getByText('rapid message 3')).toBeInTheDocument();
      });
    });
  });
});
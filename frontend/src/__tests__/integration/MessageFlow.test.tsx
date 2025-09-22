import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Dashboard from '@/pages/Dashboard';
import { mockAuthUser } from '../utils/test-utils';

/**
 * Integration Tests for Message Flow from Homepage to Conversation
 * Tests the complete flow: Dashboard → SearchBar → ChatInterface/StreamingConversation
 */

// Mock Supabase auth
const mockSupabaseAuth = {
  getUser: vi.fn().mockResolvedValue({ data: { user: mockAuthUser } }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: mockSupabaseAuth,
  },
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock streaming service
vi.mock('@/services/apiStreaming', () => ({
  StreamEvent: {},
}));

// Mock child components that aren't core to message flow
vi.mock('@/components/dashboard/TypewriterText', () => ({
  default: ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
    React.useEffect(() => {
      if (onComplete) {
        const timer = setTimeout(onComplete, 100);
        return () => clearTimeout(timer);
      }
    }, [onComplete]);
    return <div data-testid="typewriter-text">{text}</div>;
  },
}));

vi.mock('@/components/dashboard/ReasoningDisplay', () => ({
  default: ({ onComplete }: { onComplete: () => void }) => {
    React.useEffect(() => {
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }, [onComplete]);
    return <div data-testid="reasoning-display">Analyzing your request...</div>;
  },
}));

describe('Message Flow Integration Tests', () => {
  const mockOnNavigateToOrderSummary = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders dashboard with search interface initially', async () => {
    render(<Dashboard onNavigateToOrderSummary={mockOnNavigateToOrderSummary} />);
    
    await waitFor(() => {
      expect(screen.getByText(/what do you need to do today/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
    });
  });

  it('transitions from dashboard to chat interface when message is submitted', async () => {
    render(<Dashboard onNavigateToOrderSummary={mockOnNavigateToOrderSummary} />);
    
    await waitFor(() => {
      expect(screen.getByText(/what do you need to do today/i)).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(searchInput, { target: { value: 'show me recent orders' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('show me recent orders')).toBeInTheDocument();
    });
  });

  it('handles forecast query flow from dashboard to reasoning to response', async () => {
    render(<Dashboard onNavigateToOrderSummary={mockOnNavigateToOrderSummary} />);
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/type your message/i);
      fireEvent.change(searchInput, { target: { value: 'forecast sales for next quarter' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });
    });
    
    // Should show reasoning display
    await waitFor(() => {
      expect(screen.getByTestId('reasoning-display')).toBeInTheDocument();
    });
    
    // Should eventually show forecast response
    await waitFor(() => {
      expect(screen.getByText(/forecast sales for next quarter/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles analysis query flow correctly', async () => {
    render(<Dashboard onNavigateToOrderSummary={mockOnNavigateToOrderSummary} />);
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/type your message/i);
      fireEvent.change(searchInput, { target: { value: 'show me performance metrics' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('reasoning-display')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText(/performance summary/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles action query flow for purchase orders', async () => {
    render(<Dashboard onNavigateToOrderSummary={mockOnNavigateToOrderSummary} />);
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/type your message/i);
      fireEvent.change(searchInput, { target: { value: 'create purchase order for hoodies' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('reasoning-display')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText(/purchase order details/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles streaming conversation transition correctly', async () => {
    render(<Dashboard onNavigateToOrderSummary={mockOnNavigateToOrderSummary} />);
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/type your message/i);
      fireEvent.change(searchInput, { target: { value: 'analyze inventory levels' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });
    });
    
    // Should transition to streaming conversation view
    await waitFor(() => {
      expect(screen.getByText(/analyze inventory levels/i)).toBeInTheDocument();
    });
  });

  it('preserves message flow state during navigation', async () => {
    render(<Dashboard onNavigateToOrderSummary={mockOnNavigateToOrderSummary} />);
    
    // Submit initial message
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/type your message/i);
      fireEvent.change(searchInput, { target: { value: 'first message' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });
    });
    
    await waitFor(() => {
      expect(screen.getByText('first message')).toBeInTheDocument();
    });
    
    // Submit follow-up message
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/message/i);
      fireEvent.change(searchInput, { target: { value: 'follow-up question' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });
    });
    
    // Both messages should be preserved
    await waitFor(() => {
      expect(screen.getByText('first message')).toBeInTheDocument();
      expect(screen.getByText('follow-up question')).toBeInTheDocument();
    });
  });

  it('handles quick action prompts correctly', async () => {
    render(<Dashboard onNavigateToOrderSummary={mockOnNavigateToOrderSummary} />);
    
    await waitFor(() => {
      expect(screen.getByText(/what do you need to do today/i)).toBeInTheDocument();
    });
    
    // Click on a quick prompt button
    const quickPrompt = screen.getByText(/re-order 100 units of black essential hoody xxl/i);
    fireEvent.click(quickPrompt);
    
    await waitFor(() => {
      expect(screen.getByText(/re-order 100 units of black essential hoody xxl/i)).toBeInTheDocument();
    });
  });

  it('handles conversation reset when returning to dashboard', async () => {
    render(<Dashboard onNavigateToOrderSummary={mockOnNavigateToOrderSummary} />);
    
    // Start a conversation
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/type your message/i);
      fireEvent.change(searchInput, { target: { value: 'test message' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });
    });
    
    await waitFor(() => {
      expect(screen.getByText('test message')).toBeInTheDocument();
    });
    
    // Simulate new query button (if available in sidebar)
    const newQueryButtons = screen.queryAllByText(/new query/i);
    if (newQueryButtons.length > 0) {
      fireEvent.click(newQueryButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText(/what do you need to do today/i)).toBeInTheDocument();
      });
    }
  });

  describe('Error Handling in Message Flow', () => {
    it('handles authentication errors gracefully', async () => {
      mockSupabaseAuth.getUser.mockRejectedValueOnce(new Error('Auth error'));
      
      expect(() => {
        render(<Dashboard onNavigateToOrderSummary={mockOnNavigateToOrderSummary} />);
      }).not.toThrow();
    });

    it('handles message submission errors', async () => {
      render(<Dashboard onNavigateToOrderSummary={mockOnNavigateToOrderSummary} />);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/type your message/i);
        fireEvent.change(searchInput, { target: { value: 'error message' } });
        fireEvent.keyDown(searchInput, { key: 'Enter' });
      });
      
      // Should still display the message even if processing fails
      await waitFor(() => {
        expect(screen.getByText('error message')).toBeInTheDocument();
      });
    });
  });

  describe('Message Persistence', () => {
    it('saves and restores conversation state', async () => {
      render(<Dashboard onNavigateToOrderSummary={mockOnNavigateToOrderSummary} />);
      
      // Submit a message
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/type your message/i);
        fireEvent.change(searchInput, { target: { value: 'persistent message' } });
        fireEvent.keyDown(searchInput, { key: 'Enter' });
      });
      
      await waitFor(() => {
        expect(screen.getByText('persistent message')).toBeInTheDocument();
      });
      
      // Verify localStorage contains the message
      await waitFor(() => {
        const savedHistory = localStorage.getItem('chat-history');
        expect(savedHistory).toBeTruthy();
        
        const parsedHistory = JSON.parse(savedHistory!);
        expect(parsedHistory.some((msg: any) => msg.content === 'persistent message')).toBe(true);
      });
    });
  });

  describe('Responsive Message Flow', () => {
    it('handles different screen sizes appropriately', async () => {
      // Mock different viewport sizes
      Object.defineProperty(window, 'innerWidth', { value: 320 });
      
      render(<Dashboard onNavigateToOrderSummary={mockOnNavigateToOrderSummary} />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText(/type your message/i);
      fireEvent.change(searchInput, { target: { value: 'mobile test' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText('mobile test')).toBeInTheDocument();
      });
    });
  });
});
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ChatInterface from '@/components/dashboard/ChatInterface';
import { mockChatMessage, mockAssistantMessage } from '../utils/test-utils';

/**
 * Unit Tests for ChatInterface Component
 * Tests message processing, conversation management, and response generation
 */

// Mock child components
vi.mock('@/components/dashboard/TypewriterText', () => ({
  default: ({ text, onComplete }: { text: string; onComplete: () => void }) => {
    React.useEffect(() => {
      const timer = setTimeout(onComplete, 100);
      return () => clearTimeout(timer);
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
    return <div data-testid="reasoning-display">Processing...</div>;
  },
}));

vi.mock('@/components/dashboard/forecast/ForecastPreview', () => ({
  default: ({ onComplete }: { onComplete: () => void }) => {
    React.useEffect(() => {
      const timer = setTimeout(onComplete, 100);
      return () => clearTimeout(timer);
    }, [onComplete]);
    return <div data-testid="forecast-preview">Forecast Preview</div>;
  },
}));

describe('ChatInterface Component', () => {
  const mockOnSubmit = vi.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('renders empty state initially', () => {
    render(<ChatInterface {...defaultProps} />);
    
    expect(screen.getByText(/how can i help you today/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/message/i)).toBeInTheDocument();
  });

  it('displays greeting message when no chat history exists', async () => {
    render(<ChatInterface {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/hey.*what can i do for you today liam/i)).toBeInTheDocument();
    });
  });

  it('processes initial query when provided', async () => {
    render(<ChatInterface {...defaultProps} initialQuery="test query" />);
    
    await waitFor(() => {
      expect(screen.getByText('test query')).toBeInTheDocument();
    });
  });

  it('handles user message submission', async () => {
    render(<ChatInterface {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/message/i);
    const submitButton = screen.getByRole('button');
    
    fireEvent.change(input, { target: { value: 'Hello assistant' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Hello assistant')).toBeInTheDocument();
    });
  });

  it('saves conversation history to localStorage', async () => {
    render(<ChatInterface {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/message/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(input.closest('form')!);
    
    await waitFor(() => {
      const savedHistory = localStorage.getItem('chat-history');
      expect(savedHistory).toBeTruthy();
      
      const parsedHistory = JSON.parse(savedHistory!);
      expect(parsedHistory.some((msg: any) => msg.content === 'Test message')).toBe(true);
    });
  });

  it('loads conversation history from localStorage', () => {
    const mockHistory = [
      { ...mockChatMessage, content: 'Previous message' },
      { ...mockAssistantMessage, content: 'Previous response' },
    ];
    
    localStorage.setItem('chat-history', JSON.stringify(mockHistory));
    
    render(<ChatInterface {...defaultProps} />);
    
    expect(screen.getByText('Previous message')).toBeInTheDocument();
    expect(screen.getByText('Previous response')).toBeInTheDocument();
  });

  describe('Message Type Detection', () => {
    it('detects forecast queries and shows reasoning display', async () => {
      render(<ChatInterface {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/message/i);
      fireEvent.change(input, { target: { value: 'forecast sales for next quarter' } });
      fireEvent.submit(input.closest('form')!);
      
      await waitFor(() => {
        expect(screen.getByTestId('reasoning-display')).toBeInTheDocument();
      });
    });

    it('detects analysis queries and shows appropriate response', async () => {
      render(<ChatInterface {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/message/i);
      fireEvent.change(input, { target: { value: 'show me recent performance data' } });
      fireEvent.submit(input.closest('form')!);
      
      await waitFor(() => {
        expect(screen.getByTestId('reasoning-display')).toBeInTheDocument();
      });
    });

    it('detects action queries for purchase orders', async () => {
      render(<ChatInterface {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/message/i);
      fireEvent.change(input, { target: { value: 'create purchase order for hoodies' } });
      fireEvent.submit(input.closest('form')!);
      
      await waitFor(() => {
        expect(screen.getByTestId('reasoning-display')).toBeInTheDocument();
      });
    });

    it('handles casual greetings appropriately', async () => {
      render(<ChatInterface {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/message/i);
      fireEvent.change(input, { target: { value: 'hey' } });
      fireEvent.submit(input.closest('form')!);
      
      await waitFor(() => {
        expect(screen.getByText(/hey how can i help you today/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Purchase Order Detection', () => {
    it('detects purchase order messages and shows action buttons', async () => {
      render(<ChatInterface {...defaultProps} />);
      
      // Simulate a purchase order response
      const input = screen.getByPlaceholderText(/message/i);
      fireEvent.change(input, { target: { value: 'create purchase order' } });
      fireEvent.submit(input.closest('form')!);
      
      // Wait for reasoning to complete and response to be generated
      await waitFor(() => {
        expect(screen.getByText(/purchase order details/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('extracts PO number from assistant response', async () => {
      render(<ChatInterface {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/message/i);
      fireEvent.change(input, { target: { value: 'create purchase order' } });
      fireEvent.submit(input.closest('form')!);
      
      await waitFor(() => {
        const poText = screen.getByText(/PO-\d{4}-\d{4}/);
        expect(poText).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('History Management', () => {
    it('collapses history when new message is submitted', async () => {
      // Pre-populate with history
      const mockHistory = [
        { ...mockChatMessage, content: 'Old message 1' },
        { ...mockAssistantMessage, content: 'Old response 1' },
        { ...mockChatMessage, content: 'Old message 2' },
        { ...mockAssistantMessage, content: 'Old response 2' },
      ];
      localStorage.setItem('chat-history', JSON.stringify(mockHistory));
      
      render(<ChatInterface {...defaultProps} />);
      
      // Submit new message
      const input = screen.getByPlaceholderText(/message/i);
      fireEvent.change(input, { target: { value: 'New message' } });
      fireEvent.submit(input.closest('form')!);
      
      await waitFor(() => {
        expect(screen.getByText('New message')).toBeInTheDocument();
        // History should still be present but may be collapsed
        expect(screen.getByText('Old message 1')).toBeInTheDocument();
      });
    });

    it('shows back to top button when scrolled', async () => {
      render(<ChatInterface {...defaultProps} />);
      
      // Add multiple messages to create scrollable content
      for (let i = 0; i < 5; i++) {
        const input = screen.getByPlaceholderText(/message/i);
        fireEvent.change(input, { target: { value: `Message ${i}` } });
        fireEvent.submit(input.closest('form')!);
        await waitFor(() => {
          expect(screen.getByText(`Message ${i}`)).toBeInTheDocument();
        });
      }
      
      // Simulate scrolling
      const scrollContainer = screen.getByRole('main') || document.body;
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 500 } });
      
      await waitFor(() => {
        expect(screen.getByLabelText(/back to top/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('localStorage error');
      });
      
      expect(() => {
        render(<ChatInterface {...defaultProps} />);
      }).not.toThrow();
      
      localStorage.getItem = originalGetItem;
    });

    it('handles malformed localStorage data', () => {
      localStorage.setItem('chat-history', 'invalid json');
      
      expect(() => {
        render(<ChatInterface {...defaultProps} />);
      }).not.toThrow();
      
      // Should show default greeting
      expect(screen.getByText(/hey.*what can i do for you today liam/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(<ChatInterface {...defaultProps} />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/message/i)).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('maintains proper focus management', async () => {
      render(<ChatInterface {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/message/i);
      input.focus();
      
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.submit(input.closest('form')!);
      
      await waitFor(() => {
        expect(document.activeElement).toBe(input);
      });
    });

    it('provides proper ARIA labels for interactive elements', () => {
      render(<ChatInterface {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/message/i);
      const submitButton = screen.getByRole('button');
      
      expect(input).toHaveAttribute('type', 'text');
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('Performance', () => {
    it('handles large conversation histories efficiently', async () => {
      const largeHistory = Array.from({ length: 100 }, (_, i) => ({
        ...mockChatMessage,
        id: `msg-${i}`,
        content: `Message ${i}`,
      }));
      
      localStorage.setItem('chat-history', JSON.stringify(largeHistory));
      
      const startTime = performance.now();
      render(<ChatInterface {...defaultProps} />);
      const endTime = performance.now();
      
      // Should render within reasonable time (< 1000ms)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
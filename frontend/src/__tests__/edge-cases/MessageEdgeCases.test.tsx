import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ChatInterface from '@/components/dashboard/ChatInterface';
import SearchBar from '@/components/dashboard/SearchBar';
import StreamingConversation from '@/components/dashboard/StreamingConversation';

/**
 * Edge Case Tests for Message Flow Components
 * Tests boundary conditions, error scenarios, and unusual inputs
 */

describe('Message Flow Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset any global state
  });

  describe('SearchBar Edge Cases', () => {
    const defaultProps = {
      searchQuery: '',
      setSearchQuery: vi.fn(),
      onSubmit: vi.fn(),
      onOrderGeneration: vi.fn(),
      onStreamingEvent: vi.fn(),
      onStreamingStart: vi.fn(),
      onStreamingEnd: vi.fn(),
      onStreamingError: vi.fn(),
    };

    it('handles extremely long messages', () => {
      const veryLongMessage = 'A'.repeat(10000);
      render(<SearchBar {...defaultProps} searchQuery={veryLongMessage} />);
      
      const input = screen.getByPlaceholderText(/type your message/i);
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(veryLongMessage);
    });

    it('handles messages with special Unicode characters', () => {
      const unicodeMessage = '🚀 Hello 世界 𝕋𝔼𝕊𝕋 🎯 Ñoñó';
      render(<SearchBar {...defaultProps} searchQuery={unicodeMessage} />);
      
      const input = screen.getByPlaceholderText(/type your message/i);
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(unicodeMessage);
    });

    it('handles messages with HTML/XSS attempts', () => {
      const maliciousMessage = '<script>alert("xss")</script><img src="x" onerror="alert(1)">';
      render(<SearchBar {...defaultProps} searchQuery={maliciousMessage} />);
      
      const input = screen.getByPlaceholderText(/type your message/i);
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(maliciousMessage);
      // Should not execute any scripts
      expect(window.alert).not.toHaveBeenCalled();
    });

    it('handles messages with only whitespace', () => {
      const whitespaceMessage = '   \t\n\r   ';
      render(<SearchBar {...defaultProps} searchQuery={whitespaceMessage} />);
      
      const input = screen.getByPlaceholderText(/type your message/i);
      fireEvent.keyDown(input, { key: 'Enter' });
      
      // Should not submit empty messages
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('handles rapid key presses correctly', async () => {
      render(<SearchBar {...defaultProps} searchQuery="test" />);
      
      const input = screen.getByPlaceholderText(/type your message/i);
      
      // Rapidly press Enter multiple times
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(input, { key: 'Enter' });
      }
      
      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1);
      });
    });

    it('handles null and undefined search queries', () => {
      const { rerender } = render(<SearchBar {...defaultProps} searchQuery={null as any} />);
      
      expect(screen.getByPlaceholderText(/type your message/i)).toHaveValue('');
      
      rerender(<SearchBar {...defaultProps} searchQuery={undefined as any} />);
      
      expect(screen.getByPlaceholderText(/type your message/i)).toHaveValue('');
    });

    it('handles callback errors gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      
      render(<SearchBar {...defaultProps} onSubmit={errorCallback} searchQuery="test" />);
      
      const input = screen.getByPlaceholderText(/type your message/i);
      
      expect(() => {
        fireEvent.keyDown(input, { key: 'Enter' });
      }).not.toThrow();
    });
  });

  describe('ChatInterface Edge Cases', () => {
    const defaultProps = {
      onSubmit: vi.fn(),
    };

    it('handles corrupted localStorage data', () => {
      localStorage.setItem('chat-history', 'invalid json data {');
      
      expect(() => {
        render(<ChatInterface {...defaultProps} />);
      }).not.toThrow();
      
      // Should show default greeting
      expect(screen.getByText(/hey.*what can i do for you today liam/i)).toBeInTheDocument();
    });

    it('handles localStorage quota exceeded', async () => {
      // Mock localStorage to simulate quota exceeded
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });
      
      render(<ChatInterface {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/message/i);
      fireEvent.change(input, { target: { value: 'test message' } });
      fireEvent.submit(input.closest('form')!);
      
      await waitFor(() => {
        expect(screen.getByText('test message')).toBeInTheDocument();
      });
      
      localStorage.setItem = originalSetItem;
    });

    it('handles messages with extreme nesting in conversation history', () => {
      const deeplyNestedHistory = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        timestamp: new Date(Date.now() - i * 1000),
        type: 'text',
      }));
      
      localStorage.setItem('chat-history', JSON.stringify(deeplyNestedHistory));
      
      const startTime = performance.now();
      render(<ChatInterface {...defaultProps} />);
      const renderTime = performance.now() - startTime;
      
      // Should render without performance issues
      expect(renderTime).toBeLessThan(2000);
      expect(screen.getByText('Message 0')).toBeInTheDocument();
    });

    it('handles simultaneous message submissions', async () => {
      render(<ChatInterface {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/message/i);
      
      // Submit multiple messages simultaneously
      const promises = Array.from({ length: 5 }, (_, i) => {
        fireEvent.change(input, { target: { value: `simultaneous ${i}` } });
        return fireEvent.submit(input.closest('form')!);
      });
      
      await Promise.all(promises);
      
      // Should handle all submissions gracefully
      await waitFor(() => {
        expect(screen.getByText(/simultaneous/)).toBeInTheDocument();
      });
    });

    it('handles invalid initial query formats', () => {
      const invalidQueries = [
        null,
        undefined,
        {},
        [],
        123,
        true,
        Symbol('test'),
      ];
      
      invalidQueries.forEach(query => {
        expect(() => {
          render(<ChatInterface {...defaultProps} initialQuery={query as any} />);
        }).not.toThrow();
      });
    });

    it('handles message type detection with ambiguous queries', async () => {
      render(<ChatInterface {...defaultProps} />);
      
      const ambiguousQueries = [
        'show me forecast create analysis',
        'forecast show create me analysis',
        'create show forecast me',
        'Show Me Forecast Create Analysis', // case variations
        'SHOW me forecast CREATE',
      ];
      
      for (const query of ambiguousQueries) {
        const input = screen.getByPlaceholderText(/message/i);
        fireEvent.change(input, { target: { value: query } });
        fireEvent.submit(input.closest('form')!);
        
        await waitFor(() => {
          expect(screen.getByText(query)).toBeInTheDocument();
        });
      }
    });

    it('handles rapid conversation state changes', async () => {
      const { rerender } = render(<ChatInterface {...defaultProps} />);
      
      // Rapidly change between different states
      for (let i = 0; i < 10; i++) {
        rerender(<ChatInterface {...defaultProps} initialQuery={`query ${i}`} />);
      }
      
      await waitFor(() => {
        expect(screen.getByText(/query/)).toBeInTheDocument();
      });
    });
  });

  describe('StreamingConversation Edge Cases', () => {
    const defaultProps = {
      onStreamingEvent: vi.fn(),
      onStreamingStart: vi.fn(),
      onStreamingEnd: vi.fn(),
      onStreamingError: vi.fn(),
    };

    it('handles malformed streaming events', () => {
      const malformedEvents = [
        { id: null, type: null, timestamp: null },
        { id: '', type: 'invalid', timestamp: 'invalid date' },
        { type: 'message' }, // missing required fields
        null,
        undefined,
      ];
      
      expect(() => {
        render(<StreamingConversation {...defaultProps} events={malformedEvents as any} />);
      }).not.toThrow();
    });

    it('handles extremely rapid event updates', async () => {
      const { rerender } = render(<StreamingConversation {...defaultProps} events={[]} />);
      
      // Rapidly add events
      for (let i = 0; i < 100; i++) {
        const events = Array.from({ length: i + 1 }, (_, j) => ({
          id: `rapid-${j}`,
          type: 'message' as const,
          timestamp: new Date().toISOString(),
          display: `Rapid event ${j}`,
          data: {},
        }));
        
        rerender(<StreamingConversation {...defaultProps} events={events} />);
      }
      
      await waitFor(() => {
        expect(screen.getByText('Rapid event 99')).toBeInTheDocument();
      });
    });

    it('handles circular reference in event data', () => {
      const circularData: any = { type: 'message' };
      circularData.self = circularData;
      
      const eventWithCircular = {
        id: 'circular',
        type: 'message' as const,
        timestamp: new Date().toISOString(),
        display: 'Circular data event',
        data: circularData,
      };
      
      expect(() => {
        render(<StreamingConversation {...defaultProps} events={[eventWithCircular]} />);
      }).not.toThrow();
    });

    it('handles events with extremely long content', () => {
      const longContentEvent = {
        id: 'long-content',
        type: 'message' as const,
        timestamp: new Date().toISOString(),
        display: 'Long content event',
        full_content: 'A'.repeat(100000),
        data: { role: 'assistant' },
      };
      
      const startTime = performance.now();
      render(<StreamingConversation {...defaultProps} events={[longContentEvent]} />);
      const renderTime = performance.now() - startTime;
      
      // Should handle long content without performance issues
      expect(renderTime).toBeLessThan(1000);
      expect(screen.getByText('Long content event')).toBeInTheDocument();
    });

    it('handles rapid streaming state changes', () => {
      const { rerender } = render(<StreamingConversation {...defaultProps} isStreaming={false} />);
      
      // Rapidly toggle streaming state
      for (let i = 0; i < 100; i++) {
        rerender(<StreamingConversation {...defaultProps} isStreaming={i % 2 === 0} />);
      }
      
      expect(screen.getByText(/conversation en streaming/i)).toBeInTheDocument();
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('handles memory pressure during large conversations', async () => {
      const largeConversation = Array.from({ length: 5000 }, (_, i) => ({
        id: `large-${i}`,
        content: `Large message ${i} `.repeat(100),
        role: i % 2 === 0 ? 'user' : 'assistant',
        timestamp: new Date(Date.now() - i * 1000),
        type: 'text',
      }));
      
      localStorage.setItem('chat-history', JSON.stringify(largeConversation));
      
      const memoryBefore = performance.memory?.usedJSHeapSize || 0;
      
      render(<ChatInterface onSubmit={vi.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Large message 0')).toBeInTheDocument();
      });
      
      const memoryAfter = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = memoryAfter - memoryBefore;
      
      // Should not cause excessive memory usage (< 100MB increase)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });

    it('handles cleanup when components unmount during message flow', () => {
      const { unmount } = render(<ChatInterface onSubmit={vi.fn()} />);
      
      const input = screen.getByPlaceholderText(/message/i);
      fireEvent.change(input, { target: { value: 'cleanup test' } });
      fireEvent.submit(input.closest('form')!);
      
      // Unmount during message processing
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Browser Compatibility Edge Cases', () => {
    it('handles missing localStorage support', () => {
      const originalLocalStorage = window.localStorage;
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });
      
      expect(() => {
        render(<ChatInterface onSubmit={vi.fn()} />);
      }).not.toThrow();
      
      window.localStorage = originalLocalStorage;
    });

    it('handles missing modern JavaScript features', () => {
      // Mock missing features
      const originalPromise = window.Promise;
      Object.defineProperty(window, 'Promise', {
        value: undefined,
        writable: true,
      });
      
      expect(() => {
        render(<SearchBar
          searchQuery=""
          setSearchQuery={vi.fn()}
          onSubmit={vi.fn()}
          onOrderGeneration={vi.fn()}
          onStreamingEvent={vi.fn()}
          onStreamingStart={vi.fn()}
          onStreamingEnd={vi.fn()}
          onStreamingError={vi.fn()}
        />);
      }).not.toThrow();
      
      window.Promise = originalPromise;
    });
  });
});
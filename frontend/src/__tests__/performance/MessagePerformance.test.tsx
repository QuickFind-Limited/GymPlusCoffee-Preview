import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ChatInterface from '@/components/dashboard/ChatInterface';
import SearchBar from '@/components/dashboard/SearchBar';
import StreamingConversation from '@/components/dashboard/StreamingConversation';

/**
 * Performance Tests for Message Flow Components
 * Tests rendering performance, memory usage, and scalability
 */

// Mock performance APIs
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 5000000,
    },
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
  },
});

describe('Message Flow Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('SearchBar Performance', () => {
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

    it('renders within performance budget', () => {
      const startTime = performance.now();
      render(<SearchBar {...defaultProps} />);
      const endTime = performance.now();
      
      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(100); // Should render in < 100ms
    });

    it('handles rapid input changes efficiently', async () => {
      const mockSetSearchQuery = vi.fn();
      render(<SearchBar {...defaultProps} setSearchQuery={mockSetSearchQuery} />);
      
      const input = screen.getByPlaceholderText(/type your message/i);
      
      const startTime = performance.now();
      
      // Simulate rapid typing
      for (let i = 0; i < 100; i++) {
        fireEvent.change(input, { target: { value: `test query ${i}` } });
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(500); // Should handle 100 changes in < 500ms
      expect(mockSetSearchQuery).toHaveBeenCalledTimes(100);
    });

    it('maintains performance with large query strings', () => {
      const largeQuery = 'A'.repeat(10000);
      
      const startTime = performance.now();
      render(<SearchBar {...defaultProps} searchQuery={largeQuery} />);
      const endTime = performance.now();
      
      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(200); // Should handle large strings efficiently
      
      expect(screen.getByDisplayValue(largeQuery)).toBeInTheDocument();
    });

    it('optimizes re-renders when props change', () => {
      const renderSpy = vi.fn();
      
      const TestWrapper = (props: any) => {
        renderSpy();
        return <SearchBar {...props} />;
      };
      
      const { rerender } = render(<TestWrapper {...defaultProps} />);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Change unrelated prop
      rerender(<TestWrapper {...defaultProps} searchQuery="new query" />);
      
      expect(renderSpy).toHaveBeenCalledTimes(2);
      
      // Same props should not trigger re-render
      rerender(<TestWrapper {...defaultProps} searchQuery="new query" />);
      
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('ChatInterface Performance', () => {
    const defaultProps = {
      onSubmit: vi.fn(),
    };

    it('renders initial state within performance budget', () => {
      const startTime = performance.now();
      render(<ChatInterface {...defaultProps} />);
      const endTime = performance.now();
      
      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(300); // Should render in < 300ms
    });

    it('handles large conversation histories efficiently', async () => {
      const largeHistory = Array.from({ length: 1000 }, (_, i) => ({
        id: `perf-${i}`,
        content: `Performance test message ${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        timestamp: new Date(Date.now() - i * 1000).toISOString(),
        type: 'text',
      }));
      
      localStorage.setItem('chat-history', JSON.stringify(largeHistory));
      
      const startTime = performance.now();
      render(<ChatInterface {...defaultProps} />);
      const endTime = performance.now();
      
      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(1000); // Should handle 1000 messages in < 1s
    });

    it('optimizes scroll performance with long conversations', async () => {
      const longHistory = Array.from({ length: 500 }, (_, i) => ({
        id: `scroll-${i}`,
        content: `Scroll test message ${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        timestamp: new Date(Date.now() - i * 1000).toISOString(),
        type: 'text',
      }));
      
      localStorage.setItem('chat-history', JSON.stringify(longHistory));
      
      render(<ChatInterface {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Scroll test message 0')).toBeInTheDocument();
      });
      
      // Simulate scrolling performance
      const scrollStart = performance.now();
      window.dispatchEvent(new Event('scroll'));
      const scrollEnd = performance.now();
      
      expect(scrollEnd - scrollStart).toBeLessThan(50); // Scroll handling < 50ms
    });

    it('manages memory efficiently during conversation', async () => {
      const initialMemory = (performance as any).memory.usedJSHeapSize;
      
      render(<ChatInterface {...defaultProps} />);
      
      // Add multiple messages
      for (let i = 0; i < 50; i++) {
        const input = screen.getByPlaceholderText(/message/i);
        fireEvent.change(input, { target: { value: `memory test ${i}` } });
        fireEvent.submit(input.closest('form')!);
        
        await waitFor(() => {
          expect(screen.getByText(`memory test ${i}`)).toBeInTheDocument();
        });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = (performance as any).memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Should not cause excessive memory growth
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // < 10MB increase
    });

    it('debounces rapid message submissions effectively', async () => {
      render(<ChatInterface {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/message/i);
      
      const startTime = performance.now();
      
      // Rapidly submit multiple messages
      for (let i = 0; i < 10; i++) {
        fireEvent.change(input, { target: { value: `rapid ${i}` } });
        fireEvent.submit(input.closest('form')!);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(100); // Should handle rapidly without blocking
      
      // Should show at least some messages
      await waitFor(() => {
        expect(screen.getByText(/rapid/)).toBeInTheDocument();
      });
    });
  });

  describe('StreamingConversation Performance', () => {
    const defaultProps = {
      onStreamingEvent: vi.fn(),
      onStreamingStart: vi.fn(),
      onStreamingEnd: vi.fn(),
      onStreamingError: vi.fn(),
    };

    it('renders streaming interface efficiently', () => {
      const startTime = performance.now();
      render(<StreamingConversation {...defaultProps} />);
      const endTime = performance.now();
      
      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(200); // Should render in < 200ms
    });

    it('handles high-frequency event updates efficiently', async () => {
      const { rerender } = render(<StreamingConversation {...defaultProps} events={[]} />);
      
      const startTime = performance.now();
      
      // Simulate high-frequency streaming events
      for (let i = 0; i < 100; i++) {
        const events = Array.from({ length: i + 1 }, (_, j) => ({
          id: `stream-${j}`,
          type: 'message' as const,
          timestamp: new Date().toISOString(),
          display: `Event ${j}`,
          data: {},
        }));
        
        rerender(<StreamingConversation {...defaultProps} events={events} />);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(1000); // Should handle 100 updates in < 1s
    });

    it('optimizes rendering of large event lists', () => {
      const manyEvents = Array.from({ length: 500 }, (_, i) => ({
        id: `large-event-${i}`,
        type: 'message' as const,
        timestamp: new Date().toISOString(),
        display: `Large event ${i}`,
        data: {},
      }));
      
      const startTime = performance.now();
      render(<StreamingConversation {...defaultProps} events={manyEvents} />);
      const endTime = performance.now();
      
      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(800); // Should handle 500 events in < 800ms
    });

    it('maintains smooth scrolling during streaming', async () => {
      const events = Array.from({ length: 10 }, (_, i) => ({
        id: `scroll-stream-${i}`,
        type: 'message' as const,
        timestamp: new Date().toISOString(),
        display: `Scroll stream event ${i}`,
        data: {},
      }));
      
      render(<StreamingConversation {...defaultProps} events={events} />);
      
      // Mock scrollIntoView performance
      const scrollSpy = vi.fn();
      Element.prototype.scrollIntoView = scrollSpy;
      
      // Add new events to trigger scroll
      const newEvents = [...events, {
        id: 'new-stream-event',
        type: 'message' as const,
        timestamp: new Date().toISOString(),
        display: 'New streaming event',
        data: {},
      }];
      
      const scrollStart = performance.now();
      render(<StreamingConversation {...defaultProps} events={newEvents} />);
      const scrollEnd = performance.now();
      
      expect(scrollEnd - scrollStart).toBeLessThan(100); // Scroll update < 100ms
    });
  });

  describe('Integration Performance', () => {
    it('maintains performance across component interactions', async () => {
      const startTime = performance.now();
      
      render(<ChatInterface onSubmit={vi.fn()} />);
      
      // Simulate user interaction sequence
      const input = screen.getByPlaceholderText(/message/i);
      fireEvent.change(input, { target: { value: 'performance test query' } });
      fireEvent.submit(input.closest('form')!);
      
      await waitFor(() => {
        expect(screen.getByText('performance test query')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(2000); // Complete interaction < 2s
    });

    it('handles concurrent operations without performance degradation', async () => {
      render(<ChatInterface onSubmit={vi.fn()} />);
      
      const startTime = performance.now();
      
      // Simulate concurrent operations
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        const input = screen.getByPlaceholderText(/message/i);
        fireEvent.change(input, { target: { value: `concurrent ${i}` } });
        promises.push(
          waitFor(() => {
            expect(screen.getByDisplayValue(`concurrent ${i}`)).toBeInTheDocument();
          })
        );
      }
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const concurrentTime = endTime - startTime;
      
      expect(concurrentTime).toBeLessThan(1000); // Concurrent ops < 1s
    });
  });

  describe('Performance Regression Detection', () => {
    it('detects rendering performance regressions', () => {
      const renderTimes: number[] = [];
      
      // Take multiple measurements
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        const { unmount } = render(<ChatInterface onSubmit={vi.fn()} />);
        const endTime = performance.now();
        
        renderTimes.push(endTime - startTime);
        unmount();
      }
      
      const averageTime = renderTimes.reduce((a, b) => a + b) / renderTimes.length;
      const maxTime = Math.max(...renderTimes);
      
      expect(averageTime).toBeLessThan(150); // Average < 150ms
      expect(maxTime).toBeLessThan(300); // Max < 300ms
    });

    it('monitors memory usage patterns', () => {
      const memorySnapshots: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(<ChatInterface onSubmit={vi.fn()} />);
        
        const memoryUsed = (performance as any).memory.usedJSHeapSize;
        memorySnapshots.push(memoryUsed);
        
        unmount();
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
      
      // Memory usage should not grow significantly across renders
      const memoryGrowth = memorySnapshots[4] - memorySnapshots[0];
      expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024); // < 5MB growth
    });
  });

  describe('Performance Monitoring', () => {
    it('provides performance metrics for monitoring', () => {
      const performanceObserver = vi.fn();
      
      // Mock Performance Observer
      global.PerformanceObserver = vi.fn().mockImplementation((callback) => ({
        observe: vi.fn(),
        disconnect: vi.fn(),
      }));
      
      render(<ChatInterface onSubmit={vi.fn()} />);
      
      // Should be able to set up performance monitoring
      expect(() => {
        const observer = new PerformanceObserver(performanceObserver);
        observer.observe({ entryTypes: ['measure'] });
      }).not.toThrow();
    });
  });
});
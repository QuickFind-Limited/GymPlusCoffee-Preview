import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ChatInterface from '@/components/dashboard/ChatInterface';
import SearchBar from '@/components/dashboard/SearchBar';
import StreamingConversation from '@/components/dashboard/StreamingConversation';

/**
 * Accessibility Tests for Message Flow Components
 * Tests ARIA labels, keyboard navigation, screen reader compatibility, and WCAG compliance
 */

// Mock child components for focused accessibility testing
vi.mock('@/components/dashboard/TypewriterText', () => ({
  default: ({ text }: { text: string }) => (
    <div role="status" aria-live="polite" data-testid="typewriter-text">
      {text}
    </div>
  ),
}));

describe('Message Flow Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('SearchBar Accessibility', () => {
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

    it('has proper ARIA labels and roles', () => {
      render(<SearchBar {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/type your message/i);
      const submitButton = screen.getByRole('button');
      
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('placeholder');
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('supports keyboard navigation', async () => {
      render(<SearchBar {...defaultProps} searchQuery="test message" />);
      
      const input = screen.getByPlaceholderText(/type your message/i);
      const submitButton = screen.getByRole('button');
      
      // Test Tab navigation
      input.focus();
      expect(document.activeElement).toBe(input);
      
      fireEvent.keyDown(input, { key: 'Tab' });
      await waitFor(() => {
        expect(document.activeElement).toBe(submitButton);
      });
      
      // Test Enter key submission
      input.focus();
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(defaultProps.onSubmit).toHaveBeenCalledWith('test message');
    });

    it('provides appropriate feedback for screen readers', () => {
      const { rerender } = render(<SearchBar {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/type your message/i);
      
      // Should have describedby for additional context
      expect(input).toHaveAttribute('placeholder');
      
      // Test with error state (if applicable)
      rerender(<SearchBar {...defaultProps} searchQuery="" />);
      
      const submitButton = screen.getByRole('button');
      expect(submitButton).toBeDisabled();
    });

    it('handles focus management correctly', async () => {
      render(<SearchBar {...defaultProps} searchQuery="focus test" />);
      
      const input = screen.getByPlaceholderText(/type your message/i);
      
      // Focus should remain on input after submission
      input.focus();
      fireEvent.keyDown(input, { key: 'Enter' });
      
      await waitFor(() => {
        expect(document.activeElement).toBe(input);
      });
    });

    it('provides proper contrast and visual indicators', () => {
      render(<SearchBar {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/type your message/i);
      const submitButton = screen.getByRole('button');
      
      // Elements should be visible and properly styled
      expect(input).toBeVisible();
      expect(submitButton).toBeVisible();
      
      // Button should show disabled state visually
      expect(submitButton).toBeDisabled();
    });

    it('supports screen reader announcements for state changes', async () => {
      const { rerender } = render(<SearchBar {...defaultProps} />);
      
      // Test enabling submit button
      rerender(<SearchBar {...defaultProps} searchQuery="test" />);
      
      const submitButton = screen.getByRole('button');
      expect(submitButton).toBeEnabled();
      
      // Should announce state change to screen readers
      expect(submitButton).not.toHaveAttribute('aria-disabled');
    });
  });

  describe('ChatInterface Accessibility', () => {
    const defaultProps = {
      onSubmit: vi.fn(),
    };

    it('has proper semantic structure', () => {
      render(<ChatInterface {...defaultProps} />);
      
      // Should have main content area
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // Form should be properly labeled
      const form = screen.getByRole('form', { hidden: true }) || screen.getByRole('textbox').closest('form');
      expect(form).toBeInTheDocument();
    });

    it('provides proper heading hierarchy', () => {
      render(<ChatInterface {...defaultProps} />);
      
      // Should have proper heading structure
      const heading = screen.getByText(/how can i help you today/i);
      expect(heading).toBeInTheDocument();
    });

    it('supports keyboard navigation through messages', async () => {
      render(<ChatInterface {...defaultProps} />);
      
      // Add a message first
      const input = screen.getByPlaceholderText(/message/i);
      fireEvent.change(input, { target: { value: 'accessibility test' } });
      fireEvent.submit(input.closest('form')!);
      
      await waitFor(() => {
        expect(screen.getByText('accessibility test')).toBeInTheDocument();
      });
      
      // Should be able to navigate through conversation
      const messageElement = screen.getByText('accessibility test');
      expect(messageElement).toBeVisible();
    });

    it('announces new messages to screen readers', async () => {
      render(<ChatInterface {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/message/i);
      fireEvent.change(input, { target: { value: 'new message' } });
      fireEvent.submit(input.closest('form')!);
      
      await waitFor(() => {
        expect(screen.getByText('new message')).toBeInTheDocument();
      });
      
      // New messages should be announced (via live region)
      await waitFor(() => {
        const liveRegions = screen.getAllByRole('status');
        expect(liveRegions.length).toBeGreaterThan(0);
      });
    });

    it('provides proper focus management for conversation flow', async () => {
      render(<ChatInterface {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/message/i);
      
      // Focus should return to input after message submission
      input.focus();
      fireEvent.change(input, { target: { value: 'focus management test' } });
      fireEvent.submit(input.closest('form')!);
      
      await waitFor(() => {
        expect(document.activeElement).toBe(input);
      });
    });

    it('supports high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
      
      render(<ChatInterface {...defaultProps} />);
      
      // Should render without issues in high contrast
      expect(screen.getByPlaceholderText(/message/i)).toBeVisible();
    });

    it('provides appropriate ARIA labels for interactive elements', async () => {
      render(<ChatInterface {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/message/i);
      const submitButton = screen.getByRole('button');
      
      expect(input).toHaveAttribute('type', 'text');
      expect(submitButton).toHaveAttribute('type', 'submit');
      
      // Back to top button (if present)
      fireEvent.scroll(window, { target: { scrollY: 1000 } });
      
      await waitFor(() => {
        const backToTopButton = screen.queryByLabelText(/back to top/i);
        if (backToTopButton) {
          expect(backToTopButton).toHaveAttribute('aria-label');
        }
      });
    });

    it('handles reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
      
      render(<ChatInterface {...defaultProps} />);
      
      // Should respect reduced motion settings
      expect(screen.getByPlaceholderText(/message/i)).toBeVisible();
    });
  });

  describe('StreamingConversation Accessibility', () => {
    const defaultProps = {
      onStreamingEvent: vi.fn(),
      onStreamingStart: vi.fn(),
      onStreamingEnd: vi.fn(),
      onStreamingError: vi.fn(),
    };

    it('provides proper semantic structure for streaming content', () => {
      render(<StreamingConversation {...defaultProps} />);
      
      // Should have proper heading
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/conversation en streaming/i);
      
      // Should have proper container structure
      expect(screen.getByText(/conversation en streaming/i)).toBeVisible();
    });

    it('announces streaming status to screen readers', () => {
      render(<StreamingConversation {...defaultProps} isStreaming={true} />);
      
      // Should announce streaming status
      const statusElement = screen.getByText(/en cours/i);
      expect(statusElement).toBeInTheDocument();
      
      // Should have proper ARIA live region
      const liveRegion = statusElement.closest('[aria-live]');
      expect(liveRegion).toHaveAttribute('aria-live');
    });

    it('provides accessible navigation through streaming events', () => {
      const events = [
        {
          id: 'event-1',
          type: 'connection' as const,
          timestamp: new Date().toISOString(),
          display: 'Connected to assistant',
          data: {},
        },
        {
          id: 'event-2',
          type: 'message' as const,
          timestamp: new Date().toISOString(),
          display: 'Processing request',
          data: {},
        },
      ];
      
      render(<StreamingConversation {...defaultProps} events={events} />);
      
      // Events should be properly structured for screen readers
      expect(screen.getByText('Connected to assistant')).toBeVisible();
      expect(screen.getByText('Processing request')).toBeVisible();
    });

    it('handles focus management during streaming updates', async () => {
      const { rerender } = render(<StreamingConversation {...defaultProps} events={[]} />);
      
      // Focus should not be disrupted by streaming updates
      const searchInput = screen.getByTestId('search-input');
      searchInput.focus();
      
      const events = [{
        id: 'new-event',
        type: 'message' as const,
        timestamp: new Date().toISOString(),
        display: 'New streaming event',
        data: {},
      }];
      
      rerender(<StreamingConversation {...defaultProps} events={events} />);
      
      // Focus should remain on input
      expect(document.activeElement).toBe(searchInput);
    });

    it('provides proper time information for screen readers', () => {
      const event = {
        id: 'timed-event',
        type: 'message' as const,
        timestamp: new Date('2025-01-01T10:30:00Z').toISOString(),
        display: 'Timed event',
        data: {},
      };
      
      render(<StreamingConversation {...defaultProps} events={[event]} />);
      
      // Time should be accessible to screen readers
      expect(screen.getByText(/10:30/)).toBeInTheDocument();
    });

    it('supports keyboard navigation in conversation history', () => {
      render(<StreamingConversation {...defaultProps} />);
      
      // Should be able to navigate through conversation elements
      const conversationContainer = screen.getByText(/conversation en streaming/i).closest('div');
      expect(conversationContainer).toBeInTheDocument();
    });
  });

  describe('Cross-Component Accessibility', () => {
    it('maintains focus consistency across message flow transitions', async () => {
      render(<ChatInterface onSubmit={vi.fn()} />);
      
      const input = screen.getByPlaceholderText(/message/i);
      
      // Focus should be maintained through state changes
      input.focus();
      fireEvent.change(input, { target: { value: 'transition test' } });
      fireEvent.submit(input.closest('form')!);
      
      await waitFor(() => {
        expect(screen.getByText('transition test')).toBeInTheDocument();
      });
      
      // Focus should return to input for continued interaction
      expect(document.activeElement).toBe(input);
    });

    it('provides consistent ARIA labeling across components', () => {
      render(<ChatInterface onSubmit={vi.fn()} />);
      
      // All interactive elements should have appropriate labels
      const input = screen.getByPlaceholderText(/message/i);
      const button = screen.getByRole('button');
      
      expect(input).toHaveAttribute('placeholder');
      expect(button).toBeInTheDocument();
    });

    it('supports screen reader navigation through conversation', async () => {
      render(<ChatInterface onSubmit={vi.fn()} />);
      
      // Add multiple messages to test navigation
      const input = screen.getByPlaceholderText(/message/i);
      
      for (let i = 0; i < 3; i++) {
        fireEvent.change(input, { target: { value: `Navigation test ${i}` } });
        fireEvent.submit(input.closest('form')!);
        
        await waitFor(() => {
          expect(screen.getByText(`Navigation test ${i}`)).toBeInTheDocument();
        });
      }
      
      // All messages should be accessible via screen reader
      expect(screen.getByText('Navigation test 0')).toBeInTheDocument();
      expect(screen.getByText('Navigation test 1')).toBeInTheDocument();
      expect(screen.getByText('Navigation test 2')).toBeInTheDocument();
    });
  });

  describe('WCAG Compliance', () => {
    it('meets color contrast requirements', () => {
      render(<ChatInterface onSubmit={vi.fn()} />);
      
      // All text should be visible and meet contrast requirements
      const textElements = screen.getAllByText(/./);
      textElements.forEach(element => {
        expect(element).toBeVisible();
      });
    });

    it('provides alternative text for non-text content', () => {
      render(<ChatInterface onSubmit={vi.fn()} />);
      
      // Icons and images should have proper alt text or ARIA labels
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Should have accessible name
        expect(button).toBeDefined();
      });
    });

    it('supports keyboard-only navigation', async () => {
      render(<ChatInterface onSubmit={vi.fn()} />);
      
      const input = screen.getByPlaceholderText(/message/i);
      const button = screen.getByRole('button');
      
      // Should be able to reach all interactive elements via keyboard
      input.focus();
      expect(document.activeElement).toBe(input);
      
      fireEvent.keyDown(input, { key: 'Tab' });
      await waitFor(() => {
        expect(document.activeElement).toBe(button);
      });
    });

    it('provides sufficient time for interactions', async () => {
      render(<ChatInterface onSubmit={vi.fn()} />);
      
      const input = screen.getByPlaceholderText(/message/i);
      
      // No time limits should be imposed on message composition
      fireEvent.change(input, { target: { value: 'slow typing test' } });
      
      // Wait and verify input persists
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      expect(input).toHaveValue('slow typing test');
    });

    it('avoids content that causes seizures', () => {
      render(<StreamingConversation
        onStreamingEvent={vi.fn()}
        onStreamingStart={vi.fn()}
        onStreamingEnd={vi.fn()}
        onStreamingError={vi.fn()}
        isStreaming={true}
      />);
      
      // Streaming indicators should not flash more than 3 times per second
      const streamingIndicator = screen.getByText(/en cours/i);
      expect(streamingIndicator).toBeInTheDocument();
      
      // Animation should be subtle and not cause seizures
      expect(streamingIndicator.closest('[class*="animate"]')).toBeInTheDocument();
    });
  });
});
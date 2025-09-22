import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import StreamingConversation from '@/components/dashboard/StreamingConversation';
import { mockStreamEvent } from '../utils/test-utils';
import { StreamEvent } from '@/services/apiStreaming';

/**
 * Unit Tests for StreamingConversation Component
 * Tests streaming message display, event handling, and conversation flow
 */

// Mock child components
vi.mock('@/components/dashboard/SearchBar', () => ({
  default: ({ onSubmit, searchQuery, setSearchQuery }: any) => (
    <div data-testid="search-bar">
      <input
        data-testid="search-input"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Type your message"
      />
      <button onClick={() => onSubmit(searchQuery)}>Submit</button>
    </div>
  ),
}));

vi.mock('@/components/dashboard/TypewriterText', () => ({
  default: ({ text }: { text: string }) => (
    <div data-testid="typewriter-text">{text}</div>
  ),
}));

describe('StreamingConversation Component', () => {
  const mockOnStreamingEvent = vi.fn();
  const mockOnStreamingStart = vi.fn();
  const mockOnStreamingEnd = vi.fn();
  const mockOnStreamingError = vi.fn();

  const defaultProps = {
    onStreamingEvent: mockOnStreamingEvent,
    onStreamingStart: mockOnStreamingStart,
    onStreamingEnd: mockOnStreamingEnd,
    onStreamingError: mockOnStreamingError,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders streaming conversation interface correctly', () => {
    render(<StreamingConversation {...defaultProps} />);
    
    expect(screen.getByText(/conversation/i)).toBeInTheDocument();
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
  });

  it('displays simplified thinking indicator during streaming', () => {
    const events: StreamEvent[] = [
      {
        ...mockStreamEvent,
        type: 'connection',
        display: 'Connecting to assistant...',
      },
      {
        ...mockStreamEvent,
        id: 'event-2',
        type: 'message',
        display: 'Processing your request...',
      },
    ];

    render(<StreamingConversation {...defaultProps} events={events} isStreaming={true} />);
    
    // Should show simple thinking indicator instead of detailed events
    expect(screen.getByText('Thinking...')).toBeInTheDocument();
    // Should NOT show detailed event information
    expect(screen.queryByText('Connecting to assistant...')).not.toBeInTheDocument();
    expect(screen.queryByText('Processing your request...')).not.toBeInTheDocument();
  });

  it('shows streaming indicator when streaming is active', () => {
    render(<StreamingConversation {...defaultProps} isStreaming={true} />);
    
    expect(screen.getByText(/thinking/i)).toBeInTheDocument();
    // Should show animated dots
    expect(screen.getByText(/thinking/i).closest('div')).toHaveClass('animate-pulse');
  });

  it('displays final response with typewriter effect', () => {
    const finalResponse = 'This is the final assistant response.';
    
    render(<StreamingConversation {...defaultProps} finalResponse={finalResponse} />);
    
    expect(screen.getByTestId('typewriter-text')).toHaveTextContent(finalResponse);
  });

  it('handles message submission through embedded search bar', async () => {
    render(<StreamingConversation {...defaultProps} />);
    
    const input = screen.getByTestId('search-input');
    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    fireEvent.change(input, { target: { value: 'New message' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('New message')).toBeInTheDocument();
    });
  });

  it('hides detailed events when not streaming', () => {
    const events: StreamEvent[] = [
      {
        ...mockStreamEvent,
        type: 'connection',
        display: 'Connection event',
      },
      {
        ...mockStreamEvent,
        id: 'event-2',
        type: 'message',
        display: 'Message event',
      },
      {
        ...mockStreamEvent,
        id: 'event-3',
        type: 'log',
        display: 'Log event',
      },
      {
        ...mockStreamEvent,
        id: 'event-4',
        type: 'final_response',
        display: 'Final response event',
        full_content: 'Final response content',
        data: { response: 'Final response content', session_id: 'test' },
      },
    ];

    render(<StreamingConversation {...defaultProps} events={events} isStreaming={false} />);
    
    // Detailed event displays should NOT be present
    expect(screen.queryByText('Connection event')).not.toBeInTheDocument();
    expect(screen.queryByText('Message event')).not.toBeInTheDocument();
    expect(screen.queryByText('Log event')).not.toBeInTheDocument();
    
    // But final response should still be shown
    expect(screen.getByText('Final response content')).toBeInTheDocument();
  });

  it('hides event timestamps during simplified streaming', () => {
    const event: StreamEvent = {
      ...mockStreamEvent,
      timestamp: new Date('2025-01-01T10:30:00Z').toISOString(),
      display: 'Timed event',
      type: 'connection',
    };

    render(<StreamingConversation {...defaultProps} events={[event]} isStreaming={true} />);
    
    // Should show thinking indicator instead of detailed events
    expect(screen.getByText('Thinking...')).toBeInTheDocument();
    // Detailed event and timestamp should not be visible
    expect(screen.queryByText('Timed event')).not.toBeInTheDocument();
    expect(screen.queryByText(/10:30/)).not.toBeInTheDocument();
  });

  it('handles conversation history correctly', async () => {
    const { rerender } = render(<StreamingConversation {...defaultProps} />);
    
    // Submit first message
    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'First message' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(screen.getByText('First message')).toBeInTheDocument();
    });
    
    // Add response and submit second message
    rerender(<StreamingConversation {...defaultProps} finalResponse="First response" />);
    
    fireEvent.change(input, { target: { value: 'Second message' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('First response')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
    });
  });

  it('scrolls to bottom when new messages arrive', async () => {
    const scrollIntoViewSpy = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewSpy;
    
    render(<StreamingConversation {...defaultProps} />);
    
    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'Scroll test' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(scrollIntoViewSpy).toHaveBeenCalled();
    });
  });

  it('shows only simple thinking indicator instead of processing section', () => {
    const events: StreamEvent[] = [
      {
        ...mockStreamEvent,
        type: 'connection',
        display: 'Connection',
      },
      {
        ...mockStreamEvent,
        id: 'event-2',
        type: 'message',
        display: 'Message',
      },
      {
        ...mockStreamEvent,
        id: 'event-3',
        type: 'log',
        display: 'Log entry',
      },
    ];

    render(<StreamingConversation {...defaultProps} events={events} isStreaming={true} />);
    
    // Should show simple thinking indicator
    expect(screen.getByText('Thinking...')).toBeInTheDocument();
    
    // Should NOT show detailed processing events
    expect(screen.queryByText('Connection')).not.toBeInTheDocument();
    expect(screen.queryByText('Message')).not.toBeInTheDocument();
    expect(screen.queryByText('Log entry')).not.toBeInTheDocument();
  });

  it('hides full content for message events during streaming', () => {
    const eventWithContent: StreamEvent = {
      ...mockStreamEvent,
      type: 'message',
      display: 'Message event',
      full_content: 'This is the full content of the message.',
      data: { role: 'assistant' },
    };

    render(<StreamingConversation {...defaultProps} events={[eventWithContent]} isStreaming={true} />);
    
    // Should show simple thinking indicator instead of full content
    expect(screen.getByText('Thinking...')).toBeInTheDocument();
    expect(screen.queryByText('This is the full content of the message.')).not.toBeInTheDocument();
  });

  it('shows simplified UI for user message events during streaming', () => {
    const userEvent: StreamEvent = {
      ...mockStreamEvent,
      type: 'message',
      display: 'User message',
      full_content: 'User content should not be shown',
      data: { role: 'user' },
    };

    render(<StreamingConversation {...defaultProps} events={[userEvent]} isStreaming={true} />);
    
    // Should show simple thinking indicator
    expect(screen.getByText('Thinking...')).toBeInTheDocument();
    // Should not show detailed user message events
    expect(screen.queryByText('User message')).not.toBeInTheDocument();
    expect(screen.queryByText('User content should not be shown')).not.toBeInTheDocument();
  });

  describe('Props Updates', () => {
    it('updates events when props change', () => {
      const initialEvents = [{ ...mockStreamEvent, display: 'Initial event' }];
      const { rerender } = render(<StreamingConversation {...defaultProps} events={initialEvents} />);
      
      expect(screen.getByText('Initial event')).toBeInTheDocument();
      
      const updatedEvents = [
        ...initialEvents,
        { ...mockStreamEvent, id: 'event-2', display: 'New event' },
      ];
      
      rerender(<StreamingConversation {...defaultProps} events={updatedEvents} />);
      
      expect(screen.getByText('Initial event')).toBeInTheDocument();
      expect(screen.getByText('New event')).toBeInTheDocument();
    });

    it('updates final response when props change', () => {
      const { rerender } = render(<StreamingConversation {...defaultProps} />);
      
      expect(screen.queryByTestId('typewriter-text')).not.toBeInTheDocument();
      
      rerender(<StreamingConversation {...defaultProps} finalResponse="Updated response" />);
      
      expect(screen.getByTestId('typewriter-text')).toHaveTextContent('Updated response');
    });

    it('updates streaming state when props change', () => {
      const { rerender } = render(<StreamingConversation {...defaultProps} />);
      
      expect(screen.queryByText(/thinking/i)).not.toBeInTheDocument();
      
      rerender(<StreamingConversation {...defaultProps} isStreaming={true} />);
      
      expect(screen.getByText(/thinking/i)).toBeInTheDocument();
    });
  });

  describe('Final Response Display', () => {
    it('displays final response after simple thinking indicator', () => {
      const events: StreamEvent[] = [
        {
          ...mockStreamEvent,
          type: 'connection',
          display: 'Connected to assistant',
        },
        {
          ...mockStreamEvent,
          id: 'event-2',
          type: 'message',
          display: 'Processing request',
          full_content: 'Thinking about your question...',
          data: { role: 'assistant' },
        },
        {
          ...mockStreamEvent,
          id: 'event-3',
          type: 'final_response',
          display: 'Final response',
          full_content: '6 + 6 = 12',
          data: { response: '6 + 6 = 12', session_id: 'test-session' },
        },
      ];

      render(<StreamingConversation {...defaultProps} events={events} isStreaming={false} />);
      
      // Should NOT show detailed thinking events
      expect(screen.queryByText('Connected to assistant')).not.toBeInTheDocument();
      expect(screen.queryByText('Thinking about your question...')).not.toBeInTheDocument();
      
      // But final response should still appear
      expect(screen.getByText('6 + 6 = 12')).toBeInTheDocument();
    });

    it('displays multiple final responses if present', () => {
      const events: StreamEvent[] = [
        {
          ...mockStreamEvent,
          type: 'final_response',
          display: 'First response',
          full_content: 'First answer',
          data: { response: 'First answer', session_id: 'test-session-1' },
        },
        {
          ...mockStreamEvent,
          id: 'event-2',
          type: 'final_response',
          display: 'Second response',
          full_content: 'Second answer',
          data: { response: 'Second answer', session_id: 'test-session-2' },
        },
      ];

      render(<StreamingConversation {...defaultProps} events={events} />);
      
      expect(screen.getByText('First answer')).toBeInTheDocument();
      expect(screen.getByText('Second answer')).toBeInTheDocument();
    });

    it('handles final response with data.response field', () => {
      const events: StreamEvent[] = [
        {
          ...mockStreamEvent,
          type: 'final_response',
          display: 'Response from data field',
          data: { response: 'Answer from data.response', session_id: 'test-session' },
        },
      ];

      render(<StreamingConversation {...defaultProps} events={events} />);
      
      expect(screen.getByText('Answer from data.response')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(<StreamingConversation {...defaultProps} />);
      
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/conversation/i);
    });

    it('provides proper labels for streaming status', () => {
      render(<StreamingConversation {...defaultProps} isStreaming={true} />);
      
      const statusIndicator = screen.getByText(/thinking/i);
      expect(statusIndicator).toBeInTheDocument();
    });
  });
});
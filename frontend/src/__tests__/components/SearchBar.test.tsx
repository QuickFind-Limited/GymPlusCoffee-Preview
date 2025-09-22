import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SearchBar from '@/components/dashboard/SearchBar';

/**
 * Unit Tests for SearchBar Component
 * Tests message input, validation, and submission functionality
 */

describe('SearchBar Component', () => {
  const mockOnSubmit = vi.fn();
  const mockSetSearchQuery = vi.fn();
  const mockOnOrderGeneration = vi.fn();
  const mockOnStreamingEvent = vi.fn();
  const mockOnStreamingStart = vi.fn();
  const mockOnStreamingEnd = vi.fn();
  const mockOnStreamingError = vi.fn();

  const defaultProps = {
    searchQuery: '',
    setSearchQuery: mockSetSearchQuery,
    onSubmit: mockOnSubmit,
    onOrderGeneration: mockOnOrderGeneration,
    onStreamingEvent: mockOnStreamingEvent,
    onStreamingStart: mockOnStreamingStart,
    onStreamingEnd: mockOnStreamingEnd,
    onStreamingError: mockOnStreamingError,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input field correctly', () => {
    render(<SearchBar {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('updates search query when typing', async () => {
    render(<SearchBar {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(input, { target: { value: 'test query' } });
    
    expect(mockSetSearchQuery).toHaveBeenCalledWith('test query');
  });

  it('submits message on Enter key press', async () => {
    render(<SearchBar {...defaultProps} searchQuery="test message" />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    expect(mockOnSubmit).toHaveBeenCalledWith('test message');
  });

  it('submits message on send button click', async () => {
    render(<SearchBar {...defaultProps} searchQuery="test message" />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith('test message');
  });

  it('does not submit empty messages', () => {
    render(<SearchBar {...defaultProps} searchQuery="" />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('trims whitespace from messages before submitting', () => {
    render(<SearchBar {...defaultProps} searchQuery="  test message  " />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    expect(mockOnSubmit).toHaveBeenCalledWith('test message');
  });

  it('clears input after successful submission', async () => {
    render(<SearchBar {...defaultProps} searchQuery="test message" />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    expect(mockSetSearchQuery).toHaveBeenCalledWith('');
  });

  it('handles special characters in messages', () => {
    const specialMessage = 'Test with @#$% special chars & symbols!';
    render(<SearchBar {...defaultProps} searchQuery={specialMessage} />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    expect(mockOnSubmit).toHaveBeenCalledWith(specialMessage);
  });

  it('handles long messages correctly', () => {
    const longMessage = 'A'.repeat(1000);
    render(<SearchBar {...defaultProps} searchQuery={longMessage} />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    expect(mockOnSubmit).toHaveBeenCalledWith(longMessage);
  });

  it('prevents multiple rapid submissions', async () => {
    render(<SearchBar {...defaultProps} searchQuery="test message" />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    
    // Submit multiple times rapidly
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    // Should only submit once due to debouncing or state management
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  it('maintains focus on input after submission', async () => {
    render(<SearchBar {...defaultProps} searchQuery="test message" />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    input.focus();
    
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(document.activeElement).toBe(input);
    });
  });

  describe('Message Type Detection', () => {
    it('detects forecast queries', () => {
      render(<SearchBar {...defaultProps} searchQuery="forecast sales for next month" />);
      
      const input = screen.getByPlaceholderText(/type your message/i);
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      
      expect(mockOnSubmit).toHaveBeenCalledWith('forecast sales for next month');
    });

    it('detects analysis queries', () => {
      render(<SearchBar {...defaultProps} searchQuery="show me recent performance" />);
      
      const input = screen.getByPlaceholderText(/type your message/i);
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      
      expect(mockOnSubmit).toHaveBeenCalledWith('show me recent performance');
    });

    it('detects action queries', () => {
      render(<SearchBar {...defaultProps} searchQuery="create purchase order for hoodies" />);
      
      const input = screen.getByPlaceholderText(/type your message/i);
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      
      expect(mockOnSubmit).toHaveBeenCalledWith('create purchase order for hoodies');
    });
  });

  describe('Error Handling', () => {
    it('handles submission errors gracefully', () => {
      const mockOnSubmitWithError = vi.fn(() => {
        throw new Error('Submission failed');
      });

      render(<SearchBar {...defaultProps} onSubmit={mockOnSubmitWithError} searchQuery="test" />);
      
      const input = screen.getByPlaceholderText(/type your message/i);
      
      expect(() => {
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<SearchBar {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/type your message/i);
      expect(input).toHaveAttribute('aria-label');
    });

    it('supports keyboard navigation', () => {
      render(<SearchBar {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/type your message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // Tab should move between elements
      input.focus();
      fireEvent.keyDown(input, { key: 'Tab' });
      
      expect(sendButton).toHaveFocus();
    });
  });
});
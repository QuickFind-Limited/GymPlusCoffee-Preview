/**
 * Navigation utilities for the dashboard and conversation system
 */

import { NavigateFunction } from 'react-router-dom';

/**
 * Navigates to the dashboard with an initial message that will appear 
 * as the first message in the conversation
 * 
 * @param navigate - React Router navigate function
 * @param message - The initial message to display in the conversation
 */
export const navigateToConversation = (navigate: NavigateFunction, message: string) => {
  if (!message || message.trim().length === 0) {
    console.warn('navigateToConversation: Empty message provided');
    navigate('/dashboard');
    return;
  }

  if (message.trim().length > 1000) {
    console.warn('navigateToConversation: Message too long, truncating');
    message = message.trim().substring(0, 1000);
  }

  const encodedMessage = encodeURIComponent(message.trim());
  navigate(`/dashboard?message=${encodedMessage}`);
};

/**
 * Navigates to the order summary page with a query parameter
 * 
 * @param navigate - React Router navigate function
 * @param query - The search query to pass to the order summary page
 */
export const navigateToOrderSummary = (navigate: NavigateFunction, query: string) => {
  const encodedQuery = encodeURIComponent(query.trim());
  navigate(`/order-summary?query=${encodedQuery}`);
};

/**
 * Extracts message parameter from URL search params safely
 * 
 * @param searchParams - URLSearchParams object
 * @returns Decoded message or null if not present or invalid
 */
export const extractMessageFromParams = (searchParams: URLSearchParams): string | null => {
  const messageParam = searchParams.get('message');
  if (!messageParam) return null;

  try {
    const decodedMessage = decodeURIComponent(messageParam);
    
    // Validate the decoded message
    if (decodedMessage.trim().length > 0 && decodedMessage.trim().length <= 1000) {
      return decodedMessage.trim();
    }
    
    console.warn('Invalid message parameter: too long or empty');
    return null;
  } catch (error) {
    console.error('Failed to decode message parameter:', error);
    return null;
  }
};
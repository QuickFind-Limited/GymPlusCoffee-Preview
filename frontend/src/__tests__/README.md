# Message Flow Test Suite

## Overview

This comprehensive test suite ensures that messages properly flow from the homepage through to conversations, providing robust testing coverage for the complete user journey.

## Architecture

The message flow follows this path:
1. **Homepage (Index.tsx)** - Redirects to auth
2. **Dashboard** - Main interface with search functionality
3. **SearchBar** - Message input and submission
4. **ChatInterface/StreamingConversation** - Message display and processing

## Test Structure

```
src/__tests__/
├── utils/
│   └── test-utils.tsx              # Test utilities and providers
├── components/
│   ├── SearchBar.test.tsx          # SearchBar unit tests
│   ├── ChatInterface.test.tsx      # ChatInterface unit tests
│   └── StreamingConversation.test.tsx # StreamingConversation unit tests
├── integration/
│   └── MessageFlow.test.tsx        # Integration tests
├── e2e/
│   └── MessageFlowE2E.test.tsx     # End-to-end tests
├── edge-cases/
│   └── MessageEdgeCases.test.tsx   # Edge case and boundary tests
├── performance/
│   └── MessagePerformance.test.tsx # Performance and scalability tests
├── accessibility/
│   └── MessageAccessibility.test.tsx # Accessibility and WCAG compliance tests
├── setup/
│   └── test-setup.ts              # Global test configuration
└── README.md                      # This documentation
```

## Test Categories

### 1. Unit Tests (`components/`)

**SearchBar Tests:**
- Message input validation
- Submission handling
- Keyboard interactions
- State management
- Error handling

**ChatInterface Tests:**
- Message processing
- Conversation history management
- LocalStorage integration
- Message type detection
- Purchase order parsing

**StreamingConversation Tests:**
- Streaming event handling
- Real-time message display
- Event type rendering
- Conversation state management

### 2. Integration Tests (`integration/`)

Tests the complete flow from dashboard to conversation:
- Dashboard to ChatInterface transitions
- Message flow through components
- State preservation
- Error propagation
- Authentication integration

### 3. End-to-End Tests (`e2e/`)

Full application journey testing:
- Complete user workflows
- Cross-component interactions
- State persistence
- Performance under load
- Error recovery

### 4. Edge Case Tests (`edge-cases/`)

Boundary conditions and unusual inputs:
- Extremely long messages
- Special characters and Unicode
- Malformed data handling
- Memory pressure scenarios
- Browser compatibility issues

### 5. Performance Tests (`performance/`)

Scalability and optimization:
- Rendering performance benchmarks
- Memory usage monitoring
- Large conversation handling
- Concurrent operation support
- Performance regression detection

### 6. Accessibility Tests (`accessibility/`)

WCAG 2.1 AA compliance:
- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- High contrast mode
- Reduced motion preferences

## Key Test Scenarios

### Message Input and Submission
```typescript
it('submits message on Enter key press', async () => {
  render(<SearchBar {...defaultProps} searchQuery="test message" />);
  
  const input = screen.getByPlaceholderText(/type your message/i);
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
  
  expect(mockOnSubmit).toHaveBeenCalledWith('test message');
});
```

### Message Type Detection
```typescript
it('detects forecast queries', () => {
  render(<SearchBar {...defaultProps} searchQuery="forecast sales for next month" />);
  
  const input = screen.getByPlaceholderText(/type your message/i);
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
  
  expect(mockOnSubmit).toHaveBeenCalledWith('forecast sales for next month');
});
```

### Conversation Flow
```typescript
it('handles multiple message exchanges in sequence', async () => {
  window.history.pushState({}, '', '/dashboard');
  render(<App />);
  
  // Submit first message
  let searchInput = screen.getByPlaceholderText(/type your message/i);
  fireEvent.change(searchInput, { target: { value: 'first query' } });
  fireEvent.keyDown(searchInput, { key: 'Enter' });
  
  // Verify both messages appear
  await waitFor(() => {
    expect(screen.getByText('first query')).toBeInTheDocument();
  });
});
```

### Performance Monitoring
```typescript
it('renders within performance budget', () => {
  const startTime = performance.now();
  render(<ChatInterface onSubmit={vi.fn()} />);
  const endTime = performance.now();
  
  const renderTime = endTime - startTime;
  expect(renderTime).toBeLessThan(300); // Should render in < 300ms
});
```

### Accessibility Compliance
```typescript
it('supports keyboard navigation', async () => {
  render(<SearchBar {...defaultProps} searchQuery="test message" />);
  
  const input = screen.getByPlaceholderText(/type your message/i);
  const submitButton = screen.getByRole('button');
  
  input.focus();
  fireEvent.keyDown(input, { key: 'Tab' });
  
  await waitFor(() => {
    expect(document.activeElement).toBe(submitButton);
  });
});
```

## Running Tests

### All Message Flow Tests
```bash
npm run test -- __tests__
```

### Specific Test Categories
```bash
# Unit tests only
npm run test -- __tests__/components

# Integration tests
npm run test -- __tests__/integration

# E2E tests
npm run test -- __tests__/e2e

# Performance tests
npm run test -- __tests__/performance

# Accessibility tests
npm run test -- __tests__/accessibility
```

### With Coverage
```bash
npm run test:coverage -- __tests__
```

### Watch Mode
```bash
npm run test -- __tests__ --watch
```

## Test Configuration

### Custom Vitest Config
The project includes a specialized Vitest configuration (`vitest.config.message-tests.ts`) optimized for message flow testing:

```typescript
export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/__tests__/setup/test-setup.ts'],
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      thresholds: {
        global: {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

### Global Test Setup
All tests use a shared setup (`test-setup.ts`) that includes:
- Mock implementations for browser APIs
- Global test utilities
- Performance monitoring setup
- Accessibility testing helpers

## Mock Strategy

### Component Mocking
Complex child components are mocked to focus on message flow logic:

```typescript
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
```

### Service Mocking
External services and APIs are mocked for reliable testing:

```typescript
const mockSupabaseAuth = {
  getUser: vi.fn().mockResolvedValue({ data: { user: mockAuthUser } }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: mockSupabaseAuth,
  },
}));
```

## Coverage Targets

The test suite aims for comprehensive coverage:

- **Statements:** 80%+
- **Branches:** 75%+
- **Functions:** 80%+
- **Lines:** 80%+

Critical message flow components have higher coverage requirements:
- SearchBar: 90%+
- ChatInterface: 85%+
- StreamingConversation: 85%+

## Performance Benchmarks

Performance tests establish benchmarks for:

- **Initial render time:** < 300ms
- **Message submission:** < 100ms
- **Large conversation load:** < 1000ms
- **Memory usage growth:** < 10MB per 50 messages
- **Scroll performance:** < 50ms per scroll event

## Accessibility Standards

All tests verify compliance with:

- **WCAG 2.1 AA** guidelines
- **Section 508** requirements
- **ARIA** best practices
- **Keyboard navigation** support
- **Screen reader** compatibility

## Continuous Integration

Tests are designed for CI/CD environments:

- **Fast execution:** Most tests complete in < 10s
- **Reliable mocking:** No external dependencies
- **Parallel execution:** Tests can run concurrently
- **Clear reporting:** Detailed coverage and performance reports

## Debugging Tests

### Common Issues

1. **Timing Issues:** Use `waitFor` for asynchronous operations
2. **Mock Problems:** Verify mock implementations match real APIs
3. **DOM Cleanup:** Ensure proper cleanup between tests
4. **Memory Leaks:** Monitor memory usage in performance tests

### Debug Utilities

```typescript
// Enable debug mode
screen.debug();

// Check component tree
console.log(container.innerHTML);

// Verify mock calls
console.log(mockFunction.mock.calls);
```

## Contributing

When adding new message flow features:

1. **Add unit tests** for new components
2. **Update integration tests** for flow changes
3. **Add edge case tests** for boundary conditions
4. **Verify accessibility** compliance
5. **Monitor performance** impact
6. **Update documentation** as needed

## Future Enhancements

Planned test suite improvements:

- **Visual regression tests** for UI consistency
- **Load testing** for scalability validation
- **Cross-browser testing** automation
- **Mobile responsiveness** testing
- **Internationalization** testing support
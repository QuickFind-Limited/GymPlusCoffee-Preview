import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSubmit: (query: string) => void | Promise<void>;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  onSubmit,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [searchQuery]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    await onSubmit(trimmed);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit(event as unknown as React.FormEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative mb-3">
      <div className={`relative transition-all duration-300`}>
        <textarea
          ref={textareaRef}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Ask anything about NetSuite data, purchase orders, or forecasts..."
          className={`w-full resize-none rounded-3xl border-2 px-6 py-4 pr-16 text-base leading-relaxed shadow-sm transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-primary/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white ${
            isFocused ? 'border-primary shadow-lg' : 'border-gray-200 dark:border-gray-700'
          }`}
        />
        <button
          type="submit"
          className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90"
          aria-label="Submit query"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>

    </form>
  );
};

export default SearchBar;

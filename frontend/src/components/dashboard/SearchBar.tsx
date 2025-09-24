import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSubmit: (query: string) => void | Promise<void>;
  onNavigateToConversation?: (message: string) => void;
  onOrderGeneration?: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  onSubmit,
  onNavigateToConversation,
  onOrderGeneration,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

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
    navigate('/dashboard');
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

      <Collapsible
        open={isAdvancedOpen}
        onOpenChange={setIsAdvancedOpen}
        className="mt-2 text-sm text-gray-500 dark:text-gray-400"
      >
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          Advanced options
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="space-y-2">
            <Label htmlFor="quick-jump" className="text-xs uppercase tracking-wide">
              Jump to saved conversation
            </Label>
            <Input
              id="quick-jump"
              placeholder="Paste a conversation ID"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && event.currentTarget.value.trim()) {
                  onNavigateToConversation?.(event.currentTarget.value.trim());
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-query" className="text-xs uppercase tracking-wide">
              Quick order generation
            </Label>
            <Input
              id="order-query"
              placeholder="e.g. Generate PO for 200 units of black hoodies"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && event.currentTarget.value.trim()) {
                  onOrderGeneration?.(event.currentTarget.value.trim());
                }
              }}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </form>
  );
};

export default SearchBar;

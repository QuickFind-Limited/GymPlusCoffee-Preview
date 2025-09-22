import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVectorSearch } from '@/hooks/useVectorSearch';
import type { SearchStrategy } from '@/types/search.types';

interface SearchSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
  onSearchStrategyChange?: (strategy: SearchStrategy) => void;
  currentStrategy?: SearchStrategy;
  isVisible?: boolean;
  onClose?: () => void;
}

const POPULAR_SEARCHES = [
  'birthday party decorations',
  'school supplies under £10',
  'outdoor summer toys',
  'arts and crafts materials',
  'kitchen essentials',
  'home office furniture',
  'fitness equipment',
  'jewelry collection'
];

const SEARCH_CATEGORIES = [
  { name: 'Clothing', query: 'fashion apparel clothing' },
  { name: 'Home & Garden', query: 'home decor furniture garden' },
  { name: 'Electronics', query: 'electronics technology gadgets' },
  { name: 'Beauty', query: 'beauty cosmetics skincare' },
  { name: 'Sports', query: 'sports fitness outdoor activities' },
  { name: 'Books & Education', query: 'books educational learning' },
  { name: 'Food & Beverages', query: 'food drinks beverages' },
  { name: 'Toys & Games', query: 'toys games children entertainment' }
];

export default function SearchSuggestions({
  onSuggestionClick,
  onSearchStrategyChange,
  currentStrategy = 'hybrid',
  isVisible = true,
  onClose
}: SearchSuggestionsProps) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<SearchStrategy>(currentStrategy);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recent-searches');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentSearches(parsed.slice(0, 5)); // Show only last 5
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
      }
    }
  }, []);

  // Save search to recent searches
  const addToRecentSearches = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  };

  const handleSuggestionClick = (suggestion: string) => {
    addToRecentSearches(suggestion);
    onSuggestionClick(suggestion);
  };

  const handleStrategyChange = (strategy: SearchStrategy) => {
    setSelectedStrategy(strategy);
    if (onSearchStrategyChange) {
      onSearchStrategyChange(strategy);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent-searches');
  };

  if (!isVisible) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      {/* Header with close button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="font-medium text-gray-900">Search Suggestions</h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        )}
      </div>

      {/* Search Strategy Selector */}
      {onSearchStrategyChange && (
        <div className="p-4 border-b border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Search Method</h4>
          <div className="flex space-x-2">
            {(['semantic', 'combined', 'hybrid'] as SearchStrategy[]).map((strategy) => (
              <Button
                key={strategy}
                variant={selectedStrategy === strategy ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStrategyChange(strategy)}
                className="text-xs"
              >
                {strategy === 'semantic' && 'Meaning-based'}
                {strategy === 'combined' && 'Multi-field'}
                {strategy === 'hybrid' && 'Smart Search'}
              </Button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {selectedStrategy === 'semantic' && 'Searches by meaning and context'}
            {selectedStrategy === 'combined' && 'Searches across all product fields'}
            {selectedStrategy === 'hybrid' && 'Combines AI understanding with keywords'}
          </p>
        </div>
      )}

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <Clock size={16} className="mr-1" />
              Recent Searches
            </h4>
            <Button variant="ghost" size="sm" onClick={clearRecentSearches} className="text-xs">
              Clear
            </Button>
          </div>
          <div className="space-y-1">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(search)}
                className="w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular Searches */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          <TrendingUp size={16} className="mr-1" />
          Popular Searches
        </h4>
        <div className="space-y-1">
          {POPULAR_SEARCHES.map((search, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(search)}
              className="w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded"
            >
              {search}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          <Search size={16} className="mr-1" />
          Browse Categories
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {SEARCH_CATEGORIES.map((category, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(category.query)}
              className="text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded border border-gray-200"
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
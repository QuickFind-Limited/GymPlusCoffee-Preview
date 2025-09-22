import React, { useState } from 'react';
import { Activity, Clock, Zap, Database, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SearchStrategy } from '@/types/search.types';

interface PerformanceMetrics {
  embeddingTime: number;
  searchTime: number;
  totalTime: number;
  cacheHit: boolean;
}

interface SearchPerformanceMonitorProps {
  performanceMetrics: PerformanceMetrics | null;
  strategy: SearchStrategy;
  resultsCount: number;
  query: string;
  debugInfo?: {
    embedding_generated: boolean;
    fallback_used: boolean;
    error?: string;
  };
  isVisible?: boolean;
  className?: string;
}

export default function SearchPerformanceMonitor({
  performanceMetrics,
  strategy,
  resultsCount,
  query,
  debugInfo,
  isVisible = false,
  className = ''
}: SearchPerformanceMonitorProps) {
  const [expanded, setExpanded] = useState(false);

  if (!performanceMetrics && !debugInfo) {
    return null;
  }

  const getPerformanceStatus = (totalTime: number) => {
    if (totalTime < 200) return { label: 'Excellent', color: 'bg-green-500' };
    if (totalTime < 500) return { label: 'Good', color: 'bg-blue-500' };
    if (totalTime < 1000) return { label: 'Fair', color: 'bg-yellow-500' };
    return { label: 'Slow', color: 'bg-red-500' };
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const performanceStatus = performanceMetrics 
    ? getPerformanceStatus(performanceMetrics.totalTime)
    : { label: 'Unknown', color: 'bg-gray-500' };

  if (!isVisible) {
    // Compact view - just show a small performance indicator
    return (
      <div className={`flex items-center space-x-2 text-xs text-gray-500 ${className}`}>
        {performanceMetrics && (
          <>
            <div className="flex items-center">
              <Clock size={12} className="mr-1" />
              {formatTime(performanceMetrics.totalTime)}
            </div>
            {performanceMetrics.cacheHit && (
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                Cached
              </span>
            )}
            <div className={`w-2 h-2 rounded-full ${performanceStatus.color}`} />
          </>
        )}
        {debugInfo?.fallback_used && (
          <span className="border border-yellow-300 text-yellow-600 text-xs px-2 py-1 rounded">
            Fallback
          </span>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-sm">
            <Activity className="mr-2 h-4 w-4" />
            Search Performance
            <div className={`ml-2 w-3 h-3 rounded-full ${performanceStatus.color}`} />
            <span className="ml-1 text-xs font-normal text-gray-600">
              {performanceStatus.label}
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-6 px-2"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Basic Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {performanceMetrics ? formatTime(performanceMetrics.totalTime) : 'N/A'}
            </div>
            <div className="text-xs text-gray-500">Total Time</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{resultsCount}</div>
            <div className="text-xs text-gray-500">Results</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 capitalize">{strategy}</div>
            <div className="text-xs text-gray-500">Strategy</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {performanceMetrics?.cacheHit ? 'Yes' : 'No'}
            </div>
            <div className="text-xs text-gray-500">Cached</div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {debugInfo?.embedding_generated && (
            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded flex items-center">
              <Zap size={12} className="mr-1" />
              AI Embedding
            </span>
          )}
          
          {performanceMetrics?.cacheHit && (
            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded flex items-center">
              <Database size={12} className="mr-1" />
              Cache Hit
            </span>
          )}
          
          {debugInfo?.fallback_used && (
            <span className="border border-yellow-300 text-yellow-600 text-xs px-2 py-1 rounded flex items-center">
              <BarChart3 size={12} className="mr-1" />
              Keyword Fallback
            </span>
          )}
          
          {debugInfo?.error && (
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
              Error Occurred
            </span>
          )}
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            {/* Timing Breakdown */}
            {performanceMetrics && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Timing Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Embedding Generation:</span>
                    <span className="font-mono">{formatTime(performanceMetrics.embeddingTime)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Database Search:</span>
                    <span className="font-mono">{formatTime(performanceMetrics.searchTime)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-gray-900">Total Time:</span>
                    <span className="font-mono">{formatTime(performanceMetrics.totalTime)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Query Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Query Details</h4>
              <div className="bg-gray-50 rounded p-3">
                <div className="text-sm text-gray-700 mb-2">
                  <strong>Query:</strong> "{query}"
                </div>
                <div className="text-sm text-gray-700">
                  <strong>Strategy:</strong> {strategy} 
                  {strategy === 'semantic' && ' (Meaning-based search)'}
                  {strategy === 'combined' && ' (Multi-field search)'}
                  {strategy === 'hybrid' && ' (AI + Keyword search)'}
                </div>
              </div>
            </div>

            {/* Debug Information */}
            {debugInfo && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Debug Information</h4>
                <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
                  <div className="text-gray-700">
                    <strong>Embedding Generated:</strong> {debugInfo.embedding_generated ? 'Yes' : 'No'}
                  </div>
                  <div className="text-gray-700">
                    <strong>Fallback Used:</strong> {debugInfo.fallback_used ? 'Yes' : 'No'}
                  </div>
                  {debugInfo.error && (
                    <div className="text-red-600">
                      <strong>Error:</strong> {debugInfo.error}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
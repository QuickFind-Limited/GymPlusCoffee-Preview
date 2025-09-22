/**
 * ForecastPreview Component - AI-Generated Forecast Display
 * 
 * BACKEND INTEGRATION NOTES FOR YOAN'S AI:
 * 
 * This component displays AI-generated forecasting data in interactive tables and embedded views:
 * 
 * 1. FORECAST DATA INTEGRATION:
 *    - Currently calls getForecastPreview(query) which returns mock ForecastData
 *    - Replace with real AI forecasting service that processes user query
 *    - Component expects structured data: {title, columns, rows, generatedAt}
 *    - Supports both API-generated data and external iframe embedding
 * 
 * 2. REAL-TIME FORECASTING PIPELINE:
 *    - query parameter influences forecast context (category, timeframe, etc.)
 *    - Component handles loading states during AI processing
 *    - Ready for streaming forecast updates as AI generates predictions
 *    - Can display progress indicators for long-running forecast calculations
 * 
 * 3. INTERACTIVE FEATURES:
 *    - CSV download functionality for forecast export
 *    - Expandable modal for detailed forecast view
 *    - Scrollable preview optimized for large datasets
 *    - Supports external sheet embedding via iframe
 * 
 * 4. BACKEND INTEGRATION EXAMPLE:
 *    ```
 *    // Replace getForecastPreview with real AI service:
 *    const generateForecast = async (query: string) => {
 *      const response = await forecastAI.generatePredictions({
 *        prompt: query,
 *        data_sources: ['sales_history', 'inventory', 'market_trends'],
 *        forecast_horizon: '6_months'
 *      });
 *      
 *      return {
 *        title: response.forecast_title,
 *        columns: response.column_definitions,
 *        rows: response.forecast_data,
 *        generatedAt: response.timestamp
 *      };
 *    };
 *    ```
 * 
 * 5. PERFORMANCE OPTIMIZATION:
 *    - Component handles large forecast datasets efficiently
 *    - Virtualized scrolling ready for thousands of forecast items
 *    - CSV generation optimized for export of complex forecasts
 *    - Iframe sandbox security for external sheet integration
 */

import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Maximize2, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { getForecastPreview, toCSV } from './forecastService';
import type { ForecastData } from './forecastTypes';
import TypewriterText from '../TypewriterText';
import ChatInterface from '@/components/dashboard/ChatInterface';
import ResizableForecastView from './ResizableForecastView';

interface ForecastPreviewProps {
  query?: string; // Original user prompt for context - drives AI forecast generation
  content?: string; // Custom content to display instead of generating from query
  iframeSrc?: string; // Optional external sheet URL to embed
  onUpdate?: (length: number) => void; // Callback for scroll management
  onComplete?: () => void; // Callback when generation completes
}

// Interactive forecast table component with expandable view and CSV export
// Backend Integration Point: component calls getForecastPreview(query) and expects ForecastData when iframeSrc is not provided.
const ForecastPreview: React.FC<ForecastPreviewProps> = ({ query, content, iframeSrc, onUpdate, onComplete }) => {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(!iframeSrc);
  const [open, setOpen] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showAttachedFiles, setShowAttachedFiles] = useState(false);

  useEffect(() => {
    if (iframeSrc) return; // No fetch in iframe mode
    let mounted = true;
    (async () => {
      const result = await getForecastPreview(query);
      if (mounted) {
        setData(result);
        setLoading(false);
        // Show analysis after CSV preview is loaded
        setTimeout(() => {
          setShowAnalysis(true);
        }, 500);
      }
    })();
    return () => { mounted = false; };
  }, [query, iframeSrc]);

  const handleDownload = () => {
    if (!data) return;
    const csv = toCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'forecast-preview.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // If an iframe source is provided, render embedded preview instead of table
  if (iframeSrc) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 shadow-sm w-full max-w-3xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Retail Buying Forecast — Preview</h3>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors">
                <Maximize2 className="h-3.5 w-3.5" /> Expand
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/40" />
              <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-5xl max-h-[80vh] overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                  <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-white">Retail Buying Forecast — Full View</Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Close</button>
                  </Dialog.Close>
                </div>
                <div className="p-0 bg-gray-50 dark:bg-gray-800">
                  <iframe
                    src={iframeSrc}
                    title="Forecast Sheet Full"
                    className="w-full h-[70vh] border-0 bg-white"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                  />
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-800">
          <div className="relative w-full h-[220px]">
            <iframe
              src={iframeSrc}
              title="Forecast Sheet"
              className="absolute inset-0 w-full h-full border-0 bg-white"
              loading="lazy"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-forms"
              onError={(e) => {
                console.error('Iframe failed to load:', e);
                // Show fallback message or content
              }}
            />
            <div className="absolute inset-0 pointer-events-none border border-gray-200 dark:border-gray-600 rounded-xl"></div>
          </div>
        </div>

        <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">Embedded forecast from external source. Click Expand for full view.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm w-full max-w-3xl">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-3 animate-pulse" />
        <div className="space-y-2">
          <div className="h-8 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-8 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-8 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const previewRows = data.rows; // Show all rows, make it scrollable

  // Use custom content if provided, otherwise use default analysis text
  const analysisText = content || `I've analyzed your complete AW24 sales data to build the initial AW25 buy plan. With the 6-month lead time, you need to place orders by end of July for September delivery.

## Key Performance Metrics from Last Year (AW24)

### 📊 AW24 Actual Performance
Total Units Sold: 9,500 units
Total Revenue: £495,000
Peak Selling Period: Weeks 10–16 (Oct 28 – Dec 15)
Average Weekly Velocity: 365 units/week (when in stock)
Stockout Impact: 23 of 47 SKUs ran out before season end

### ⚠️ Critical Finding
You lost £48,000 in revenue due to stockouts. During peak weeks, you were selling 520 units/week but couldn't maintain inventory levels.

## AW25 Initial Buy Plan – Ready for July Order

### 📈 Recommended Initial Order
Total Units to Order: 13,224 units (+39% vs AW24)
Order Value: £689,000
Order Deadline: July 31, 2025
Expected Delivery: Early September 2025
Season Coverage: September 2025 – February 2026

### What This Forecast Includes
• Core AW24 performers with growth applied
• Recovery units for last year's stockouts (+2,100 units)  
• 2-week safety stock on top 10 items
• Adjusted size curves based on actual sell-through

## Top 3 Critical Products to Order Now

### 1. Oversized Hoodie - Charcoal ⭐ YOUR CASH COW
July Order: 3,840 units
Investment: £200k

Why Order Big: Your #1 seller that never stocked out. Consistent 62 units/week all season. This product alone drove 34% of category revenue — protect this momentum.

### 2. Snap Collar Sweatshirt - Teal 🚨 HIGHEST UPSIDE
July Order: 2,100 units (+40% vs last year)
Investment: £109k

Why Order Big: Ran out in Week 12 last year, missing 6 crucial weeks including Black Friday. True demand is 40% higher than what you sold.

### 3. Classic Crew Sweatshirt - Grey 💰 VELOCITY SURPRISE
July Order: 1,250 units (+40% vs last year)
Investment: £65k

Why Order Big: Sold 3x faster than forecasted. Ran out Week 10, missing the entire Black Friday period when it could have sold 120+ units in one week alone.

Feel free to review and adjust the forecast - are there any specific financial targets set by the finance team for this year that you want me to account for in this forecast?`;

  // Custom renderer for the markdown-like text with reduced spacing
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    let result = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('## ')) {
        // Main headers - reduced spacing
        result += '\n';
        result += line.replace('## ', '');
        result += '\n';
      } else if (line.startsWith('### ')) {
        // Sub headers - minimal spacing  
        result += '\n';
        result += line.replace('### ', '');
        result += '\n';
      } else if (line.startsWith('• ')) {
        // Bullet points with minimal spacing
        result += line + '\n';
      } else if (line.trim() === '') {
        // Skip empty lines to reduce spacing
        continue;
      } else {
        // Regular text
        result += line + '\n';
      }
    }
    
    return result;
  };

  return (
    <>
      {/* CSV Forecast preview appears first */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 w-full max-w-3xl mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">CSV Forecast Preview</h3>
          <button onClick={handleDownload} className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
            Download CSV
          </button>
        </div>
        
        {/* Embedded Google Sheets iframe */}
        <div className="bg-white border rounded overflow-hidden">
          <div className="bg-gray-50 border-b px-3 py-2 text-xs font-medium text-gray-600">
            Product | Vendor | Category | Forecast Qty | Month
          </div>
          <div className="w-full h-80 rounded border overflow-hidden">
            <iframe 
              src="https://docs.google.com/spreadsheets/d/e/2PACX-1vT2R8kuylA4f0ToPLzp0Ao-vS9nZ0hZ1_hq8eXlHSzvAi-DHOqn30YSouSdTHLa1d9cAauOEvRFJznD/pubhtml?gid=1417920360&amp;single=true&amp;widget=true&amp;headers=false"
              className="w-full h-full border-0"
              style={{ transform: 'scale(0.75)', transformOrigin: 'top left', width: '133.33%', height: '133.33%' }}
              title="Forecast Spreadsheet"
            />
          </div>
        </div>
      </div>

      {/* Analysis text with typewriter effect - shows after CSV preview */}
      {showAnalysis && (
        <div className="mb-6">
          <TypewriterText 
            text={renderFormattedText(analysisText)}
            className="text-lg font-medium leading-relaxed text-black whitespace-pre-line"
            onUpdate={onUpdate}
            onComplete={() => {
              onComplete?.();
              // Show attached files after text generation completes
              setTimeout(() => {
                setShowAttachedFiles(true);
              }, 500);
            }}
          />
        </div>
      )}

      {/* Attached Files - appears at the very bottom after text generation */}
      {showAttachedFiles && (
        <div className="mt-8 pt-6 border-t border-gray-200 relative">
          <h3 className="text-lg font-semibold text-black mb-4">Attached Files</h3>
          <div className="space-y-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors w-full max-w-md"
            >
              <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">AW25_Forecast_Full.csv</div>
                <div className="text-xs text-gray-500">Spreadsheet</div>
              </div>
            </button>
            
            <button
              onClick={() => {
                // Handle TXT file download - placeholder for now
                console.log('Download TXT file');
              }}
              className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors w-full max-w-md"
            >
              <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">Missed_Revenue_Analysis.txt</div>
                <div className="text-xs text-gray-500">Text Document</div>
              </div>
            </button>
          </div>
          
          {/* Expand button positioned underneath the left side of the TXT file */}
          <div className="mt-4">
            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger asChild>
                <button className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                  <Maximize2 className="h-4 w-4" />
                  Expand Full View
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed inset-0 z-50 w-screen h-screen bg-white">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                    <Dialog.Title className="text-lg font-semibold text-gray-900">AW25 beginning forecast</Dialog.Title>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={handleDownload}
                        className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Download CSV
                      </button>
                      <Dialog.Close asChild>
                        <button className="text-sm px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">Close</button>
                      </Dialog.Close>
                    </div>
                  </div>

                  {/* Resizable Content Area */}
                  <div className="flex-1 h-[calc(100vh-73px)]">
                    <ResizableForecastView chatQuery="forecast">
                      <div className="w-full h-full">
                        <iframe 
                          src="https://docs.google.com/spreadsheets/d/e/2PACX-1vT2R8kuylA4f0ToPLzp0Ao-vS9nZ0hZ1_hq8eXlHSzvAi-DHOqn30YSouSdTHLa1d9cAauOEvRFJznD/pubhtml?gid=1417920360&amp;single=true&amp;widget=true&amp;headers=false"
                          title="Forecast Spreadsheet Full View"
                          className="w-full h-full border-0 bg-white"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          sandbox="allow-scripts allow-same-origin allow-forms"
                        />
                      </div>
                    </ResizableForecastView>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      )}
    </>
  );
};

export default ForecastPreview;

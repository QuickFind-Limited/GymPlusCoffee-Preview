/**
 * Forecast Service - AI Forecasting Backend Integration
 * 
 * BACKEND INTEGRATION NOTES FOR YOAN'S AI:
 * 
 * This service provides forecast data generation and processing for the forecast flow:
 * 
 * 1. FORECAST GENERATION SERVICE:
 *    - getForecastPreview() currently returns mock data structured for retail forecasting
 *    - Replace with real AI forecasting service that processes user queries
 *    - Should integrate with machine learning models for demand prediction
 *    - Query parameter can influence forecast context (product categories, timeframes, etc.)
 * 
 * 2. REAL AI FORECASTING INTEGRATION:
 *    - Connect to your forecasting ML models (seasonal trends, demand patterns, etc.)
 *    - Process historical sales data, inventory levels, and market trends
 *    - Generate structured forecasts with confidence intervals and assumptions
 *    - Support various forecast types: demand, inventory, revenue, etc.
 * 
 * 3. DATA STRUCTURE REQUIREMENTS:
 *    - Component expects ForecastData with: {title, columns, rows, generatedAt}
 *    - Rows should include all relevant forecast dimensions (item, vendor, category, etc.)
 *    - Extensible structure for additional forecast fields and metadata
 *    - Ready for pagination and streaming of large forecast datasets
 * 
 * 4. BACKEND INTEGRATION EXAMPLE:
 *    ```
 *    export async function getForecastPreview(query?: string): Promise<ForecastData> {
 *      const forecastRequest = {
 *        prompt: query,
 *        forecast_type: 'demand_planning',
 *        time_horizon: '6_months',
 *        data_sources: ['sales_history', 'inventory_levels', 'market_trends']
 *      };
 *      
 *      const response = await yourForecastingAI.generateForecast(forecastRequest);
 *      
 *      return {
 *        title: response.forecast_title,
 *        columns: response.column_definitions,
 *        rows: response.forecast_predictions,
 *        generatedAt: response.timestamp
 *      };
 *    }
 *    ```
 * 
 * 5. CSV EXPORT OPTIMIZATION:
 *    - toCSV() function handles proper escaping for complex forecast data
 *    - Ready for large datasets and special characters in product names
 *    - Extensible for additional export formats (Excel, JSON, etc.)
 */

import { ForecastData, ForecastRow } from './forecastTypes';

// Backend Integration Point: Replace mock with real AI forecasting service call.
// expects: query string that may influence forecasting context (category, timeframe, etc.)
// returns: Promise<ForecastData> shaped as defined in forecastTypes.ts
export async function getForecastPreview(query?: string): Promise<ForecastData> {
  // Simulate AI processing time - replace with real forecasting API call
  await new Promise((r) => setTimeout(r, 300));

  // Mock data representing a realistic retail buying forecast like ChatGPT example
  const rows: ForecastRow[] = [
    { id: 0, item: 'ENSURE COMPACT VANILLA 125ML', vendor: '', category: 'MEDICAL NUTRITION', month: 'Aug 2025', forecastQty: 960, unit: 'units' },
    { id: 1, item: 'FORTISIP COMPACT PROTEIN STR/BERRY 125ML', vendor: '', category: 'MEDICAL NUTRITION', month: 'Aug 2025', forecastQty: 840, unit: 'units' },
    { id: 2, item: 'FORTISIP COMPACT PROTEIN VANILLA 125ML', vendor: '', category: 'MEDICAL NUTRITION', month: 'Aug 2025', forecastQty: 820, unit: 'units' },
    { id: 3, item: 'GLUCOSE SHOT 50ML', vendor: '', category: 'MEDICAL NUTRITION', month: 'Aug 2025', forecastQty: 420, unit: 'units' },
    { id: 4, item: 'PROTEIN BAR CHOCOLATE 50G', vendor: 'HEALTHLAB', category: 'SNACKS', month: 'Aug 2025', forecastQty: 1200, unit: 'units' },
    { id: 5, item: 'PROTEIN BAR PEANUT BUTTER 50G', vendor: 'HEALTHLAB', category: 'SNACKS', month: 'Aug 2025', forecastQty: 1100, unit: 'units' },
    { id: 6, item: 'ENERGY GEL ORANGE 60ML', vendor: 'ENDURA SPORTS', category: 'SPORTS NUTRITION', month: 'Aug 2025', forecastQty: 640, unit: 'units' },
    { id: 7, item: 'ENERGY GEL BERRY BLAST 60ML', vendor: 'ENDURA SPORTS', category: 'SPORTS NUTRITION', month: 'Aug 2025', forecastQty: 600, unit: 'units' },
    { id: 8, item: 'ELECTROLYTE DRINK LEMON 500ML', vendor: 'AQUA PRO', category: 'BEVERAGES', month: 'Aug 2025', forecastQty: 1500, unit: 'bottles' },
    { id: 9, item: 'RECOVERY SHAKE VANILLA 330ML', vendor: 'AQUA PRO', category: 'BEVERAGES', month: 'Aug 2025', forecastQty: 700, unit: 'bottles' },
    { id: 10, item: 'WHEY PROTEIN POWDER 1KG', vendor: 'FITNESS FIRST', category: 'SUPPLEMENTS', month: 'Aug 2025', forecastQty: 450, unit: 'containers' },
    { id: 11, item: 'CREATINE MONOHYDRATE 500G', vendor: 'FITNESS FIRST', category: 'SUPPLEMENTS', month: 'Aug 2025', forecastQty: 320, unit: 'containers' },
    { id: 12, item: 'MULTIVITAMIN TABLETS 60CT', vendor: 'VITA HEALTH', category: 'VITAMINS', month: 'Aug 2025', forecastQty: 890, unit: 'bottles' },
    { id: 13, item: 'OMEGA-3 FISH OIL 1000MG 100CT', vendor: 'VITA HEALTH', category: 'VITAMINS', month: 'Aug 2025', forecastQty: 650, unit: 'bottles' },
    { id: 14, item: 'RESISTANCE BANDS SET', vendor: 'GYM EQUIPMENT CO', category: 'FITNESS EQUIPMENT', month: 'Aug 2025', forecastQty: 180, unit: 'sets' },
  ];

  const data: ForecastData = {
    title: 'Retail Buying Forecast — Clean Table (Aug 2025)',
    columns: [
      { key: 'id', label: '#' },
      { key: 'item', label: 'item' },
      { key: 'vendor', label: 'vendor' },
      { key: 'category', label: 'category' },
      { key: 'month', label: 'month' },
      { key: 'forecastQty', label: 'forecast qty' },
      { key: 'unit', label: 'unit' },
    ],
    rows,
    generatedAt: new Date().toISOString(),
  };

  return data;
}

// Utility to export CSV from the preview data (for quick download)
export function toCSV(data: ForecastData): string {
  const headers = data.columns.map((c) => c.label).join(',');
  const rows = data.rows
    .map((r) => [r.id, r.item, r.vendor, r.category, r.month, r.forecastQty, r.unit]
      .map((v) => typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : String(v))
      .join(','))
    .join('\n');
  return `${headers}\n${rows}`;
}

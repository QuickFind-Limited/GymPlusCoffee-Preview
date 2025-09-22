// Types for Forecast preview data used in the chat UI
// Backend Integration Point: Replace these types if your backend provides a different schema
// The goal is to make our data contracts explicit for easy wiring by Yoan's backend.

export interface ForecastRow {
  id: number; // row index in original CSV
  item: string;
  vendor: string;
  category: string;
  month: string; // e.g., "Aug 2025"
  forecastQty: number; // numeric quantity forecast
  unit: string; // e.g., "units", "cases"
}

export interface ForecastData {
  title: string; // e.g., "Retail Buying Forecast — Clean Table (Aug 2025)"
  columns: { key: keyof ForecastRow | string; label: string }[];
  rows: ForecastRow[];
  generatedAt: string; // ISO timestamp of preview generation
}

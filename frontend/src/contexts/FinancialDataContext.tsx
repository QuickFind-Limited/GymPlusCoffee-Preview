
import React, { createContext, useContext, useState } from 'react';

// Financial data types
interface MonthlySpendData {
  name: string;
  spend: number;
  revenue: number;
}

interface CategorySpendData {
  name: string;
  value: number;
}

interface SupplierData {
  id: number;
  name: string;
  spend: string;
  revenue: string;
  orders: number;
  margin: string;
  avgDelivery: string;
}

interface FinancialDataContextType {
  monthlySpendData: MonthlySpendData[];
  categorySpendData: CategorySpendData[];
  categoryByMonthData: { month: string; [key: string]: string | number }[];
  categoryRevenueByMonthData: { month: string; [key: string]: string | number }[];
  topSuppliers: SupplierData[];
  lowestSuppliers: SupplierData[];
  currentMonthStats: {
    spend: number;
    revenue: number;
    margin: number;
    change: {
      spend: number;
      revenue: number;
      margin: number;
    };
  };
}

// Updated financial data with 12 months (Apr 2024 - Mar 2025)
const defaultFinancialData: FinancialDataContextType = {
  monthlySpendData: [
    { name: 'Apr 2024', spend: 182500, revenue: 297400 },
    { name: 'May 2024', spend: 190700, revenue: 310800 },
    { name: 'Jun 2024', spend: 198300, revenue: 323200 },
    { name: 'Jul 2024', spend: 204600, revenue: 333500 },
    { name: 'Aug 2024', spend: 209400, revenue: 341300 },
    { name: 'Sep 2024', spend: 215800, revenue: 351800 },
    { name: 'Oct 2024', spend: 212400, revenue: 346000 },
    { name: 'Nov 2024', spend: 236800, revenue: 385800 },
    { name: 'Dec 2024', spend: 427900, revenue: 697000 }, // Massive spike in December
    { name: 'Jan 2025', spend: 188600, revenue: 307300 },
    { name: 'Feb 2025', spend: 217300, revenue: 354000 },
    { name: 'Mar 2025', spend: 243500, revenue: 396700 },
  ],
  categorySpendData: [
    { name: 'Womens Apparel', value: 982800 },
    { name: 'Mens Apparel', value: 672400 },
    { name: 'Accessories', value: 428500 },
    { name: 'Footwear', value: 478000 },
    { name: 'Sustainable', value: 167300 },
  ],
  categoryByMonthData: [
    { month: 'Oct 2024', 'Womens Apparel': 84900, 'Mens Apparel': 51000, 'Accessories': 31800, 'Footwear': 35100, 'Sustainable': 9600, 'total': 212400 },
    { month: 'Nov 2024', 'Womens Apparel': 94700, 'Mens Apparel': 59200, 'Accessories': 35500, 'Footwear': 37900, 'Sustainable': 9500, 'total': 236800 },
    { month: 'Dec 2024', 'Womens Apparel': 171100, 'Mens Apparel': 106900, 'Accessories': 64100, 'Footwear': 68400, 'Sustainable': 17400, 'total': 427900 }, // Spike in December
    { month: 'Jan 2025', 'Womens Apparel': 75400, 'Mens Apparel': 47100, 'Accessories': 28300, 'Footwear': 30100, 'Sustainable': 7700, 'total': 188600 },
    { month: 'Feb 2025', 'Womens Apparel': 86900, 'Mens Apparel': 54300, 'Accessories': 32600, 'Footwear': 34700, 'Sustainable': 8800, 'total': 217300 },
    { month: 'Mar 2025', 'Womens Apparel': 97400, 'Mens Apparel': 60800, 'Accessories': 36500, 'Footwear': 38900, 'Sustainable': 9900, 'total': 243500 },
  ],
  // New data with higher revenue values than would be calculated from spend using the 38% margin
  categoryRevenueByMonthData: [
    { month: 'Oct 2024', 'Womens Apparel': 152820, 'Mens Apparel': 91800, 'Accessories': 57240, 'Footwear': 66690, 'Sustainable': 17280, 'total': 385830 },
    { month: 'Nov 2024', 'Womens Apparel': 170460, 'Mens Apparel': 106560, 'Accessories': 63900, 'Footwear': 72010, 'Sustainable': 17100, 'total': 430030 },
    { month: 'Dec 2024', 'Womens Apparel': 307980, 'Mens Apparel': 192420, 'Accessories': 115380, 'Footwear': 129960, 'Sustainable': 31320, 'total': 777060 }, // Spike in December
    { month: 'Jan 2025', 'Womens Apparel': 135720, 'Mens Apparel': 84780, 'Accessories': 50940, 'Footwear': 57190, 'Sustainable': 13860, 'total': 342490 },
    { month: 'Feb 2025', 'Womens Apparel': 156420, 'Mens Apparel': 97740, 'Accessories': 58680, 'Footwear': 65930, 'Sustainable': 15840, 'total': 394610 },
    { month: 'Mar 2025', 'Womens Apparel': 175320, 'Mens Apparel': 109440, 'Accessories': 65700, 'Footwear': 74010, 'Sustainable': 17820, 'total': 442290 },
  ],
  topSuppliers: [
    { id: 1, name: 'Artisan Threads Ltd', spend: '£584,320', revenue: '£952,100', orders: 42, margin: '38.6%', avgDelivery: '2.3 days' },
    { id: 2, name: 'Vintage Fabrics Co.', spend: '£439,600', revenue: '£716,100', orders: 38, margin: '38.6%', avgDelivery: '3.1 days' },
    { id: 3, name: 'Eco Textile Imports', spend: '£356,800', revenue: '£581,100', orders: 24, margin: '38.6%', avgDelivery: '5.2 days' },
    { id: 4, name: 'Boutique Accessories Inc', spend: '£295,300', revenue: '£480,900', orders: 31, margin: '38.6%', avgDelivery: '2.8 days' },
    { id: 5, name: 'Sustainable Materials', spend: '£244,800', revenue: '£398,700', orders: 26, margin: '38.6%', avgDelivery: '3.5 days' },
  ],
  lowestSuppliers: [
    { id: 1, name: 'Urban Style Fabrics', spend: '£42,450', revenue: '£69,100', orders: 5, margin: '38.6%', avgDelivery: '6.8 days' },
    { id: 2, name: 'Eastern Textile Co.', spend: '£54,780', revenue: '£89,200', orders: 7, margin: '38.6%', avgDelivery: '5.7 days' },
    { id: 3, name: 'Global Craft Imports', spend: '£68,240', revenue: '£111,100', orders: 9, margin: '38.6%', avgDelivery: '7.2 days' },
    { id: 4, name: 'Fashion Forward Inc', spend: '£81,350', revenue: '£132,400', orders: 12, margin: '38.6%', avgDelivery: '4.5 days' },
    { id: 5, name: 'Essentials Supply Co.', spend: '£94,650', revenue: '£154,100', orders: 14, margin: '38.6%', avgDelivery: '5.1 days' },
  ],
  currentMonthStats: {
    spend: 243500,
    revenue: 396700,
    margin: 38.6,  // Updated margin to 38.6%
    change: {
      spend: 12.1,  // percentage increase from previous month
      revenue: 12.1, // Keeping consistent with spend change
      margin: 0,
    }
  }
};

// Create context
const FinancialDataContext = createContext<FinancialDataContextType>(defaultFinancialData);

// Provider component
export const FinancialDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [financialData] = useState<FinancialDataContextType>(defaultFinancialData);
  
  return (
    <FinancialDataContext.Provider value={financialData}>
      {children}
    </FinancialDataContext.Provider>
  );
};

// Hook for easy access to financial data
export const useFinancialData = () => useContext(FinancialDataContext);


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface InventoryTrendsData {
  month: string;
  stock: number;
  reorder: number;
  backorder: number;
}

interface InventoryInsightsTabProps {
  inventoryTrendsData: InventoryTrendsData[];
}

const InventoryInsightsTab = ({ inventoryTrendsData }: InventoryInsightsTabProps) => {
  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Inventory Levels vs. Reorder Point</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={inventoryTrendsData}
              margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis width={60} />
              <Tooltip />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <Area type="monotone" dataKey="stock" name="Current Stock" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              <Area type="monotone" dataKey="reorder" name="Reorder Point" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
              <Area type="monotone" dataKey="backorder" name="Backorder Quantity" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Stock Turnover Rate (times/year)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { category: 'Womens Apparel', rate: 8.5 },
                  { category: 'Mens Apparel', rate: 12.2 },
                  { category: 'Accessories', rate: 9.8 },
                  { category: 'Footwear', rate: 7.3 },
                  { category: 'Sustainable', rate: 5.9 },
                ]}
                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" />
                <YAxis width={50} />
                <Tooltip formatter={(value) => `${value} times/year`} />
                <Line type="monotone" dataKey="rate" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Out of Stock Frequency</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { month: 'Jan', count: 3 },
                  { month: 'Feb', count: 2 },
                  { month: 'Mar', count: 0 },
                  { month: 'Apr', count: 1 },
                  { month: 'May', count: 4 },
                  { month: 'Jun', count: 5 },
                  { month: 'Jul', count: 2 },
                  { month: 'Aug', count: 1 },
                ]}
                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis width={40} />
                <Tooltip />
                <Bar dataKey="count" fill="#ffc658" name="Stockout Events" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InventoryInsightsTab;

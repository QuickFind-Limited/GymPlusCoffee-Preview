
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SupplierData {
  id: number;
  name: string;
  spend: string;
  revenue: string;
  orders: number;
  margin: string;
  avgDelivery: string;
}

interface OverviewTabProps {
  monthlySpendData: { name: string; spend: number; revenue: number }[];
  categorySpendData: { name: string; value: number }[];
  categoryByMonthData: { month: string; [key: string]: string | number }[];
  categoryRevenueByMonthData: { month: string; [key: string]: string | number }[];
  topSuppliers: SupplierData[];
  lowestSuppliers: SupplierData[];
}

const OverviewTab = ({ 
  monthlySpendData, 
  categorySpendData, 
  categoryByMonthData, 
  categoryRevenueByMonthData,
  topSuppliers, 
  lowestSuppliers 
}: OverviewTabProps) => {
  const COLORS = ['#8884d8', '#82ca9d', '#FFBB28', '#FF8042', '#0088FE'];

  return (
    <div className="space-y-4">
      {/* Monthly Revenue vs Spend Chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Monthly Revenue vs Spend</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={monthlySpendData}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={50} 
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                tickFormatter={(value) => `£${value/1000}k`}
                width={80}
                tick={{ fontSize: 11 }}
              />
              <Tooltip 
                formatter={(value) => `£${value.toLocaleString()}`}
                labelFormatter={(label) => `Month: ${label}`}
                cursor={{ fillOpacity: 0.2 }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Bar dataKey="spend" name="Spend" fill="#8884d8" />
              <Bar dataKey="revenue" name="Revenue" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Monthly Spend and Revenue by Category Charts - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monthly Spend by Category Chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Monthly Spend by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={categoryByMonthData}
                margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => `£${value/1000}k`}
                  width={70}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => `£${value.toLocaleString()}`}
                />
                <Legend 
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  margin={{ top: 10 }}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="Womens Apparel" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Mens Apparel" stroke="#82ca9d" />
                <Line type="monotone" dataKey="Accessories" stroke="#ffc658" />
                <Line type="monotone" dataKey="Footwear" stroke="#ff8042" />
                <Line type="monotone" dataKey="Sustainable" stroke="#0088fe" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Revenue by Category Chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Monthly Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={categoryRevenueByMonthData}
                margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => `£${value/1000}k`}
                  width={70}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => `£${value.toLocaleString()}`}
                />
                <Legend 
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  margin={{ top: 10 }}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="Womens Apparel" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Mens Apparel" stroke="#82ca9d" />
                <Line type="monotone" dataKey="Accessories" stroke="#ffc658" />
                <Line type="monotone" dataKey="Footwear" stroke="#ff8042" />
                <Line type="monotone" dataKey="Sustainable" stroke="#0088fe" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewTab;

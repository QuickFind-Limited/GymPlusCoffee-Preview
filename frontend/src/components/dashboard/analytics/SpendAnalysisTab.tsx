import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

const SpendAnalysisTab = () => {
  const yearlyComparisonData = [
    { month: 'Apr 2023', 'current': 35000, 'previous': 29500 },
    { month: 'May 2023', 'current': 28000, 'previous': 24800 },
    { month: 'Jun 2023', 'current': 32000, 'previous': 27200 },
    { month: 'Jul 2023', 'current': 30780, 'previous': 25500 },
    { month: 'Aug 2023', 'current': 41890, 'previous': 36100 },
    { month: 'Sep 2023', 'current': 38390, 'previous': 33000 },
    { month: 'Oct 2023', 'current': 43200, 'previous': 37500 },
    { month: 'Nov 2023', 'current': 56800, 'previous': 39800 },
    { month: 'Dec 2023', 'current': 47300, 'previous': 42500 },
    { month: 'Jan 2024', 'current': 51200, 'previous': 34200 },
    { month: 'Feb 2024', 'current': 78500, 'previous': 36900 },
    { month: 'Mar 2024', 'current': 92800, 'previous': 45100 },
  ];

  // Consistent with data in FinancialDataContext.tsx
  const categoryByMonthData = [
    { month: 'Oct 2023', 'Womens Apparel': 16500, 'Mens Apparel': 10800, 'Accessories': 6500, 'Footwear': 7200, 'Sustainable': 2200, 'total': 43200 },
    { month: 'Nov 2023', 'Womens Apparel': 22300, 'Mens Apparel': 13500, 'Accessories': 8000, 'Footwear': 9300, 'Sustainable': 3700, 'total': 56800 },
    { month: 'Dec 2023', 'Womens Apparel': 18500, 'Mens Apparel': 12000, 'Accessories': 6800, 'Footwear': 7500, 'Sustainable': 2500, 'total': 47300 },
    { month: 'Jan 2024', 'Womens Apparel': 20500, 'Mens Apparel': 13000, 'Accessories': 7000, 'Footwear': 8000, 'Sustainable': 2700, 'total': 51200 },
    { month: 'Feb 2024', 'Womens Apparel': 31000, 'Mens Apparel': 20000, 'Accessories': 11500, 'Footwear': 12000, 'Sustainable': 4000, 'total': 78500 },
    { month: 'Mar 2024', 'Womens Apparel': 37000, 'Mens Apparel': 23000, 'Accessories': 13800, 'Footwear': 14000, 'Sustainable': 5000, 'total': 92800 },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Year-over-Year Spend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ChartContainer config={{}}>
              <BarChart 
                data={yearlyComparisonData}
                margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => `£${value/1000}k`}
                  width={80}
                />
                <Tooltip
                  formatter={(value) => `£${value.toLocaleString()}`}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: 10, marginLeft: 20 }}
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  className="flex gap-6 justify-center mt-4"
                />
                <Bar dataKey="current" name="This Year" fill="#8884d8" />
                <Bar dataKey="previous" name="Last Year" fill="#82ca9d" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Spend by Category by Month (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ChartContainer config={{}}>
              <LineChart
                data={categoryByMonthData}
                margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => `£${value/1000}k`}
                  width={70}
                />
                <Tooltip
                  formatter={(value) => `£${value.toLocaleString()}`}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: 10, marginLeft: 20 }}
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  className="flex gap-6 justify-center mt-4"
                />
                <Line type="monotone" dataKey="Womens Apparel" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Mens Apparel" stroke="#82ca9d" />
                <Line type="monotone" dataKey="Accessories" stroke="#ffc658" />
                <Line type="monotone" dataKey="Footwear" stroke="#ff8042" />
                <Line type="monotone" dataKey="Sustainable" stroke="#0088fe" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SpendAnalysisTab;

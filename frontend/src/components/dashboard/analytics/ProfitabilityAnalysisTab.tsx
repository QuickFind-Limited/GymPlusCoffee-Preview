import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const categoryProfitByMonthData = [
  { month: 'Oct 2024', 'Womens Apparel': 38, 'Mens Apparel': 36, 'Accessories': 30, 'Footwear': 26, 'Sustainable': 28 },
  { month: 'Nov 2024', 'Womens Apparel': 42, 'Mens Apparel': 32, 'Accessories': 33, 'Footwear': 24, 'Sustainable': 30 },
  { month: 'Dec 2024', 'Womens Apparel': 35, 'Mens Apparel': 39, 'Accessories': 28, 'Footwear': 34, 'Sustainable': 25 },
  { month: 'Jan 2025', 'Womens Apparel': 37, 'Mens Apparel': 38, 'Accessories': 31, 'Footwear': 30, 'Sustainable': 29 },
  { month: 'Feb 2025', 'Womens Apparel': 39, 'Mens Apparel': 37, 'Accessories': 31, 'Footwear': 27, 'Sustainable': 32 },
  { month: 'Mar 2025', 'Womens Apparel': 42, 'Mens Apparel': 40, 'Accessories': 33, 'Footwear': 29, 'Sustainable': 31 },
];

const productProfitabilityData = [
  {
    id: 1,
    name: "Floral Back Tie Tiered Mini Dress",
    category: "Womens Apparel",
    revenue: 56000,
    cost: 32480,
    profit: 23520,
    margin: 42,
    sales: 5000
  },
  {
    id: 2,
    name: "Pearl Circle Pendant Jewelry Set",
    category: "Accessories",
    revenue: 48500,
    cost: 29100,
    profit: 19400,
    margin: 40,
    sales: 2620
  },
  {
    id: 3,
    name: "Round Mirror in Gilded Brass",
    category: "Home Decor",
    revenue: 43900,
    cost: 26780,
    profit: 17120,
    margin: 39,
    sales: 1630
  },
  {
    id: 4,
    name: "Organic Solid Hazelnut Oil Cream",
    category: "Beauty",
    revenue: 38700,
    cost: 24590,
    profit: 14110,
    margin: 36,
    sales: 2980
  },
  {
    id: 5,
    name: "Crossover Hemp Chelsea Boot",
    category: "Footwear",
    revenue: 35600,
    cost: 23140,
    profit: 12460,
    margin: 35,
    sales: 524
  },
  {
    id: 6,
    name: "Hauck Spätburgunder Reserve",
    category: "Food & Drink",
    revenue: 32800,
    cost: 21320,
    profit: 11480,
    margin: 35,
    sales: 1312
  },
  {
    id: 7,
    name: "Cotton Oxford Shirt",
    category: "Mens Apparel",
    revenue: 28400,
    cost: 18460,
    profit: 9940,
    margin: 35,
    sales: 1890
  },
  {
    id: 8,
    name: "Handmade Ceramic Coffee Mug",
    category: "Home Decor",
    revenue: 25100,
    cost: 16315,
    profit: 8785,
    margin: 35,
    sales: 2510
  }
];

const ProfitabilityAnalysisTab = () => {
  const COLORS = ['#9b87f5', '#7E69AB', '#6E59A5', '#82ca9d', '#ffc658'];

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Gross Margin by Category (%)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Note margin fluctuations in November and December 2024
          </p>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={categoryProfitByMonthData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={[20, 45]} 
                tickFormatter={(value) => `${value}%`} 
                tick={{ fontSize: 12 }}
              />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Line 
                type="monotone" 
                dataKey="Womens Apparel" 
                stroke="#9b87f5" 
                strokeWidth={2}
                activeDot={{ r: 8 }} 
              />
              <Line 
                type="monotone" 
                dataKey="Mens Apparel" 
                stroke="#7E69AB" 
                strokeWidth={2}
                activeDot={{ r: 8 }} 
              />
              <Line 
                type="monotone" 
                dataKey="Accessories" 
                stroke="#6E59A5" 
                strokeWidth={2}
                activeDot={{ r: 8 }} 
              />
              <Line 
                type="monotone" 
                dataKey="Footwear" 
                stroke="#82ca9d" 
                strokeWidth={2}
                activeDot={{ r: 8 }} 
              />
              <Line 
                type="monotone" 
                dataKey="Sustainable" 
                stroke="#ffc658" 
                strokeWidth={2}
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Product Profitability Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Margin %</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productProfitabilityData.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="text-right">£{product.revenue.toLocaleString()}</TableCell>
                  <TableCell className="text-right">£{product.cost.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium text-green-600">£{product.profit.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{product.margin}%</TableCell>
                  <TableCell className="text-right">{product.sales.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitabilityAnalysisTab;

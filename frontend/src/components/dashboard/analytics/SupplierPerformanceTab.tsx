
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface SupplierPerformanceData {
  name: string;
  onTime: number;
  quality: number;
  price: number;
  lateDelivery: number;
  qualityIssues: number;
  incompleteOrders: number;
  incorrectItems: number;
  damagedGoods: number;
  threeWayMatch: number;
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

interface SupplierPerformanceTabProps {
  supplierPerformanceData: SupplierPerformanceData[];
  topSuppliers: SupplierData[];
  lowestSuppliers: SupplierData[];
}

const SupplierPerformanceTab = ({ supplierPerformanceData, topSuppliers, lowestSuppliers }: SupplierPerformanceTabProps) => {
  const getPerformanceBadge = (score: number) => {
    if (score >= 90) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 80) return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Good</Badge>;
    if (score >= 70) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Average</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  const chartData = [
    { category: "Womens Apparel", spend: 98000 },
    { category: "Mens Apparel", spend: 65000 },
    { category: "Accessories", spend: 38000 },
    { category: "Footwear", spend: 40000 },
    { category: "Sustainable", spend: 12000 }
  ];

  const chartConfig = {
    spend: {
      label: "Spend",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Supplier Spend by Category</CardTitle>
            <CardDescription>Total spend across different product categories</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="category" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `£${value/1000}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="spend" fill="var(--color-spend)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supplier Performance Overview</CardTitle>
            <CardDescription>Key performance metrics for top suppliers</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>On-Time %</TableHead>
                  <TableHead>Quality %</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplierPerformanceData.map((supplier, index) => (
                  <TableRow key={`performance-${supplier.name}-${index}`}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.onTime}%</TableCell>
                    <TableCell>{supplier.quality}%</TableCell>
                    <TableCell>{getPerformanceBadge((supplier.onTime + supplier.quality) / 2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Suppliers</CardTitle>
            <CardDescription>Suppliers with highest spend and orders</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Spend</TableHead>
                  <TableHead>Avg Delivery</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSuppliers.map((supplier, index) => (
                  <TableRow key={`top-${supplier.name}-${index}`}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.orders}</TableCell>
                    <TableCell>{supplier.spend}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="text-green-500">✓</span>
                        <span className="ml-1">{supplier.avgDelivery}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suppliers Requiring Attention</CardTitle>
            <CardDescription>Suppliers with lower performance scores</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Avg Delivery</TableHead>
                  <TableHead>Action Needed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowestSuppliers.map((supplier, index) => (
                  <TableRow key={`lowest-${supplier.name}-${index}`}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.orders}</TableCell>
                    <TableCell>{supplier.avgDelivery}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        Review Required
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupplierPerformanceTab;

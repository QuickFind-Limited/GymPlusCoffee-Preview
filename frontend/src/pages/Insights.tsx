import React from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from '@/components/dashboard/AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OverviewTab from '@/components/dashboard/analytics/OverviewTab';
import SpendAnalysisTab from '@/components/dashboard/analytics/SpendAnalysisTab';
import SupplierPerformanceTab from '@/components/dashboard/analytics/SupplierPerformanceTab';
import InventoryInsightsTab from '@/components/dashboard/analytics/InventoryInsightsTab';
import ProfitabilityAnalysisTab from '@/components/dashboard/analytics/ProfitabilityAnalysisTab';

const Insights = () => {
  const { signOut } = useAuth();

  // Sample data for analytics components
  const monthlySpendData = [
    { name: 'Jan', spend: 45000, revenue: 120000 },
    { name: 'Feb', spend: 52000, revenue: 135000 },
    { name: 'Mar', spend: 48000, revenue: 128000 },
    { name: 'Apr', spend: 58000, revenue: 152000 },
    { name: 'May', spend: 61000, revenue: 164000 },
    { name: 'Jun', spend: 55000, revenue: 148000 },
  ];

  const categorySpendData = [
    { name: 'Office Supplies', value: 35000 },
    { name: 'Technology', value: 28000 },
    { name: 'Furniture', value: 22000 },
    { name: 'Catering', value: 15000 },
  ];

  const categoryByMonthData = [
    { month: 'Jan', 'Office Supplies': 12000, 'Technology': 8000, 'Furniture': 15000, 'Catering': 10000 },
    { month: 'Feb', 'Office Supplies': 14000, 'Technology': 12000, 'Furniture': 16000, 'Catering': 10000 },
    { month: 'Mar', 'Office Supplies': 13000, 'Technology': 10000, 'Furniture': 15000, 'Catering': 10000 },
    { month: 'Apr', 'Office Supplies': 16000, 'Technology': 14000, 'Furniture': 18000, 'Catering': 10000 },
    { month: 'May', 'Office Supplies': 17000, 'Technology': 15000, 'Furniture': 19000, 'Catering': 10000 },
    { month: 'Jun', 'Office Supplies': 15000, 'Technology': 13000, 'Furniture': 17000, 'Catering': 10000 },
  ];

  const categoryRevenueByMonthData = [
    { month: 'Jan', 'Office Supplies': 32000, 'Technology': 28000, 'Furniture': 35000, 'Catering': 25000 },
    { month: 'Feb', 'Office Supplies': 38000, 'Technology': 32000, 'Furniture': 40000, 'Catering': 25000 },
    { month: 'Mar', 'Office Supplies': 35000, 'Technology': 30000, 'Furniture': 38000, 'Catering': 25000 },
    { month: 'Apr', 'Office Supplies': 42000, 'Technology': 38000, 'Furniture': 47000, 'Catering': 25000 },
    { month: 'May', 'Office Supplies': 44000, 'Technology': 40000, 'Furniture': 50000, 'Catering': 30000 },
    { month: 'Jun', 'Office Supplies': 40000, 'Technology': 36000, 'Furniture': 45000, 'Catering': 27000 },
  ];

  const topSuppliers = [
    { id: 1, name: 'Office Depot', spend: '£45,000', revenue: '£120,000', orders: 85, margin: '62%', avgDelivery: '2.3 days' },
    { id: 2, name: 'TechSolutions', spend: '£38,000', revenue: '£95,000', orders: 67, margin: '58%', avgDelivery: '3.1 days' },
    { id: 3, name: 'FurniturePlus', spend: '£32,000', revenue: '£85,000', orders: 45, margin: '65%', avgDelivery: '4.2 days' },
  ];

  const lowestSuppliers = [
    { id: 4, name: 'QuickSupply', spend: '£15,000', revenue: '£35,000', orders: 25, margin: '42%', avgDelivery: '6.5 days' },
    { id: 5, name: 'BudgetOffice', spend: '£12,000', revenue: '£28,000', orders: 18, margin: '38%', avgDelivery: '7.2 days' },
  ];

  const supplierPerformanceData = [
    { name: 'Office Depot', onTime: 95, quality: 92, price: 88, lateDelivery: 5, qualityIssues: 8, incompleteOrders: 2, incorrectItems: 3, damagedGoods: 1, threeWayMatch: 98 },
    { name: 'TechSolutions', onTime: 88, quality: 95, price: 85, lateDelivery: 12, qualityIssues: 5, incompleteOrders: 4, incorrectItems: 2, damagedGoods: 2, threeWayMatch: 94 },
    { name: 'FurniturePlus', onTime: 92, quality: 89, price: 90, lateDelivery: 8, qualityIssues: 11, incompleteOrders: 3, incorrectItems: 4, damagedGoods: 1, threeWayMatch: 96 },
  ];

  const inventoryTrendsData = [
    { month: 'Jan', stock: 850, reorder: 300, backorder: 25 },
    { month: 'Feb', stock: 720, reorder: 300, backorder: 45 },
    { month: 'Mar', stock: 920, reorder: 300, backorder: 15 },
    { month: 'Apr', stock: 680, reorder: 300, backorder: 65 },
    { month: 'May', stock: 780, reorder: 300, backorder: 35 },
    { month: 'Jun', stock: 890, reorder: 300, backorder: 20 },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar onLogout={signOut} />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight">Insights & Analytics</h1>
              <p className="text-muted-foreground">
                Comprehensive procurement analytics and business intelligence
              </p>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="spend">Spend Analysis</TabsTrigger>
                <TabsTrigger value="suppliers">Supplier Performance</TabsTrigger>
                <TabsTrigger value="inventory">Inventory Insights</TabsTrigger>
                <TabsTrigger value="profitability">Profitability</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <OverviewTab
                  monthlySpendData={monthlySpendData}
                  categorySpendData={categorySpendData}
                  categoryByMonthData={categoryByMonthData}
                  categoryRevenueByMonthData={categoryRevenueByMonthData}
                  topSuppliers={topSuppliers}
                  lowestSuppliers={lowestSuppliers}
                />
              </TabsContent>

              <TabsContent value="spend" className="space-y-6">
                <SpendAnalysisTab />
              </TabsContent>

              <TabsContent value="suppliers" className="space-y-6">
                <SupplierPerformanceTab
                  supplierPerformanceData={supplierPerformanceData}
                  topSuppliers={topSuppliers}
                  lowestSuppliers={lowestSuppliers}
                />
              </TabsContent>

              <TabsContent value="inventory" className="space-y-6">
                <InventoryInsightsTab inventoryTrendsData={inventoryTrendsData} />
              </TabsContent>

              <TabsContent value="profitability" className="space-y-6">
                <ProfitabilityAnalysisTab />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Insights;
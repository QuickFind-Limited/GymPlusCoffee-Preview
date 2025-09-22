import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Package, Calendar, Target, BarChart3 } from 'lucide-react';
interface SalesDataPopoverProps {
  children: React.ReactNode;
}
const SalesDataPopover = ({
  children
}: SalesDataPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Mock sales data for fashion apparel over last 2 weeks
  const salesData = [{
    item: 'Floral Back Tie Tiered Mini Dress',
    sold: 72,
    revenue: '£806.40',
    trend: '+18%',
    stockLevel: 'Low'
  }, {
    item: 'Premium Cotton Throw Blanket',
    sold: 18,
    revenue: '£621.00',
    trend: '+15%',
    stockLevel: 'Low'
  }, {
    item: '2021 Pinot Noir Reserve',
    sold: 48,
    revenue: '£612.00',
    trend: '+25%',
    stockLevel: 'Needs replenishing'
  }, {
    item: 'Crossover Hemp Chelsea Boot',
    sold: 15,
    revenue: '£1,019.25',
    trend: '+12%',
    stockLevel: 'Good'
  }, {
    item: 'Pearl Circle Pendant Jewelry Set',
    sold: 24,
    revenue: '£540.00',
    trend: '+8%',
    stockLevel: 'Good'
  }];

  // Sort sales data: Low stock first, then Needs replenishing, then Good
  const sortedSalesData = salesData.sort((a, b) => {
    const order = {
      'Low': 0,
      'Needs replenishing': 1,
      'Good': 2
    };
    return order[a.stockLevel as keyof typeof order] - order[b.stockLevel as keyof typeof order];
  });
  const totalSold = salesData.reduce((sum, item) => sum + item.sold, 0);
  const handleViewDetailedReport = () => {
    // Opening detailed sales report
    // This would navigate to a detailed report page
  };
  return <>
    <div onClick={() => setIsOpen(true)} className="cursor-pointer">
      {children}
    </div>
    
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-blue-600" />
            Sales Performance – Last 2 Weeks
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {sortedSalesData.map((item, index) => <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex-1 min-w-0">
                <h5 className="font-medium text-gray-900 text-sm mb-1">{item.item}</h5>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{item.sold} units</span>
                  <span className={`font-medium ${item.stockLevel === 'Needs replenishing' ? 'text-red-600' : item.stockLevel === 'Low' ? 'text-orange-600' : 'text-green-600'}`}>
                    {item.stockLevel} stock
                  </span>
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="font-semibold text-gray-900 text-sm">{item.revenue}</p>
                <p className={`text-xs font-medium ${item.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {item.trend}
                </p>
              </div>
            </div>)}
        </div>
        
        <div className="pt-3 space-y-3">
          <Button onClick={handleViewDetailedReport} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Detailed Sales Report
          </Button>
          
          <div className="border-t border-gray-100 pt-3">
            
            <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
              <Target className="h-3 w-3" />
              Data from June 9-22, 2025 • Updated daily at 6:00 AM
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>;
};
export default SalesDataPopover;
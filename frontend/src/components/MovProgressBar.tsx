
import React from 'react';
import { Progress } from "@/components/ui/progress";

interface MovProgressBarProps {
  orderTotal: number;
  movTarget: number;
}

const MovProgressBar = ({ orderTotal, movTarget }: MovProgressBarProps) => {
  const progress = Math.min((orderTotal / movTarget) * 100, 100);
  const isComplete = orderTotal >= movTarget;
  
  // Format the order total with comma separator
  const formattedOrderTotal = orderTotal.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  
  return (
    <div className="flex items-center">
      <span className="text-sm font-medium mr-3">Order Total: ${formattedOrderTotal}</span>
      <div className="w-32">
        <Progress 
          value={progress} 
          className="h-2 bg-[#FDE1D3]"
          indicatorClassName={isComplete ? 'bg-[#F97316]' : 'bg-[#FEC6A1]'}
        />
      </div>
    </div>
  );
};

export default MovProgressBar;

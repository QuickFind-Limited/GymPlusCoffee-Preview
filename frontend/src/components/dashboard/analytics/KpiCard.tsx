
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  borderColor: string;
  bgColor: string;
  onClick?: () => void;
}

const KpiCard = ({ title, value, icon: Icon, borderColor, bgColor, onClick }: KpiCardProps) => {
  return (
    <Card 
      className={`shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex justify-center items-center mb-6">
          <div className={`p-3 ${bgColor} rounded-lg`}>
            <Icon className="h-6 w-6 text-gray-600" />
          </div>
        </div>
        <div className="space-y-3 text-center">
          <h3 className="text-base font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
      <div className={`absolute bottom-0 left-0 w-full h-1 ${borderColor}`}></div>
    </Card>
  );
};

export default KpiCard;

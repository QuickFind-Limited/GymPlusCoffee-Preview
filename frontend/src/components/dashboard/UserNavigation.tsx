
import React from 'react';
import { UserRound, ClipboardList, TrendingUp, Database, LogOut, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface UserNavigationProps {
  onOrdersClick: () => void;
  onDataSourcesClick: () => void;
  onInvoicesClick?: () => void;
  onLogout: () => void;
}

const UserNavigation = ({ 
  onOrdersClick, 
  onDataSourcesClick,
  onInvoicesClick,
  onLogout 
}: UserNavigationProps) => {
  const navigate = useNavigate();
  
  const handleInvoicesClick = () => {
    navigate('/invoices');
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none flex items-center justify-center w-8 h-8">
        <UserRound className="h-6 w-6 text-orange-500" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem 
          className="cursor-pointer flex items-center"
          onClick={onOrdersClick}
        >
          <ClipboardList className="h-4 w-4 mr-2" />
          Orders
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer flex items-center"
          onClick={onDataSourcesClick}
        >
          <Database className="h-4 w-4 mr-2" />
          Data Sources
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer text-black focus:text-black flex items-center"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserNavigation;

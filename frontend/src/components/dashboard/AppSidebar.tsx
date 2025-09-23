
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClipboardList, FileText, Database, Clock, Edit, CreditCard, Settings, Building2, BarChart3, LogOut, Package, MessageSquare, Archive } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarSeparator, SidebarFooter } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import PaymentDialog from '../PaymentDialog';

interface AppSidebarProps {
  onLogout: () => void;
  onNewQuery?: () => void; // New callback for resetting dashboard state
}

const AppSidebar = ({ onLogout, onNewQuery }: AppSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const { toast } = useToast();

  const pendingInvoices = [
    {
      id: "INV-2025-001",
      date: "5 Jun 2025",
      supplier: "Impala",
      total: "$2,840.50",
      status: "pending" as const,
      dueDate: "20 Jun 2025",
      amount: 2840.50
    },
    {
      id: "INV-2025-002",
      date: "4 Jun 2025",
      supplier: "Comme Avant",
      total: "$1,950.25",
      status: "pending" as const,
      dueDate: "19 Jun 2025",
      amount: 1950.25
    },
    {
      id: "INV-2025-003",
      date: "3 Jun 2025",
      supplier: "TechFlow Solutions",
      total: "$895.75",
      status: "overdue" as const,
      dueDate: "18 Jun 2025",
      amount: 895.75
    }
  ];

  const handlePayClick = () => {
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentComplete = () => {
    toast({
      title: "Payment Processed",
      description: "All pending invoices have been paid successfully"
    });
  };

  const handleNewChat = () => {
    // Reset dashboard state if callback provided
    if (onNewQuery) {
      onNewQuery();
    }
    
    // Navigate to dashboard to ensure we're on the right route
    navigate('/dashboard');
    
    toast({
      title: "New chat started",
      description: "Ready for your next request"
    });
  };

  const handleGenericHistoryClick = () => {
    navigate(location.pathname);
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleFeatureUnavailable = (feature: string) => {
    toast({
      title: "Coming soon",
      description: `${feature} isn't available yet.`,
    });
  };

  const navigationItems = [
    {
      title: "Data Sources",
      icon: Database,
      onClick: () => navigate('/data-sources'),
      isSmaller: true
    },
    {
      title: "Storage",
      icon: Archive,
      onClick: () => navigate('/storage'),
      isSmaller: true
    }
  ];

  const getHistoryContent = () => {
    const historyMap = {
      '/invoices': {
        title: "History", 
        items: [
          "Automation",
          "Payments",
          "Planning",
          "Terms",
          "Reporting",
          "Cashflow",
          "Alerts",
          "Discounts"
        ],
        onClick: () => handleFeatureUnavailable('Invoice history')
      },
      '/data-sources': {
        title: "History",
        items: [
          "Gmail",
          "Inventory",
          "Shopify", 
          "Catalogs",
          "Quality",
          "Monitoring",
          "Performance",
          "Mapping"
        ],
        onClick: handleGenericHistoryClick
      }
    };

    return historyMap[location.pathname as keyof typeof historyMap] || historyMap['/data-sources'];
  };
  
  const historyContent = getHistoryContent();
  
  return (
    <>
      <Sidebar className="w-64">
        <SidebarHeader className="p-4 pb-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleNewChat} className="w-full justify-start text-base font-medium px-px py-0 my-0 mx-0">
                <Edit className="h-5 w-5" />
                <span>New Query</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map(item => (
                  <SidebarMenuItem key={item.title}>
                    <div className="flex items-center w-full">
                      <SidebarMenuButton onClick={item.onClick} className={`flex-1 justify-start ${item.isSmaller ? 'text-sm' : 'text-base'}`}>
                        <item.icon className={item.isSmaller ? "h-4 w-4" : "h-5 w-5"} />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                      
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />
          
          {/* Backend Integration Point: conversationHistory expects user_id, returns Promise<ConversationHistoryResponse[]> */}
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm">Conversations</span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {[
                  "Best performer analysis",
                  "Inventory forecasting",
                  "Supplier comparison",
                  "Cost optimization",
                  "Stock alerts setup",
                  "Payment automation",
                  "Demand planning Q3",
                  "Budget allocation"
                ].map((conversation, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton 
                      className="w-full justify-start text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                      onClick={() => {
                        // TODO: Backend implementation - load conversation history
                        // Expected API call: GET /api/conversations/{conversation_id}
                        toast({
                          title: "Loading conversation",
                          description: `Loading: ${conversation}`
                        });
                      }}
                    >
                      <div className="truncate">{conversation}</div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

        </SidebarContent>

        <SidebarFooter className="p-4 pt-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSettingsClick} className="w-full justify-start text-base font-medium px-px py-0 my-0 mx-0">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onLogout} className="w-full justify-start text-base font-medium px-px py-0 my-0 mx-0 text-red-600 hover:text-red-700">
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        invoices={pendingInvoices}
        onPaymentComplete={handlePaymentComplete}
      />
    </>
  );
};

export default AppSidebar;

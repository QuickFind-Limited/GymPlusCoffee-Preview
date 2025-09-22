
import React, { useState } from 'react';
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import BackButton from "@/components/ui/back-button";

interface HeaderProps {
  showBackButton?: boolean;
  backButtonTo?: string;
}

const Header = ({ showBackButton = false, backButtonTo }: HeaderProps) => {
  const [clickCount, setClickCount] = useState(0);
  const [isAdminMode, setIsAdminMode] = useState(() => {
    return localStorage.getItem('adminMode') === 'true';
  });

  // Check if we're within a SidebarProvider context
  const isSidebarAvailable = () => {
    try {
      useSidebar();
      return true;
    } catch {
      return false;
    }
  };

  const hasSidebar = isSidebarAvailable();

  const handleLogoClick = () => {
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);

    // Reset purchase order suggestions on every logo click
    window.dispatchEvent(new CustomEvent('resetPurchaseOrders'));

    if (newClickCount === 5) {
      const newAdminMode = !isAdminMode;
      setIsAdminMode(newAdminMode);
      localStorage.setItem('adminMode', newAdminMode.toString());
      setClickCount(0);
      
      // Dispatch custom event to notify sidebar
      window.dispatchEvent(new CustomEvent('adminModeChanged', { 
        detail: { isAdminMode: newAdminMode } 
      }));
    }

    // Reset count after 2 seconds if not at 5
    if (newClickCount < 5) {
      setTimeout(() => {
        setClickCount(0);
      }, 2000);
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      <div className="flex items-center gap-4">
        {hasSidebar && <SidebarTrigger className="-ml-1" />}
        <div 
          className="text-2xl font-extrabold text-foreground tracking-tight cursor-pointer select-none"
          onClick={handleLogoClick}
        >
          Source.
        </div>
        {showBackButton && (
          <BackButton 
            to={backButtonTo} 
            className="bg-black hover:bg-gray-800"
          />
        )}
      </div>
      <div className="flex flex-1 items-center justify-end gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;

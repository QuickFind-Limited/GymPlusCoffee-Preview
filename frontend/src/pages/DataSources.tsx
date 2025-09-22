
import React from 'react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import DataSources from "@/components/DataSources";
import Header from "@/components/dashboard/Header";
import AppSidebar from '@/components/dashboard/AppSidebar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const DataSourcesPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out",
          variant: "destructive",
        });
        return;
      }
      navigate('/auth');
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar onLogout={handleLogout} />
        <SidebarInset>
          <Header />
          <main className="flex-1 p-4">
            <DataSources />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DataSourcesPage;

import React, { useState } from 'react';
import { Search, FileText, TrendingUp, Calendar, Filter, ChevronDown, BarChart, MessageCircle, Download } from 'lucide-react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Header from '@/components/dashboard/Header';
import AppSidebar from '@/components/dashboard/AppSidebar';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

// Backend Integration Point: expects StorageItem[], returns Promise<StorageSearchResponse>
interface StorageItem {
  id: string;
  title: string;
  type: 'forecast' | 'report' | 'purchase_order' | 'analysis';
  date: string;
  status: 'completed' | 'in_progress' | 'draft';
  summary: string;
  tags: string[];
  estimatedValue?: string;
  supplier?: string;
}

const Storage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StorageItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Backend Integration Point: Mock data - replace with API call to GET /api/storage/items
  const mockStorageItems: StorageItem[] = [
    {
      id: '1',
      title: 'SS25 Product Forecast',
      type: 'forecast',
      date: '2024-08-15',
      status: 'completed',
      summary: 'Comprehensive seasonal forecast for Spring/Summer 2025 collection including hoodies, fleeces, and accessories.',
      tags: ['SS25', 'seasonal', 'hoodies', 'fleeces'],
      estimatedValue: '£2.4M'
    },
    {
      id: '2',
      title: 'Hoody Restocking Report',
      type: 'report',
      date: '2024-08-12',
      status: 'completed',
      summary: 'Analysis of current hoody inventory levels and recommended restocking quantities for high-demand sizes.',
      tags: ['hoodies', 'inventory', 'restocking', 'XXL'],
    },
    {
      id: '3',
      title: 'PO-2024-089 Essential Hoodies',
      type: 'purchase_order',
      date: '2024-08-10',
      status: 'completed',
      summary: 'Purchase order for 500 units of black essential hoodies in XXL size from Impala Supplies.',
      tags: ['hoodies', 'black', 'XXL', 'Impala'],
      estimatedValue: '£15,750',
      supplier: 'Impala Supplies'
    },
    {
      id: '4',
      title: 'Q3 Performance Analysis',
      type: 'analysis',
      date: '2024-08-08',
      status: 'completed',
      summary: 'Quarterly performance analysis examining sales trends, stockouts, and category performance across all product lines.',
      tags: ['Q3', 'performance', 'sales', 'stockouts'],
    },
    {
      id: '5',
      title: 'Winter 24 Demand Forecast',
      type: 'forecast',
      date: '2024-08-05',
      status: 'in_progress',
      summary: 'Ongoing forecast analysis for Winter 2024 collection focusing on outerwear and cold-weather accessories.',
      tags: ['Winter24', 'outerwear', 'accessories'],
      estimatedValue: '£1.8M'
    },
    {
      id: '6',
      title: 'Competitor Pricing Analysis',
      type: 'analysis',
      date: '2024-08-03',
      status: 'completed',
      summary: 'Deep dive analysis of competitor pricing strategies across similar product categories and market positioning.',
      tags: ['competitor', 'pricing', 'market'],
    }
  ];

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out",
          variant: "destructive"
        });
        return;
      }
      navigate('/auth');
    } catch (err) {
      toast({
        title: "Error", 
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Backend Integration Point: Replace with actual API call
    // Expected API: GET /api/storage/search?query=${searchQuery}&type=${activeTab}&sort=${sortBy}
    setTimeout(() => {
      const filtered = mockStorageItems.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      setSearchResults(filtered);
      setIsSearching(false);
      
      toast({
        title: "Search Complete",
        description: `Found ${filtered.length} results for "${searchQuery}"`
      });
    }, 1000);
  };

  const handleItemClick = (item: StorageItem) => {
    // Backend Integration Point: Navigate to item details or recreate conversation
    // Expected API: GET /api/storage/items/${item.id}/details
    toast({
      title: "Loading Item",
      description: `Opening ${item.title}...`
    });
    
    // TODO: Implement navigation to detailed view or conversation recreation
  };

  const handleReturnToConversation = (item: StorageItem, e: React.MouseEvent) => {
    e.stopPropagation();
    // Backend Integration Point: Recreate conversation context
    // Expected API: POST /api/conversations/recreate with item.id
    toast({
      title: "Loading Conversation",
      description: `Recreating conversation for ${item.title}...`
    });
    
    // TODO: Navigate back to dashboard with conversation context loaded
    navigate('/dashboard', { state: { recreateConversation: item.id } });
  };

  const handleDownload = (item: StorageItem, e: React.MouseEvent) => {
    e.stopPropagation();
    // Backend Integration Point: Generate and download report/document
    // Expected API: GET /api/storage/items/${item.id}/download
    toast({
      title: "Preparing Download",
      description: `Generating ${item.type} document...`
    });
    
    // TODO: Implement actual download logic
    setTimeout(() => {
      toast({
        title: "Download Ready",
        description: `${item.title} has been downloaded successfully.`
      });
    }, 2000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'forecast':
        return <TrendingUp className="h-5 w-5 text-gray-700" />;
      case 'report':
        return <BarChart className="h-5 w-5 text-gray-700" />;
      case 'purchase_order':
        return <FileText className="h-5 w-5 text-gray-700" />;
      case 'analysis':
        return <Search className="h-5 w-5 text-gray-700" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const filteredItems = mockStorageItems.filter(item => 
    activeTab === 'all' || item.type === activeTab
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-white">
        <AppSidebar onLogout={handleLogout} />
        <SidebarInset>
          <Header />
          
          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
              {/* Header Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Storage</h1>
                <p className="text-gray-600">Access past forecasts, reports, and purchase orders generated by Source.</p>
              </div>

              {/* Search Section */}
              <Card className="mb-6 border-gray-200">
                <CardContent className="p-4">
                  <div className="flex gap-4 items-end mb-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search forecasts, reports, and purchase orders..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="text-base"
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      />
                    </div>

                    <Button onClick={handleSearch} disabled={isSearching} variant="outline" className="px-6 border-gray-300">
                      {isSearching ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent mr-2" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Filter Tabs */}
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-gray-50">
                      <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">All</TabsTrigger>
                      <TabsTrigger value="forecast" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">Forecasts</TabsTrigger>
                      <TabsTrigger value="report" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">Reports</TabsTrigger>
                      <TabsTrigger value="analysis" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">Analysis</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Results Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {searchResults.length > 0 ? 'Search Results' : 'Recent Items'}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Sort by:</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date_desc">Newest First</SelectItem>
                        <SelectItem value="date_asc">Oldest First</SelectItem>
                        <SelectItem value="title_asc">Title A-Z</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                  <div className="grid gap-3">
                  {(searchResults.length > 0 ? searchResults : filteredItems).map((item) => (
                    <Card 
                      key={item.id}
                      className="border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                      onClick={() => handleItemClick(item)}
                    >
                      <CardContent className="p-6 border-t border-gray-100">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50 border border-gray-200">
                                {getTypeIcon(item.type)}
                              </div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg text-gray-900">{item.title}</h3>
                                <Badge className={getStatusColor(item.status)}>
                                  {item.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                            
                            <p className="text-gray-600 mb-3 line-clamp-2">{item.summary}</p>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(item.date).toLocaleDateString()}</span>
                              </div>
                              {item.supplier && (
                                <span>Supplier: {item.supplier}</span>
                              )}
                              {item.estimatedValue && (
                                <span className="font-medium text-gray-900">{item.estimatedValue}</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleReturnToConversation(item, e)}
                              className="h-auto px-2 py-1 hover:bg-gray-50 flex items-center gap-1"
                              title="Go back to this conversation"
                            >
                              <MessageCircle className="h-3 w-3 text-gray-600" />
                              <span className="text-xs text-gray-600">Chat</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDownload(item, e)}
                              className="h-7 w-7 p-0 hover:bg-gray-50"
                              title="Download document"
                            >
                              <Download className="h-3 w-3 text-gray-600" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {(searchResults.length === 0 && searchQuery) && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-2">
                      <Search className="h-12 w-12 mx-auto mb-4" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-600">Try adjusting your search terms or filters.</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Storage;
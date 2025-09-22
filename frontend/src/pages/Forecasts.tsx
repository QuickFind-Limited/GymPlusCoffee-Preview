import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Header from '@/components/dashboard/Header';
import AppSidebar from '@/components/dashboard/AppSidebar';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Download, Eye, Calendar, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Backend Integration Point: Interface for conversation history data structure
interface ConversationFile {
  id: string;
  name: string;
  type: 'forecast' | 'report' | 'analysis' | 'order';
  size: string;
  downloadUrl: string;
}

interface Conversation {
  id: string;
  title: string;
  summary: string;
  createdAt: Date;
  lastUpdated: Date;
  status: 'completed' | 'in-progress' | 'archived';
  type: 'forecast' | 'analysis' | 'procurement' | 'general';
  messageCount: number;
  files: ConversationFile[];
  thumbnail?: string; // Optional preview image
  outcome: string;
}

const Forecasts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'type' | 'messages'>('date');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mock conversation data - Backend Integration Point: Replace with actual API call
  const [conversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'Q1 Office Supplies Forecast',
      summary: 'Generated comprehensive forecast for office supplies procurement for Q1 2024, including cost analysis and vendor recommendations.',
      createdAt: new Date('2024-01-15'),
      lastUpdated: new Date('2024-01-15'),
      status: 'completed',
      type: 'forecast',
      messageCount: 12,
      outcome: 'Identified $15K savings opportunity through bulk purchasing',
      files: [
        { id: 'f1', name: 'Q1_Office_Supplies_Forecast.pdf', type: 'forecast', size: '2.3 MB', downloadUrl: '#' },
        { id: 'f2', name: 'Cost_Analysis_Report.xlsx', type: 'analysis', size: '1.8 MB', downloadUrl: '#' },
        { id: 'f3', name: 'Vendor_Recommendations.pdf', type: 'report', size: '956 KB', downloadUrl: '#' }
      ]
    },
    {
      id: '2',
      title: 'Safety Equipment Analysis',
      summary: 'Analyzed current safety equipment inventory and identified critical gaps requiring immediate attention.',
      createdAt: new Date('2024-01-12'),
      lastUpdated: new Date('2024-01-13'),
      status: 'completed',
      type: 'analysis',
      messageCount: 8,
      outcome: 'Ordered emergency safety equipment worth $8,500',
      files: [
        { id: 'f4', name: 'Safety_Equipment_Analysis.pdf', type: 'analysis', size: '1.5 MB', downloadUrl: '#' },
        { id: 'f5', name: 'Purchase_Order_SE001.pdf', type: 'order', size: '425 KB', downloadUrl: '#' }
      ]
    },
    {
      id: '3',
      title: 'Supplier Performance Review',
      summary: 'Comprehensive review of top 10 suppliers based on delivery times, quality, and cost effectiveness.',
      createdAt: new Date('2024-01-10'),
      lastUpdated: new Date('2024-01-11'),
      status: 'completed',
      type: 'analysis',
      messageCount: 15,
      outcome: 'Renegotiated contracts with 3 suppliers for better terms',
      files: [
        { id: 'f6', name: 'Supplier_Performance_Dashboard.pdf', type: 'report', size: '3.2 MB', downloadUrl: '#' },
        { id: 'f7', name: 'Contract_Recommendations.docx', type: 'report', size: '782 KB', downloadUrl: '#' }
      ]
    },
    {
      id: '4',
      title: 'Holiday Season Demand Forecast',
      summary: 'Predicted holiday season demand for retail products and planned inventory accordingly.',
      createdAt: new Date('2024-01-08'),
      lastUpdated: new Date('2024-01-09'),
      status: 'archived',
      type: 'forecast',
      messageCount: 20,
      outcome: 'Achieved 95% stock availability during peak season',
      files: [
        { id: 'f8', name: 'Holiday_Demand_Forecast.pdf', type: 'forecast', size: '4.1 MB', downloadUrl: '#' },
        { id: 'f9', name: 'Inventory_Plan.xlsx', type: 'analysis', size: '2.7 MB', downloadUrl: '#' }
      ]
    }
  ]);

  // Debounce search query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

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

  // Backend Integration Point: Filter and sort conversations based on search criteria
  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = !debouncedSearchQuery || 
      conversation.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      conversation.summary.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    
    const matchesType = !selectedType || conversation.type === selectedType;
    
    return matchesSearch && matchesType;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return b.lastUpdated.getTime() - a.lastUpdated.getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      case 'type':
        return a.type.localeCompare(b.type);
      case 'messages':
        return b.messageCount - a.messageCount;
      default:
        return 0;
    }
  });

  // Backend Integration Point: Handle conversation reopening
  const handleConversationClick = (conversation: Conversation) => {
    // Navigate to chat interface with conversation context
    navigate(`/dashboard?conversation=${conversation.id}`);
    toast({
      title: "Conversation Resumed",
      description: `Continuing "${conversation.title}"`,
    });
  };

  // Backend Integration Point: Handle file downloads
  const handleFileDownload = (file: ConversationFile, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent conversation click
    // Implement actual download logic here
    toast({
      title: "Download Started",
      description: `Downloading ${file.name}`,
    });
  };

  // Backend Integration Point: Handle bulk file downloads
  const handleDownloadAll = (files: ConversationFile[], e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: "Bulk Download Started",
      description: `Downloading ${files.length} files`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'forecast':
        return <Calendar className="h-4 w-4" />;
      case 'analysis':
        return <FileText className="h-4 w-4" />;
      case 'procurement':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-100 dark:bg-black">
        <AppSidebar onLogout={handleLogout} />
        <SidebarInset>
          <Header />
          
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              {/* Page Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Forecast History
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Review and continue your past conversations and forecasts
                </p>
              </div>

              {/* Search and Filters */}
              <div className="mb-6 flex flex-wrap gap-4 items-center">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full"
                  />
                </div>
                
                <select
                  value={selectedType || ''}
                  onChange={(e) => setSelectedType(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">All Types</option>
                  <option value="forecast">Forecasts</option>
                  <option value="analysis">Analysis</option>
                  <option value="procurement">Procurement</option>
                  <option value="general">General</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="date">Sort by Date</option>
                  <option value="title">Sort by Title</option>
                  <option value="type">Sort by Type</option>
                  <option value="messages">Sort by Messages</option>
                </select>
              </div>

              {/* Conversations Grid */}
              <div className="w-full">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No conversations found matching your criteria.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredConversations.map((conversation) => (
                      <Card
                        key={conversation.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow duration-200 relative group"
                        onClick={() => handleConversationClick(conversation)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(conversation.type)}
                              <CardTitle className="text-lg font-semibold truncate">
                                {conversation.title}
                              </CardTitle>
                            </div>
                            <Badge className={getStatusColor(conversation.status)}>
                              {conversation.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                            {conversation.summary}
                          </p>
                          
                          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                              Outcome: {conversation.outcome}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <span>{conversation.messageCount} messages</span>
                            <span>{conversation.lastUpdated.toLocaleDateString()}</span>
                          </div>

                          {/* Files Section */}
                          {conversation.files.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Files ({conversation.files.length})
                                </h4>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => handleDownloadAll(conversation.files, e)}
                                  className="text-xs h-6 px-2"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  All
                                </Button>
                              </div>
                              <div className="space-y-1 max-h-24 overflow-y-auto">
                                {conversation.files.slice(0, 3).map((file) => (
                                  <div
                                    key={file.id}
                                    className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded"
                                  >
                                    <span className="truncate flex-1">{file.name}</span>
                                    <span className="text-gray-400 ml-2">{file.size}</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => handleFileDownload(file, e)}
                                      className="h-5 w-5 p-0 ml-1"
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                                {conversation.files.length > 3 && (
                                  <p className="text-xs text-gray-500">
                                    +{conversation.files.length - 3} more files
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Resume Button */}
                          <Button
                            className="w-full mt-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConversationClick(conversation);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Resume Conversation
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
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

export default Forecasts;
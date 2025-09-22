import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, TrendingUp, TrendingDown, Target, Users, Eye, CheckCircle, XCircle, BarChart3, Send, Monitor, Package, DollarSign, ShoppingCart, ImageIcon, Mic } from 'lucide-react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "../components/dashboard/AppSidebar";
import Header from "../components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
const AIInsights = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  
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
  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle message sending logic here
      setMessage('');
    }
  };
  const keyInsights = [{
    type: 'increase',
    title: '📈 Increase IT Hardware spend 25%',
    description: '🎯 Q4 demand forecasting shows increased requirements',
    icon: TrendingUp,
    color: 'text-muted-foreground'
  }, {
    type: 'decrease',
    title: '📉 Reduce Office Supplies spend 15%',
    description: '🤝 Consolidate vendors and negotiate better bulk pricing',
    icon: TrendingDown,
    color: 'text-muted-foreground'
  }];
  const objectives = [{
    title: '💻 IT Equipment',
    ads: 24,
    spend: '$127,450',
    color: 'text-foreground',
    icon: Monitor
  }, {
    title: '📦 Office Supplies',
    ads: 8,
    spend: '$23,180',
    color: 'text-foreground',
    icon: Package
  }];
  const workingItems = ['🤝 Bulk purchasing agreements with 3+ year contracts for better pricing', '🏢 Vendor consolidation strategy reducing administrative overhead by 40%', '💰 Early payment discount programs capturing 2-3% savings across categories'];
  const notWorkingItems = ['⚠️ Single-source procurement without competitive bidding', '🔄 Short-term contracts with frequent renegotiation cycles', '🔀 Fragmented purchasing across departments without centralized oversight'];
  const topSuppliers = [{
    name: "TechCorp Solutions",
    change: "12% cost reduction",
    direction: 'down',
    description: "Consolidated IT hardware procurement with volume discounts achieving significant savings...",
    icon: '💻'
  }];
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar onLogout={handleLogout} />
        
        <SidebarInset className="flex-1">
          <Header />
          
          <div className="flex-1 p-6">
            <div className="grid grid-cols-12 gap-6 h-full">
              {/* Chat Section */}
              <div className="col-span-4 flex flex-col h-full">
                {/* User Message */}
                <div className="flex items-start mb-6">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2 text-foreground">Ethan</p>
                    <div className="bg-muted/60 rounded-2xl rounded-tl-md px-4 py-3 border border-border">
                      <p className="text-sm text-foreground">
                        How are my procurement strategies performing? What's working and what needs optimization?
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex items-start mb-6">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2 text-foreground">Moby</p>
                    <div className="bg-card rounded-2xl rounded-tl-md px-4 py-3 border border-border">
                      <p className="text-sm text-muted-foreground mb-3">
                        Hey! Your procurement strategies with bulk purchasing and vendor consolidation are performing excellently! Check out the full analysis and key recommendations attached.
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground text-xs">Version 2</span>
                        <Button variant="secondary" size="sm" className="h-7 px-3 text-xs rounded-lg">
                          Click to open
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Spacer to push input to bottom */}
                <div className="flex-1"></div>

                {/* Input - ChatGPT Style */}
                <div className="relative bg-background border border-border rounded-3xl p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    {/* Left Icons */}
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted"
                      >
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                    
                    {/* Input Field */}
                    <div className="flex-1 relative">
                      <Input 
                        placeholder="Thanks! Which procurement categories should I focus on to maximize cost savings?" 
                        value={message} 
                        onChange={e => setMessage(e.target.value)} 
                        className="border-0 bg-transparent text-sm placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0 px-0" 
                        onKeyPress={e => e.key === 'Enter' && handleSendMessage()} 
                      />
                    </div>
                    
                    {/* Right Icons */}
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full hover:bg-muted"
                      >
                        <Mic className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button 
                        onClick={handleSendMessage} 
                        size="icon" 
                        disabled={!message.trim()} 
                        className="h-8 w-8 rounded-full bg-foreground hover:bg-foreground/80 disabled:bg-muted disabled:text-muted-foreground"
                      >
                        <Send className="w-4 h-4 text-background" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insights Section */}
              <div className="col-span-8 space-y-6">
                {/* Key Insights and Objectives */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Key Insights */}
                  <Card className="border border-gray-400">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg text-foreground font-medium">Key Insights</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {keyInsights.map((insight, index) => 
                        <div key={index} className="flex items-start gap-3 p-3 bg-muted/20 border border-border/60 rounded-xl">
                          <div className={`mt-0.5 ${insight.color}`}>
                            <insight.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm mb-1 text-foreground">{insight.title}</p>
                            <p className="text-xs text-muted-foreground">{insight.description}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Objectives */}
                  <Card className="border border-gray-400">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg text-foreground font-medium">Objective</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {objectives.map((obj, index) => 
                        <div key={index} className="space-y-2 p-3 bg-muted/20 border border-border/60 rounded-xl">
                         <div className="flex items-center gap-2">
                            <obj.icon className={`w-4 h-4 ${obj.color}`} />
                            <span className="font-medium text-sm text-foreground">{obj.title}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <ShoppingCart className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{obj.ads} Orders</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-muted-foreground" />
                              <span className={`font-medium ${obj.color}`}>{obj.spend} Spend</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Creative & Copy Analysis */}
                <Card className="border border-gray-400">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg text-foreground font-medium">Procurement Strategy Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      {/* What's Working */}
                      <div className="p-4 bg-muted/20 border border-border/60 rounded-xl">
                        <div className="flex items-center gap-2 mb-4">
                          <CheckCircle className="w-4 h-4 text-muted-foreground" />
                          <h3 className="font-medium text-foreground">What's Working</h3>
                        </div>
                        <div className="space-y-3">
                          {workingItems.map((item, index) => 
                            <div key={index} className="flex items-start gap-2">
                              <CheckCircle className="w-3 h-3 text-muted-foreground mt-1 flex-shrink-0" />
                              <p className="text-sm text-muted-foreground">{item}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* What's Not Working */}
                      <div className="p-4 bg-muted/20 border border-border/60 rounded-xl">
                        <div className="flex items-center gap-2 mb-4">
                          <XCircle className="w-4 h-4 text-muted-foreground" />
                          <h3 className="font-medium text-foreground">What's Not Working</h3>
                        </div>
                        <div className="space-y-3">
                          {notWorkingItems.map((item, index) => 
                            <div key={index} className="flex items-start gap-2">
                              <XCircle className="w-3 h-3 text-muted-foreground mt-1 flex-shrink-0" />
                              <p className="text-sm text-muted-foreground">{item}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Top 5 Facebook Ads */}
                <Card className="border border-gray-400">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg text-foreground font-medium">Top 5 Suppliers with Best Cost Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground border-b border-border pb-3">
                        <div>Supplier</div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Cost Performance
                        </div>
                        <div>Why it's working</div>
                        <div></div>
                      </div>
                      
                      {topSuppliers.map((supplier, index) => 
                        <div key={index} className="grid grid-cols-4 gap-4 items-center py-3 border-b border-border/60 last:border-0 bg-muted/10 rounded-xl px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-muted/60 rounded-lg flex items-center justify-center text-sm border border-border/60">
                              {supplier.icon}
                            </div>
                            <span className="font-medium text-sm text-foreground">{supplier.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">{supplier.change}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {supplier.description}
                          </div>
                          <div></div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>;
};
export default AIInsights;
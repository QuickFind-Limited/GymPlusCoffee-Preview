import AppSidebar from '@/components/dashboard/AppSidebar';
import ChatInterface from '@/components/dashboard/ChatInterface';
import Header from '@/components/dashboard/Header';
import SearchBar from '@/components/dashboard/SearchBar';
import StreamingConversation from '@/components/dashboard/StreamingConversation';
import PurchaseOrderGenerationTransition from '@/components/PurchaseOrderGenerationTransition';
import PurchaseOrderPDFView from '@/components/PurchaseOrderPDFView';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useConversation } from '@/contexts/ConversationContext';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { useToast } from '@/hooks/use-toast';
import {
  apiStreamingService,
  StreamEvent,
  StreamEventData,
} from '@/services/apiStreaming';
import { extractMessageFromParams } from '@/utils/navigationUtils';
import { Bell, Check, ClipboardList, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';

interface DashboardProps {
  onNavigateToConversation?: (message: string) => void;
}

const THINK_OUT_LOUD_STORAGE_KEY = 'gpc_think_out_loud_enabled';

const Dashboard = ({ onNavigateToConversation }: DashboardProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [showStreamingConversation, setShowStreamingConversation] = useState(false);
  const [showOrderGeneration, setShowOrderGeneration] = useState(false);
  const [isGeneratingPO, setIsGeneratingPO] = useState(false);
  const [showPurchaseOrder, setShowPurchaseOrder] = useState(false);
  const [selectedOrderData, setSelectedOrderData] = useState<{
    supplier: string;
    products: any[];
    totalEstimatedCost: string;
    urgency: string;
    action: string;
  } | null>(null);

  const [thinkOutLoudEnabled, setThinkOutLoudEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      const stored = window.localStorage.getItem(THINK_OUT_LOUD_STORAGE_KEY);
      return stored ? stored === 'true' : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(
        THINK_OUT_LOUD_STORAGE_KEY,
        thinkOutLoudEnabled ? 'true' : 'false'
      );
    } catch {
      // ignore write errors
    }
  }, [thinkOutLoudEnabled]);

  const thinkOutLoudPhrase = 'and make sure you THINK OUT LOUD for EVERY response you provide';

  const renderDisplayQuery = (input: string): string => input.trim();

  const buildStreamingQuery = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) {
      return '';
    }
    if (!thinkOutLoudEnabled) {
      return trimmed;
    }
    if (trimmed.toLowerCase().includes(thinkOutLoudPhrase.toLowerCase())) {
      return trimmed;
    }
    return `${trimmed} ${thinkOutLoudPhrase}`;
  };

  const conversation = useConversation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { monthlySpendData } = useFinancialData();
  const { user } = useUser();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      toast({
        title: 'Sign out failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handlePOGenerationComplete = () => {
    setIsGeneratingPO(false);
  };

  const startStreaming = async (query: string) => {
    conversation.setIsStreaming(true);
    setShowStreamingConversation(true);
    setShowChatInterface(false);

    const options = {
      prompt: query,
      model: 'claude-sonnet-4-20250514',
      max_turns: 30,
      session_id: conversation.sessionId || undefined,
      system_prompt: conversation.systemPrompt.trim() || '',
    };

    try {
      await apiStreamingService.streamQuery(
        options,
        (event: StreamEvent) => {
          conversation.addStreamingEvent(event);
        },
        (finalResponse?: string, sessionId?: string) => {
          conversation.setIsStreaming(false);
          if (sessionId) {
            conversation.setSessionId(sessionId);
          }
          if (finalResponse) {
            conversation.setFinalResponse(finalResponse);
            conversation.addAssistantMessage(finalResponse);
          }
        },
        (error: Error) => {
          conversation.setIsStreaming(false);
          const errorEvent: StreamEvent = {
            id: Date.now().toString(),
            type: 'log',
            timestamp: new Date().toISOString(),
            display: `❌ Erreur: ${error.message}`,
            data: { error: error.message } as StreamEventData,
          };
          conversation.addStreamingEvent(errorEvent);
        }
      );
    } catch (error) {
      conversation.setIsStreaming(false);
      toast({
        title: 'Streaming failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleChatSubmit = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const displayQuery = renderDisplayQuery(trimmed);
    const streamingQuery = buildStreamingQuery(trimmed);

    setActiveQuery(displayQuery);
    setSearchQuery('');
    setShowChatInterface(false);
    setShowStreamingConversation(true);
    setShowOrderGeneration(false);

    conversation.addUserMessage(displayQuery);
    conversation.setIsStreaming(true);

    void startStreaming(streamingQuery);
  };

  const handleOrderGeneration = (query: string) => {
    if (query.toLowerCase().includes('replenishment')) {
      setSearchQuery(query);
      setShowChatInterface(true);
      setShowOrderGeneration(false);
    } else {
      setSearchQuery(query);
      setShowOrderGeneration(true);
      setShowChatInterface(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    void handleChatSubmit(suggestion);
  };

  const handleNewQuery = () => {
    setShowChatInterface(false);
    setShowStreamingConversation(false);
    setShowOrderGeneration(false);
    setSearchQuery('');
    setActiveQuery('');
    conversation.clearConversation();
  };

  useEffect(() => {
    if (user) {
      const messageParam = new URLSearchParams(location.search).get('message');
      if (messageParam) {
        const initialMessage = extractMessageFromParams(new URLSearchParams(location.search));
        if (initialMessage) {
          void handleChatSubmit(initialMessage);
          setTimeout(() => {
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('message');
            setSearchParams(newSearchParams, { replace: true });
          }, 500);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);


  const totalSpend = monthlySpendData.reduce((sum, item) => sum + item.spend, 0);

  const kpiData = [
    {
      title: 'Open Orders',
      value: '27',
      icon: ClipboardList,
      borderColor: 'bg-green-500',
      bgColor: 'bg-gray-100',
      onClick: () => {},
    },
    {
      title: 'New Quotes Received',
      value: '2',
      icon: FileText,
      borderColor: 'bg-blue-500',
      bgColor: 'bg-gray-100',
      onClick: () => {},
    },
    {
      title: 'Pending Approvals',
      value: '3',
      icon: Check,
      borderColor: 'bg-orange-500',
      bgColor: 'bg-gray-100',
      onClick: () => {},
    },
    {
      title: 'Notifications',
      value: '5',
      icon: Bell,
      borderColor: 'bg-purple-500',
      bgColor: 'bg-gray-100',
      onClick: () => {},
    },
  ];
  const showSummaryPanels = false;


  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-100 dark:bg-black">
        <AppSidebar onLogout={handleLogout} onNewQuery={handleNewQuery} />
        <SidebarInset>
          <Header />

          <main className="flex-1 flex flex-col px-4 py-4">
            {isGeneratingPO ? (
              <div className="flex items-center justify-center min-h-[80vh]">
                <PurchaseOrderGenerationTransition
                  onComplete={handlePOGenerationComplete}
                />
              </div>
            ) : showOrderGeneration ? (
              <div className="flex flex-col items-center justify-center w-full h-full bg-gray-900 text-white">
                <div className="max-w-md text-center">
                  <h2 className="text-2xl font-bold mb-4">
                    Generating Purchase Order
                  </h2>
                  <p className="text-gray-400 mb-6">
                    Processing your order request: "{activeQuery}"
                  </p>
                  <button
                    onClick={() => setShowOrderGeneration(false)}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Back to Search
                  </button>
                </div>
              </div>
            ) : showStreamingConversation ? (
              <div className="h-full">
              <StreamingConversation
                  className="h-[calc(100vh-8rem)]"
                  events={conversation.streamingEvents}
                  isStreaming={conversation.isStreaming}
                  conversationMessages={conversation.messages}
                  onSubmit={handleChatSubmit}
                  thinkOutLoudEnabled={thinkOutLoudEnabled}
                  onToggleThinkOutLoud={setThinkOutLoudEnabled}
                />
              </div>
            ) : showChatInterface ? (
              <ChatInterface
                initialQuery={activeQuery}
                onSubmit={handleChatSubmit}
                disableLocalAssistantResponses
              />
            ) : (
              <div
                className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto transition-all duration-500 ease-in-out mt-8"
                style={{ minHeight: 'calc(100vh - 16rem)' }}
              >
                <div className="text-center mb-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-800 dark:text-white mb-4 tracking-tight">
                    What do you need to do today?
                  </h2>
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 mb-4">
                    Build forecasts, generate reports, and create purchase orders with ease.
                  </p>
                </div>

                <div className="w-full max-w-3xl mx-auto animate-in fade-in-0 slide-in-from-bottom-6 duration-700 delay-200">
                  <SearchBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onSubmit={handleChatSubmit}
                    onNavigateToConversation={onNavigateToConversation}
                    onOrderGeneration={handleOrderGeneration}
                    thinkOutLoudEnabled={thinkOutLoudEnabled}
                    onToggleThinkOutLoud={setThinkOutLoudEnabled}
                  />
                </div>

                <div className="w-full max-w-5xl mx-auto mt-4 space-y-2 animate-in fade-in-0 slide-in-from-bottom-8 duration-700 delay-400">
                  <div className="flex flex-wrap gap-4 justify-center w-full">
                    <button
                      onClick={() => handleSuggestionClick('Re-order 100 units of black essential hoody XXL')}
                      className="px-6 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors backdrop-blur whitespace-nowrap"
                    >
                      "Re-order 100 units of black essential hoody XXL"
                    </button>
                    <button
                      onClick={() => handleSuggestionClick('Help me create a new forecast for SS25')}
                      className="px-6 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors backdrop-blur whitespace-nowrap"
                    >
                      "Help me create a new forecast for SS25"
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <button
                      onClick={() => handleSuggestionClick('Identify stockouts across our best catagories and calculate missed sales')}
                      className="px-6 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors backdrop-blur whitespace-nowrap"
                    >
                      "Identify stockouts across our best categories and calculate missed sales"
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showSummaryPanels && (
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Executive Summary
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
                {kpiData.map((kpi) => (
                  <div
                    key={kpi.title}
                    className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900 ${kpi.bgColor}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {kpi.title}
                        </p>
                        <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                          {kpi.value}
                        </h3>
                      </div>
                      <kpi.icon className={`h-10 w-10 rounded-full p-2 text-white ${kpi.borderColor}`} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
            )}

            {showSummaryPanels && (
            <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Monthly Spend Overview
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Total spend this year: €{totalSpend.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  NetSuite Activity Feed
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Streaming conversation context appears here in real time as the assistant works.
                </p>
              </div>
            </section>
            )}
          </main>
        </SidebarInset>
      </div>

      <PurchaseOrderPDFView
        isOpen={showPurchaseOrder}
        onOpenChange={setShowPurchaseOrder}
        orderData={selectedOrderData}
      />
    </SidebarProvider>
  );
};

export default Dashboard;

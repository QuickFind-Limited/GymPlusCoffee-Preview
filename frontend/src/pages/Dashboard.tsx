import AppSidebar from "@/components/dashboard/AppSidebar";
import ChatInterface from "@/components/dashboard/ChatInterface";
import Header from "@/components/dashboard/Header";
import SearchBar from "@/components/dashboard/SearchBar";
import StreamingConversation from "@/components/dashboard/StreamingConversation";
import PurchaseOrderGenerationTransition from "@/components/PurchaseOrderGenerationTransition";
import PurchaseOrderPDFView from "@/components/PurchaseOrderPDFView";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useConversation } from "@/contexts/ConversationContext";
import { useFinancialData } from "@/contexts/FinancialDataContext";
import { useToast } from "@/hooks/use-toast";
// import { supabase } from "@/integrations/supabase/client";
import {
  apiStreamingService,
  StreamEvent,
  StreamEventData,
} from "@/services/apiStreaming";
import { suggestClarifications } from "@/services/clarificationService";
import { ClarificationResponse } from "@/types/clarifications";
import { ClarificationPreview } from "@/components/clarifications/ClarificationPreview";
import { extractMessageFromParams } from "@/utils/navigationUtils";
import { Bell, Check, ClipboardList, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/contexts/UserContext";
interface DashboardProps {
  onNavigateToConversation?: (message: string) => void;
}
const Dashboard = ({ onNavigateToConversation }: DashboardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingOrderSummary, setIsLoadingOrderSummary] = useState(false);
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [showStreamingConversation, setShowStreamingConversation] =
    useState(false);
  const [showOrderGeneration, setShowOrderGeneration] = useState(false);
  const [clarificationResponse, setClarificationResponse] =
    useState<ClarificationResponse | null>(null);
  const [isLoadingClarifications, setIsLoadingClarifications] =
    useState(false);
  const [clarificationError, setClarificationError] = useState<string | null>(
    null
  );
  const [activeQuery, setActiveQuery] = useState<string>("");

  const hasClarificationOutput =
    isLoadingClarifications ||
    Boolean(clarificationError) ||
    Boolean(
      clarificationResponse &&
        (clarificationResponse.suggestions.length > 0 ||
          Object.keys(clarificationResponse.auto_applied || {}).length > 0)
    );

  // Utiliser le store de conversation
  const conversation = useConversation();
  const [chatLoadingMessage, setChatLoadingMessage] = useState("");
  const [isGeneratingPO, setIsGeneratingPO] = useState(false);
  const [showPurchaseOrder, setShowPurchaseOrder] = useState(false);
  const [selectedOrderData, setSelectedOrderData] = useState<{
    supplier: string;
    products: any[];
    totalEstimatedCost: string;
    urgency: string;
    action: string;
  } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { monthlySpendData } = useFinancialData();
  const { user } = useUser();

  // Effet pour détecter une conversation active et afficher StreamingConversation
  useEffect(() => {
    if (
      conversation.messages.length > 0 ||
      conversation.streamingEvents.length > 0
    ) {
      setShowStreamingConversation(true);
      setShowChatInterface(false);
      setShowOrderGeneration(false);
    }
  }, [conversation.messages, conversation.streamingEvents]);

  // Handle initial message from URL parameters - RUN IMMEDIATELY
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const messageParam = urlParams.get("message");

    if (user && messageParam) {
      const initialMessage = extractMessageFromParams(urlParams);

      if (initialMessage) {
        setSearchQuery(initialMessage);

        // Utiliser le store de conversation pour gérer le message depuis l'URL
        conversation.addUserMessage(initialMessage);
        conversation.setIsStreaming(true);

        // Start streaming conversation immediately
        setShowStreamingConversation(true);
        setShowChatInterface(false);
        setShowOrderGeneration(false);

        // Start the API call after a brief delay
        setTimeout(() => {
          apiStreamingService.streamQuery(
            {
              prompt: initialMessage,
              model: "claude-sonnet-4-20250514",
              max_turns: 30,
              ...(conversation.systemPrompt?.trim()
                ? { system_prompt: conversation.systemPrompt.trim() }
                : {}),
            },
            (event: StreamEvent) => {
              conversation.addStreamingEvent(event);
            },
            (finalResponse?: string) => {
              conversation.setIsStreaming(false);
              if (finalResponse) {
                conversation.setFinalResponse(finalResponse);
                conversation.addAssistantMessage(finalResponse);
              }
            },
            (error: Error) => {
              conversation.setIsStreaming(false);
              const errorEvent: StreamEvent = {
                id: Date.now().toString(),
                type: "log",
                timestamp: new Date().toISOString(),
                display: `❌ Erreur: ${error.message}`,
                data: { error: error.message } as StreamEventData,
              };
              conversation.addStreamingEvent(errorEvent);
            }
          );
        }, 100);

        // Clear the URL parameter AFTER processing to avoid re-triggering
        setTimeout(() => {
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete("message");
          setSearchParams(newSearchParams, { replace: true });
        }, 1000); // Give more time
      } else {
        toast({
          title: "Invalid Message",
          description: "The message parameter is malformed or too long.",
          variant: "destructive",
        });
      }
    }
  }, [user, searchParams, setSearchParams, toast]);

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
  const handleQuickActionClick = () => {};
  const handlePOGenerationComplete = () => {
    setIsGeneratingPO(false);
  };
  const evaluateClarifications = async (query: string) => {
    if (!query.trim()) {
      setClarificationResponse(null);
      setClarificationError(null);
      return;
    }

    setActiveQuery(query);
    setClarificationError(null);
    setClarificationResponse(null);
    setIsLoadingClarifications(true);

    try {
      const response = await suggestClarifications({
        user_query: query,
        already_provided: {},
      });
      setClarificationResponse(response);
    } catch (error) {
      setClarificationError(
        error instanceof Error
          ? error.message
          : "Failed to evaluate clarification questions"
      );
    } finally {
      setIsLoadingClarifications(false);
    }
  };

  const handleChatSubmit = async (query: string) => {
    console.log("🎯 handleChatSubmit called with query:", query);
    setSearchQuery(query);
    setActiveQuery(query);
    setShowChatInterface(true);
    setShowStreamingConversation(false);
    setShowOrderGeneration(false);

    void evaluateClarifications(query);
  };

  // Ces gestionnaires ne sont plus nécessaires car on utilise le store de conversation
  const handleOrderGeneration = (query: string) => {
    // For replenishment orders, use the ChatInterface with sophisticated parsing
    if (query.toLowerCase().includes("replenishment")) {
      setSearchQuery(query);
      setActiveQuery(query);
      setShowChatInterface(true);
      setShowOrderGeneration(false);
    } else {
      // For simple orders, show the basic order generation interface
      setSearchQuery(query);
      setActiveQuery(query);
      setShowOrderGeneration(true);
      setShowChatInterface(false);
    }
  };
  const handleSuggestionClick = (suggestion: string) => {
    void handleChatSubmit(suggestion);
  };
  const handleOpenOrdersClick = () => {};
  const handleQuotesClick = () => {};
  const handleApprovalsClick = () => {};
  const handleNotificationsClick = () => {};
  const totalSpend = monthlySpendData.reduce(
    (sum, item) => sum + item.spend,
    0
  );
  const kpiData = [
    {
      title: "Open Orders",
      value: "27",
      icon: ClipboardList,
      borderColor: "bg-green-500",
      bgColor: "bg-gray-100",
      onClick: handleOpenOrdersClick,
    },
    {
      title: "New Quotes Received",
      value: "2",
      icon: FileText,
      borderColor: "bg-blue-500",
      bgColor: "bg-gray-100",
      onClick: handleQuotesClick,
    },
    {
      title: "Pending Approvals",
      value: "3",
      icon: Check,
      borderColor: "bg-orange-500",
      bgColor: "bg-gray-100",
      onClick: handleApprovalsClick,
    },
    {
      title: "Notifications",
      value: "5",
      icon: Bell,
      borderColor: "bg-purple-500",
      bgColor: "bg-gray-100",
      onClick: handleNotificationsClick,
    },
  ];
  const handleStreamingConversationClick = () => {
    setShowStreamingConversation(true);
    setShowChatInterface(false);
    setShowOrderGeneration(false);
  };

  const handleClarificationRetry = () => {
    if (!activeQuery) return;
    void evaluateClarifications(activeQuery);
  };

  const handleNewQuery = () => {
    // Reset all chat-related states to return to main dashboard prompt box
    setShowChatInterface(false);
    setShowStreamingConversation(false);
    setShowOrderGeneration(false);
    setSearchQuery("");
    setActiveQuery("");
    setIsLoadingOrderSummary(false);
    setIsGeneratingPO(false);
    setClarificationResponse(null);
    setClarificationError(null);
    setIsLoadingClarifications(false);

    conversation.clearConversation();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-100 dark:bg-black">
        <AppSidebar onLogout={handleLogout} onNewQuery={handleNewQuery} />
        <SidebarInset>
          <Header />

          <main className="flex-1 flex flex-col px-4 py-4">
            {hasClarificationOutput && (
              <div className="mb-4">
                <ClarificationPreview
                  response={clarificationResponse}
                  loading={isLoadingClarifications}
                  error={clarificationError}
                  onRetry={handleClarificationRetry}
                />
              </div>
            )}
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
                />
              </div>
            ) : showChatInterface ? (
              <ChatInterface
                initialQuery={activeQuery}
                onSubmit={handleChatSubmit}
              />
            ) : (
              <div
                className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto transition-all duration-500 ease-in-out mt-8"
                style={{
                  minHeight: "calc(100vh - 16rem)",
                }}
              >
                <div className="text-center mb-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-800 dark:text-white mb-4 tracking-tight">
                    What do you need to do today?
                  </h2>
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 mb-4">
                    Build forecasts, generate reports, and create purchase
                    orders with ease.
                  </p>
                </div>

                <div className="w-full max-w-3xl mx-auto animate-in fade-in-0 slide-in-from-bottom-6 duration-700 delay-200">
                  <SearchBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onSubmit={handleChatSubmit}
                    onNavigateToConversation={onNavigateToConversation}
                    onOrderGeneration={handleOrderGeneration}
                  />
                </div>

                {/* System Prompts - Two on top, one on bottom */}
                <div className="w-full max-w-5xl mx-auto mt-4 space-y-2 animate-in fade-in-0 slide-in-from-bottom-8 duration-700 delay-400">
                  {/* Top row - two prompts side by side */}
                  <div className="flex flex-wrap gap-4 justify-center w-full">
                    <button
                      onClick={() =>
                        handleSuggestionClick(
                          "Re-order 100 units of black essential hoody XXL"
                        )
                      }
                      className="px-6 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors backdrop-blur whitespace-nowrap"
                    >
                      "Re-order 100 units of black essential hoody XXL"
                    </button>
                    <button
                      onClick={() =>
                        handleSuggestionClick(
                          "Help me create a new forecast for SS25"
                        )
                      }
                      className="px-6 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors backdrop-blur whitespace-nowrap"
                    >
                      "Help me create a new forecast for SS25"
                    </button>
                  </div>
                  {/* Bottom row - prompts */}
                  <div className="flex flex-wrap gap-4 justify-center">
                    <button
                      onClick={() =>
                        handleSuggestionClick(
                          "Identify stockouts across our best catagories and calculate missed sales"
                        )
                      }
                      className="px-6 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors backdrop-blur whitespace-nowrap"
                    >
                      "Identify stockouts across our best catagories and
                      calculate missed sales"
                    </button>
                  </div>
                </div>
              </div>
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

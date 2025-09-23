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
import { extractMessageFromParams } from "@/utils/navigationUtils";
import { Bell, Check, ClipboardList, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
interface DashboardProps {
  onNavigateToConversation?: (message: string) => void;
}
const Dashboard = ({ onNavigateToConversation }: DashboardProps) => {
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingOrderSummary, setIsLoadingOrderSummary] = useState(false);
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [showStreamingConversation, setShowStreamingConversation] =
    useState(false);
  const [showOrderGeneration, setShowOrderGeneration] = useState(false);

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
  useEffect(() => {
    // "Dashboard useEffect running");
    const checkUser = async () => {
      // Auth disabled - using mock user
      const mockUser = {
        email: "demo@gympluscoffee.com",
      };
      setCurrentUser({
        name: mockUser.email?.split("@")[0] || "User",
        email: mockUser.email || "",
      });
    };
    checkUser();
  }, [navigate]);

  // Handle initial message from URL parameters - RUN IMMEDIATELY
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const messageParam = urlParams.get("message");

    if (currentUser && messageParam) {
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
  }, [currentUser, searchParams, setSearchParams, toast]);

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
  const handleLogout = async () => {
    // Auth disabled - mock logout
    console.log("Mock logout - auth disabled");
    // No actual logout or redirect needed
  };
  const notifyComingSoon = (feature: string) => {
    toast({
      title: "Coming soon",
      description: `${feature} isn't available yet.`,
    });
  };
  const handleQuickActionClick = (action: string) => {
    notifyComingSoon(action);
  };
  const handlePOGenerationComplete = () => {
    setIsGeneratingPO(false);
    notifyComingSoon("Purchase order generation");
  };
  const handleChatSubmit = (query: string) => {
    console.log("🎯 handleChatSubmit called with query:", query);
    // Show ChatInterface to display the user's message first
    setSearchQuery(query);
    setShowChatInterface(true);
    setShowStreamingConversation(false);
    setShowOrderGeneration(false);
  };

  // Ces gestionnaires ne sont plus nécessaires car on utilise le store de conversation
  const handleOrderGeneration = (query: string) => {
    // For replenishment orders, use the ChatInterface with sophisticated parsing
    if (query.toLowerCase().includes("replenishment")) {
      setSearchQuery(query);
      setShowChatInterface(true);
      setShowOrderGeneration(false);
    } else {
      // For simple orders, show the basic order generation interface
      setSearchQuery(query);
      setShowOrderGeneration(true);
      setShowChatInterface(false);
    }
  };
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    handleChatSubmit(suggestion);
  };
  const handleOpenOrdersClick = () => {
    notifyComingSoon("Open orders dashboard");
  };
  const handleQuotesClick = () => {
    notifyComingSoon("Quotes dashboard");
  };
  const handleApprovalsClick = () => {
    notifyComingSoon("Approvals workflow");
  };
  const handleNotificationsClick = () => {
    notifyComingSoon("Notifications center");
  };
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

  const handleNewQuery = () => {
    // Reset all chat-related states to return to main dashboard prompt box
    setShowChatInterface(false);
    setShowStreamingConversation(false);
    setShowOrderGeneration(false);
    setSearchQuery("");
    setIsLoadingOrderSummary(false);
    setIsGeneratingPO(false);

    conversation.clearConversation();
  };

  if (!currentUser) return null;
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
                    Processing your order request: "{searchQuery}"
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
                initialQuery={searchQuery}
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

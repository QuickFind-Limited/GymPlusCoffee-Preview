import AppSidebar from '@/components/dashboard/AppSidebar';
import ChatInterface from '@/components/dashboard/ChatInterface';
import Header from '@/components/dashboard/Header';
import SearchBar from '@/components/dashboard/SearchBar';
import StreamingConversation from '@/components/dashboard/StreamingConversation';
import PurchaseOrderGenerationTransition from '@/components/PurchaseOrderGenerationTransition';
import PurchaseOrderPDFView from '@/components/PurchaseOrderPDFView';
import { ClarificationPreview } from '@/components/clarifications/ClarificationPreview';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useConversation } from '@/contexts/ConversationContext';
import { useToast } from '@/hooks/use-toast';
import {
  apiStreamingService,
  StreamEvent,
  StreamEventData,
} from '@/services/apiStreaming';
import {
  respondClarifications,
  suggestClarifications,
} from '@/services/clarificationService';
import { ClarificationSessionState } from '@/types/clarifications';
import { extractMessageFromParams } from '@/utils/navigationUtils';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';

interface DashboardProps {
  onNavigateToConversation?: (message: string) => void;
}

const CRITICAL_REQUIREMENTS = `CURRENT DATE: Thursday, September 18, 2025

CRITICAL REQUIREMENTS FOR ALL RESPONSES:
1. When creating a Purchase Order, your FINAL message MUST start with "Purchase Order #PO-2025-XXXX has been created"
2. ALWAYS use September 18, 2025 as today's date for any date calculations
3. PO numbers follow the format PO-2025-XXXX
`;

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

  const [clarificationState, setClarificationState] = useState<ClarificationSessionState | null>(null);
  const [clarificationSessionId, setClarificationSessionId] = useState<string | null>(null);
  const [clarificationSelections, setClarificationSelections] = useState<Record<string, string[]>>({});
  const [clarificationLoading, setClarificationLoading] = useState(false);
  const [clarificationError, setClarificationError] = useState<string | null>(null);

  const conversation = useConversation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useUser();
  const { signOut } = useAuth();

  const hasClarificationOutput = useMemo(() => {
    if (clarificationLoading || clarificationError) return true;
    if (!clarificationState) return false;
    return (
      clarificationState.pending.length > 0 ||
      Object.keys(clarificationState.auto_applied).length > 0 ||
      Object.keys(clarificationState.resolved_context).length > 0
    );
  }, [clarificationLoading, clarificationError, clarificationState]);

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

  const resetClarificationUI = () => {
    setClarificationState(null);
    setClarificationSessionId(null);
    setClarificationSelections({});
    setClarificationError(null);
    setClarificationLoading(false);
  };

  const composePromptWithContext = (
    query: string,
    state: ClarificationSessionState
  ): string => {
    const entries = Object.entries(state.resolved_context);
    if (!entries.length) return query;

    const defaultKeys = new Set(Object.keys(state.auto_applied));
    const contextLines = entries.map(([key, value]) => {
      const source = defaultKeys.has(key) ? 'default' : 'user';
      return `- ${key}: ${value} (${source})`;
    });

    return `${query}\n\nClarification context:\n${contextLines.join('\n')}`;
  };

  const startStreaming = async (
    query: string,
    state: ClarificationSessionState
  ) => {
    const finalPrompt = composePromptWithContext(query, state);

    conversation.setIsStreaming(true);
    setShowStreamingConversation(true);
    setShowChatInterface(false);

    const options = {
      prompt: finalPrompt,
      model: 'claude-sonnet-4-20250514',
      max_turns: 30,
      session_id: conversation.sessionId || undefined,
      system_prompt: CRITICAL_REQUIREMENTS + (conversation.systemPrompt.trim() || ''),
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

  const evaluateClarifications = async (query: string) => {
    if (!query.trim()) {
      resetClarificationUI();
      return;
    }

    setClarificationError(null);
    setClarificationLoading(true);

    try {
      const sessionState = await suggestClarifications({ user_query: query });
      setClarificationSessionId(sessionState.session_id);
      setClarificationState(sessionState);

      setClarificationSelections((prev) => {
        const pendingIds = new Set(sessionState.pending.map((item) => item.question_id));
        const next: Record<string, string[]> = {};
        Object.entries(prev).forEach(([qid, values]) => {
          if (pendingIds.has(qid)) {
            next[qid] = values;
          }
        });
        return next;
      });

      if (sessionState.status === 'ready') {
        await startStreaming(query, sessionState);
      }
    } catch (error) {
      setClarificationError(
        error instanceof Error
          ? error.message
          : 'Failed to evaluate clarification questions'
      );
    } finally {
      setClarificationLoading(false);
    }
  };

  const handleChatSubmit = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setActiveQuery(trimmed);
    setSearchQuery('');
    setShowChatInterface(true);
    setShowStreamingConversation(false);
    setShowOrderGeneration(false);

    conversation.addUserMessage(trimmed);
    conversation.setIsStreaming(false);

    resetClarificationUI();
    await evaluateClarifications(trimmed);
  };

  const handleSelectionChange = (questionId: string, values: string[]) => {
    setClarificationSelections((prev) => ({ ...prev, [questionId]: values }));
  };

  const handleClarificationSubmit = async () => {
    if (!clarificationState || !clarificationSessionId) return;
    const unanswered = clarificationState.pending.filter(
      (item) => !clarificationSelections[item.question_id] || clarificationSelections[item.question_id].length === 0
    );

    if (unanswered.length > 0) {
      toast({
        title: 'More details needed',
        description: `Please complete: ${unanswered.map((item) => item.clarification_question).join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    setClarificationLoading(true);

    try {
      const answers = clarificationState.pending.map((item) => ({
        question_id: item.question_id,
        selected_values: clarificationSelections[item.question_id] || [],
      }));

      const sessionState = await respondClarifications({
        session_id: clarificationSessionId,
        answers,
      });

      setClarificationState(sessionState);
      setClarificationSessionId(sessionState.session_id);
      setClarificationSelections((prev) => {
        const next: Record<string, string[]> = {};
        sessionState.pending.forEach((item) => {
          if (prev[item.question_id]) {
            next[item.question_id] = prev[item.question_id];
          }
        });
        return next;
      });

      if (sessionState.status === 'ready') {
        await startStreaming(activeQuery, sessionState);
      }
    } catch (error) {
      setClarificationError(
        error instanceof Error
          ? error.message
          : 'Failed to submit clarification answers'
      );
    } finally {
      setClarificationLoading(false);
    }
  };

  const handleAcceptDefaults = async () => {
    if (!clarificationSessionId) return;
    setClarificationLoading(true);
    try {
      const sessionState = await respondClarifications({
        session_id: clarificationSessionId,
        accept_defaults: true,
      });
      setClarificationState(sessionState);
      if (sessionState.status === 'ready') {
        await startStreaming(activeQuery, sessionState);
      }
    } catch (error) {
      setClarificationError(
        error instanceof Error
          ? error.message
          : 'Failed to accept defaults'
      );
    } finally {
      setClarificationLoading(false);
    }
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
    resetClarificationUI();
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




  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-100 dark:bg-black">
        <AppSidebar onLogout={handleLogout} onNewQuery={handleNewQuery} />
        <SidebarInset>
          <Header />

          <main className="flex-1 flex flex-col px-4 py-4">
            {hasClarificationOutput && (
              <ClarificationPreview
                session={clarificationState}
                loading={clarificationLoading}
                error={clarificationError}
                selections={clarificationSelections}
                onChange={handleSelectionChange}
                onSubmit={handleClarificationSubmit}
                onAcceptDefaults={handleAcceptDefaults}
              />
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

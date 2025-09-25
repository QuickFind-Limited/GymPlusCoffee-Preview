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
import {
  respondClarifications,
  suggestClarifications,
} from '@/services/clarificationService';
import { ClarificationSessionState, ClarificationSuggestion } from '@/types/clarifications';
import { extractMessageFromParams } from '@/utils/navigationUtils';
import { Bell, Check, ClipboardList, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';

interface DashboardProps {
  onNavigateToConversation?: (message: string) => void;
}

const CLARIFIERS_ENABLED = false;
const THINK_OUT_LOUD_STORAGE_KEY = 'gpc_think_out_loud_enabled';

interface ClarificationAnswerPayload {
  questionId: string;
  questionText: string;
  source: 'default' | 'user';
  values: string[];
}

type RawClarificationState = ClarificationSessionState & {
  suggestions?: ClarificationSuggestion[];
  evaluated_at?: string;
};

const normalizeClarificationState = (
  state: RawClarificationState
): ClarificationSessionState => {
  const rawPending = Array.isArray(state.pending)
    ? state.pending
    : Array.isArray(state.suggestions)
      ? state.suggestions
      : [];

  const pending = rawPending.filter(Boolean);
  const autoApplied = state.auto_applied ?? {};
  const resolvedContext = state.resolved_context ?? {};
  const answers = state.answers ?? {};
  const matchedIds = state.matched_question_ids ?? [];
  const status = state.status ?? (pending.length > 0 ? 'pending' : 'ready');
  const sessionId = state.session_id ?? state.evaluated_at ?? `local-${Date.now()}`;

  const { suggestions, ...rest } = state;

  return {
    ...rest,
    session_id: sessionId,
    status,
    pending,
    auto_applied: autoApplied,
    resolved_context: resolvedContext,
    answers,
    matched_question_ids: matchedIds,
  };
};

const formatList = (values: string[]): string => {
  if (values.length === 0) return '';
  if (values.length === 1) return values[0];
  const head = values.slice(0, -1).join(', ');
  const tail = values[values.length - 1];
  return `${head} and ${tail}`;
};

const createEmptyClarificationState = (
  query: string
): ClarificationSessionState => ({
  session_id: `local-${Date.now()}`,
  original_query: query,
  auto_applied: {},
  answers: {},
  pending: [],
  matched_question_ids: [],
  resolved_context: {},
  status: 'ready',
  updated_at: new Date().toISOString(),
});

const buildClarificationAnswers = (
  state: ClarificationSessionState,
  questionTextMap: Record<string, string>
): ClarificationAnswerPayload[] => {
  const resolvedContext = state.resolved_context ?? {};
  const autoApplied = state.auto_applied ?? {};
  const answers = new Map<string, ClarificationAnswerPayload>();

  const registerEntry = (
    questionId: string,
    rawValue: string,
    source: 'default' | 'user'
  ) => {
    const trimmedRaw = rawValue.trim();
    if (!trimmedRaw) {
      return;
    }

    const questionText =
      questionTextMap[questionId] ||
      (state.pending ?? []).find((item) => item.question_id === questionId)?.clarification_question ||
      questionId;

    const values = trimmedRaw
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    answers.set(questionId, {
      questionId,
      questionText,
      source,
      values: values.length > 0 ? values : [trimmedRaw],
    });
  };

  Object.entries(autoApplied).forEach(([questionId, rawValue]) => {
    registerEntry(questionId, rawValue, 'default');
  });

  Object.entries(resolvedContext).forEach(([questionId, rawValue]) => {
    registerEntry(questionId, rawValue, 'user');
  });

  return Array.from(answers.values());
};

const rewriteQueryWithClarifications = (
  query: string,
  answers: ClarificationAnswerPayload[]
): string => {
  if (!answers.length) {
    return query;
  }

  const departmentsEntry = answers.find((answer) =>
    answer.questionText.toLowerCase().includes('department')
  );
  const locationsEntry = answers.find((answer) => {
    const text = answer.questionText.toLowerCase();
    return text.includes('location') || text.includes('store');
  });

  const departments = departmentsEntry ? departmentsEntry.values : [];
  const locations = locationsEntry ? locationsEntry.values : [];

  let rewritten = query;

  if (locations.length > 0) {
    const locationList = formatList(locations);
    rewritten = rewritten.replace(
      /in each retail store/gi,
      `in ${locationList} retail store${locations.length > 1 ? 's' : ''}`
    );
  }

  if (departments.length > 0) {
    const departmentList = formatList(departments);
    if (/all departments/gi.test(rewritten)) {
      rewritten = rewritten.replace(/all departments/gi, departmentList);
    } else {
      rewritten = rewritten.replace(
        /(retail store(?:s)?)/gi,
        `$1 across the departments ${departmentList}`
      );
    }
  }

  return rewritten;
};

const composePromptWithContext = (
  query: string,
  answers: ClarificationAnswerPayload[]
): string => {
  if (answers.length === 0) {
    return query;
  }

  const clarificationJson = JSON.stringify(
    answers.map((answer) => ({
      question_id: answer.questionId,
      question_text: answer.questionText,
      source: answer.source,
      values: answer.values,
    })),
    null,
    2
  );

  return `${query}

Only use the values provided inside clarification_answers. If you cannot honour them, ask the user for more information before proceeding.

clarification_answers = ${clarificationJson}`;
};

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
  const [clarificationQueue, setClarificationQueue] = useState<ClarificationSuggestion[]>([]);
  const [clarificationLoading, setClarificationLoading] = useState(false);
  const [clarificationError, setClarificationError] = useState<string | null>(null);
  const [clarificationQuestionText, setClarificationQuestionText] = useState<Record<string, string>>({});

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

  const resetClarificationUI = () => {
    setClarificationState(null);
    setClarificationSessionId(null);
    setClarificationSelections({});
    setClarificationQueue([]);
    setClarificationError(null);
    setClarificationLoading(false);
    setClarificationQuestionText({});
  };

  const startStreaming = async (
    query: string,
    state: ClarificationSessionState
  ) => {
    const pendingMap = Object.fromEntries(
      (state.pending ?? []).map((item) => [item.question_id, item.clarification_question])
    );
    const questionTextMap = { ...clarificationQuestionText, ...pendingMap };
    const clarificationAnswers = buildClarificationAnswers(state, questionTextMap);
    const rewrittenQuery = rewriteQueryWithClarifications(query, clarificationAnswers);
    const finalPrompt = composePromptWithContext(rewrittenQuery, clarificationAnswers);

    conversation.setIsStreaming(true);
    setShowStreamingConversation(true);
    setShowChatInterface(false);

    const options = {
      prompt: finalPrompt,
      model: 'claude-sonnet-4-20250514',
      max_turns: 30,
      session_id: conversation.sessionId || undefined,
      system_prompt: conversation.systemPrompt.trim() || '',
    };

    try {
      console.log('🚀 Streaming start', {
        originalQuery: query,
        rewrittenQuery,
        clarificationAnswers,
      });
      console.log('🧾 Streaming options', options);
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
    if (!CLARIFIERS_ENABLED) {
      return;
    }

    if (!query.trim()) {
      resetClarificationUI();
      return;
    }

    setClarificationError(null);
    setClarificationLoading(true);

    try {
      const rawState = await suggestClarifications({ user_query: query });
      console.log('🔍 Clarification suggest response:', rawState);
      const sessionState = normalizeClarificationState(rawState);
      const nextSessionId = sessionState.session_id ?? `local-${Date.now()}`;
      setClarificationSessionId(nextSessionId);
      setClarificationState(sessionState);
      const pendingQuestions = sessionState.pending ?? [];
      setClarificationQueue(pendingQuestions);
      setClarificationQuestionText((prev) => ({
        ...prev,
        ...Object.fromEntries(
          pendingQuestions.map((item) => [item.question_id, item.clarification_question])
        ),
      }));

      setClarificationSelections((prev) => {
        const pendingQuestions = sessionState.pending ?? [];
        const pendingIds = new Set(pendingQuestions.map((item) => item.question_id));
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

    const displayQuery = renderDisplayQuery(trimmed);
    const streamingQuery = buildStreamingQuery(trimmed);

    setActiveQuery(displayQuery);
    setSearchQuery('');
    setShowChatInterface(false);
    setShowStreamingConversation(true);
    setShowOrderGeneration(false);

    conversation.addUserMessage(displayQuery);
    conversation.setIsStreaming(true);

    resetClarificationUI();

    if (!CLARIFIERS_ENABLED) {
      const emptyState = createEmptyClarificationState(streamingQuery);
      void startStreaming(streamingQuery, emptyState);
      return;
    }

    setTimeout(() => {
      conversation.setIsStreaming(false);
      void evaluateClarifications(streamingQuery);
    }, 3000);
  };

  const handleSelectionChange = (questionId: string, values: string[]) => {
    setClarificationSelections((prev) => ({ ...prev, [questionId]: values }));
  };

  const activeClarification = clarificationQueue.length > 0 ? clarificationQueue[0] : null;

  const advanceLocalClarification = async (selectedValues: string[]) => {
    if (!clarificationState || !activeClarification) return;

    const nextQueue = clarificationQueue.slice(1);
    const resolvedValue = selectedValues.length
      ? selectedValues.join(', ')
      : 'defaults accepted';

    const updatedState: ClarificationSessionState = {
      ...clarificationState,
      pending: nextQueue,
      resolved_context: {
        ...(clarificationState.resolved_context ?? {}),
        [activeClarification.question_id]: resolvedValue,
      },
      answers: {
        ...(clarificationState.answers ?? {}),
        [activeClarification.question_id]: selectedValues,
      },
      status: nextQueue.length > 0 ? 'pending' : 'ready',
    };

    setClarificationQuestionText((prev) => ({
      ...prev,
      [activeClarification.question_id]: activeClarification.clarification_question,
    }));
    setClarificationState(updatedState);
    setClarificationQueue(nextQueue);
    setClarificationSelections((prev) => {
      const { [activeClarification.question_id]: _, ...rest } = prev;
      return rest;
    });
    setClarificationSessionId((prev) => prev ?? `local-${Date.now()}`);
    setClarificationError(null);

    if (nextQueue.length === 0) {
      await startStreaming(activeQuery, updatedState);
    }
  };

  const handleClarificationSubmit = async () => {
    if (!clarificationState) {
      return;
    }

    if (!activeClarification) {
      if (clarificationState.status === 'ready') {
        await startStreaming(activeQuery, clarificationState);
      }
      return;
    }

    let ensuredSessionId = clarificationSessionId;
    if (!ensuredSessionId) {
      ensuredSessionId = `local-${Date.now()}`;
      setClarificationSessionId(ensuredSessionId);
    }
    const isLocalSession = ensuredSessionId.startsWith('local-');

    const selected = clarificationSelections[activeClarification.question_id] || [];
    const requiresInteraction = activeClarification.selector.kind !== 'none';

    if (requiresInteraction && selected.length === 0) {
      toast({
        title: 'More details needed',
        description: 'Please choose at least one option to continue.',
        variant: 'destructive',
      });
      return;
    }

    setClarificationLoading(true);

    try {
      if (isLocalSession) {
        await advanceLocalClarification(requiresInteraction ? selected : []);
        return;
      }

      const answers = [
        {
          question_id: activeClarification.question_id,
          selected_values: requiresInteraction ? selected : [],
        },
      ];

      const rawState = await respondClarifications({
        session_id: ensuredSessionId,
        answers,
      });
      console.log('📝 Clarification respond response:', rawState);
      const sessionState = normalizeClarificationState(rawState);
      const answeredIds = new Set(Object.keys(sessionState.answers ?? {}));
      const nextSessionId = sessionState.session_id ?? ensuredSessionId;

      const pendingFromServer = sessionState.pending ?? [];
      const pending = pendingFromServer.filter(
        (item) => !answeredIds.has(item.question_id)
      );
      const sanitizedState: ClarificationSessionState = {
        ...sessionState,
        pending,
        status: pending.length === 0 ? 'ready' : sessionState.status,
      };

      setClarificationState(sanitizedState);
      setClarificationSessionId(nextSessionId);
      setClarificationQueue(pending);
      setClarificationQuestionText((prev) => ({
        ...prev,
        ...Object.fromEntries(
          pending.map((item) => [item.question_id, item.clarification_question])
        ),
      }));
      setClarificationSelections((prev) => {
        const remaining = { ...prev };
        answeredIds.forEach((id) => {
          delete remaining[id];
        });
        const next: Record<string, string[]> = {};
        pending.forEach((item) => {
          if (remaining[item.question_id]) {
            next[item.question_id] = remaining[item.question_id];
          }
        });
        return next;
      });

      if (pending.length === 0 || sanitizedState.status === 'ready') {
        await startStreaming(activeQuery, sanitizedState);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('404')) {
        console.warn('Clarification respond endpoint missing, falling back to local flow');
        await advanceLocalClarification(requiresInteraction ? selected : []);
        return;
      }
      setClarificationError(
        error instanceof Error ? error.message : 'Failed to submit clarification answers'
      );
    } finally {
      setClarificationLoading(false);
    }
  };

  const handleAcceptDefaults = async () => {
    if (!clarificationState || !activeClarification) return;

    const defaults = Object.values(activeClarification.defaults_applied ?? {});
    let ensuredSessionId = clarificationSessionId;
    if (!ensuredSessionId) {
      ensuredSessionId = `local-${Date.now()}`;
      setClarificationSessionId(ensuredSessionId);
    }
    const isLocalSession = ensuredSessionId.startsWith('local-');

    setClarificationLoading(true);

    try {
      if (isLocalSession) {
        await advanceLocalClarification(defaults);
        return;
      }

      const rawState = await respondClarifications({
        session_id: ensuredSessionId,
        accept_defaults: true,
      });
      console.log('✅ Clarification accept-defaults response:', rawState);
      const sessionState = normalizeClarificationState(rawState);
      const answeredIds = new Set(Object.keys(sessionState.answers ?? {}));
      const nextSessionId = sessionState.session_id ?? ensuredSessionId;
      const pendingFromServer = sessionState.pending ?? [];
      const pending = pendingFromServer.filter(
        (item) => !answeredIds.has(item.question_id)
      );
      const sanitizedState: ClarificationSessionState = {
        ...sessionState,
        pending,
        status: pending.length === 0 ? 'ready' : sessionState.status,
      };
      setClarificationState(sanitizedState);
      setClarificationSessionId(nextSessionId);
      setClarificationQueue(pending);
      setClarificationQuestionText((prev) => ({
        ...prev,
        ...Object.fromEntries(
          pending.map((item) => [item.question_id, item.clarification_question])
        ),
      }));
      setClarificationSelections((prev) => {
        const remaining = { ...prev };
        answeredIds.forEach((id) => {
          delete remaining[id];
        });
        const next: Record<string, string[]> = {};
        pending.forEach((item) => {
          if (remaining[item.question_id]) {
            next[item.question_id] = remaining[item.question_id];
          }
        });
        return next;
      });
      if (pending.length === 0 || sanitizedState.status === 'ready') {
        await startStreaming(activeQuery, sanitizedState);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('404')) {
        console.warn('Clarification accept-defaults endpoint missing, falling back to local flow');
        await advanceLocalClarification(defaults);
        return;
      }
      setClarificationError(
        error instanceof Error
          ? error.message
          : 'Failed to accept defaults'
      );
    } finally {
      setClarificationLoading(false);
    }
  };

  const clarificationSummary = clarificationState &&
    Object.keys(clarificationState.resolved_context ?? {}).length > 0
      ? {
          resolvedContext: clarificationState.resolved_context ?? {},
          autoApplied: clarificationState.auto_applied ?? {},
        }
      : null;

  const clarificationCard = activeClarification && clarificationState
    ? {
        suggestion: activeClarification,
        selectedValues:
          clarificationSelections[activeClarification.question_id] || [],
        onChange: (values: string[]) =>
          handleSelectionChange(activeClarification.question_id, values),
        onSubmit: handleClarificationSubmit,
        onAcceptDefaults:
          clarificationSessionId &&
          (Object.keys(clarificationState.auto_applied ?? {}).length > 0 ||
            Object.keys(activeClarification.defaults_applied ?? {}).length > 0)
            ? handleAcceptDefaults
            : undefined,
        showAcceptDefaults:
          (Object.keys(clarificationState.auto_applied ?? {}).length > 0 ||
            Object.keys(activeClarification.defaults_applied ?? {}).length > 0) &&
          Boolean(clarificationSessionId),
        showResolvedContext: false,
        autoApplied: clarificationState.auto_applied ?? {},
        defaultsApplied: activeClarification.defaults_applied ?? {},
        resolvedContext: clarificationState.resolved_context ?? {},
        loading: clarificationLoading,
        disableInputs: clarificationLoading,
      }
    : null;

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
            {clarificationError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                {clarificationError}
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
                  clarificationSummary={clarificationSummary}
                  clarificationCard={clarificationCard}
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
                  Streaming conversation context appears here once clarifications are satisfied.
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

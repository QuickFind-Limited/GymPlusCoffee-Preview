import FilePreviewSheet from "@/components/FilePreviewSheet";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import ClarificationQuestionCard, { ClarificationQuestionCardProps } from "@/components/clarifications/ClarificationQuestionCard";
import ClarificationResolvedContext, { ClarificationResolvedContextProps } from "@/components/clarifications/ClarificationResolvedContext";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StreamEvent, apiStreamingService } from "@/services/apiStreaming";
import { authorizedFetch } from "@/services/authorizedFetch";
import {
  Activity,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  MessageSquare,
  Paperclip,
  User,
  Zap,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import SearchBar from "./SearchBar";

import { API_ROOT_URL } from '@/config/api';

const API_BASE = API_ROOT_URL;

interface ConversationMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface StreamingConversationProps {
  className?: string;
  events?: StreamEvent[];
  isStreaming?: boolean;
  conversationMessages?: ConversationMessage[];
  onStreamingEvent?: (event: StreamEvent) => void;
  onStreamingStart?: () => void;
  onStreamingEnd?: (finalResponse?: string) => void;
  onStreamingError?: (error: Error) => void;
  clarificationSummary?: ClarificationResolvedContextProps | null;
  clarificationCard?: ClarificationQuestionCardProps | null;
  onSubmit?: (query: string) => void | Promise<void>;
  thinkOutLoudEnabled?: boolean;
  onToggleThinkOutLoud?: (enabled: boolean) => void;
}

// Function to detect and strip JSON blocks from content
const stripJsonBlocks = (content: string): string => {
  // First, remove phrases that introduce JSON
  let cleaned = content
    .replace(/Here'?s? (?:the |a )?structured (?:JSON )?response.*?:?\s*/gi, '')
    .replace(/Based on my analysis, here'?s? a structured response.*?:?\s*/gi, '')
    .replace(/Now let me prepare a structured response.*?:?\s*/gi, '')
    .replace(/Based on my analysis, I can now provide a structured response.*?\.\s*/gi, '')
    .replace(/```json\s*/gi, '') // Remove json code fence markers
    .replace(/```\s*/g, '') // Remove any code fence markers
    .replace(/^\s*json\s*$/gm, ''); // Remove standalone "json" on its own line

  // More aggressive JSON removal - find anything that looks like JSON structure
  // Look for opening brace and try to find its matching closing brace
  let startIdx = cleaned.indexOf('{');
  while (startIdx !== -1) {
    // Check if this looks like JSON (has quotes around keys)
    const nextQuote = cleaned.indexOf('"', startIdx);
    const nextColon = cleaned.indexOf(':', startIdx);

    if (nextQuote > startIdx && nextQuote < startIdx + 50 && nextColon > nextQuote) {
      // This looks like JSON, find the end
      let braceCount = 0;
      let endIdx = startIdx;
      let inString = false;
      let escaped = false;

      for (let i = startIdx; i < cleaned.length; i++) {
        const char = cleaned[i];

        if (escaped) {
          escaped = false;
          continue;
        }

        if (char === '\\') {
          escaped = true;
          continue;
        }

        if (char === '"' && !escaped) {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === '{' || char === '[') braceCount++;
          if (char === '}' || char === ']') {
            braceCount--;
            if (braceCount === 0) {
              endIdx = i + 1;
              break;
            }
          }
        }
      }

      // Remove the JSON block
      if (endIdx > startIdx) {
        cleaned = cleaned.substring(0, startIdx) + cleaned.substring(endIdx);
      } else {
        // Couldn't find end, just move on
        startIdx = cleaned.indexOf('{', startIdx + 1);
      }
    } else {
      // Doesn't look like JSON, find next opening brace
      startIdx = cleaned.indexOf('{', startIdx + 1);
    }
  }

  // Also remove any orphaned JSON fragments (like lone commas or brackets)
  cleaned = cleaned
    .replace(/,\s*,+/g, ',') // Remove multiple commas
    .replace(/,\s*(?=[}\]])/g, '') // Remove trailing commas before closing brackets
    .replace(/^\s*[,\]}\s]+/gm, '') // Remove lines starting with orphaned punctuation
    .replace(/\n{3,}/g, '\n\n') // Clean up excessive newlines
    .trim();

  // Join short related sentences that are on separate lines
  // Look for patterns like "sentence. Let me X:" or "sentence. Now let me X:"
  cleaned = cleaned
    // Handle numbered lists - remove the numbers and join the lines
    .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list prefixes (1. 2. etc)
    .replace(/\.\s*\n+\s*(Let me|Now let me|I'll|I will|First,|Next,|Then,|Now I'll|Now I will)/g, '. $1')
    .replace(/\n+\s*(First,|Second,|Third,|Next,|Then,|Finally,)/g, '. $1') // Join transition words
    .replace(/:\s*\n+\s*([A-Z])/g, '. $1') // Replace colons at end of lines with periods
    .replace(/:\s*$/gm, '.') // Remove any remaining colons at end of lines
    .replace(/\n\n+/g, ' ') // Replace multiple newlines with space to join paragraphs
    .replace(/\s+/g, ' ') // Clean up multiple spaces
    .trim();

  return cleaned;
};

const StreamingConversation: React.FC<StreamingConversationProps> = ({
  className = "",
  events: propEvents = [],
  isStreaming: propIsStreaming = false,
  conversationMessages: propConversationMessages = [],
  onStreamingEvent,
  onStreamingStart,
  onStreamingEnd,
  onStreamingError,
  clarificationSummary = null,
  clarificationCard = null,
  onSubmit,
  thinkOutLoudEnabled = false,
  onToggleThinkOutLoud,
}) => {
  const [events, setEvents] = useState<StreamEvent[]>(propEvents);
  const [isStreaming, setIsStreaming] = useState(propIsStreaming);
  const [searchQuery, setSearchQuery] = useState("");
  const [conversationMessages, setConversationMessages] = useState<
    ConversationMessage[]
  >(propConversationMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [filePreview, setFilePreview] = useState<{
    sessionId: string;
    filename: string;
    displayName: string;
  } | null>(null);
  const [expandedWrappers, setExpandedWrappers] = useState<Set<string>>(new Set());

  // Keep optional callbacks referenced to avoid unused warnings even if not currently utilized
  void onStreamingEvent;
  void onStreamingEnd;
  void onStreamingError;

  type NormalizedTurnEvent = {
    event: StreamEvent;
    content: string;
    isTodo: boolean;
  };

  const isTodoLogEvent = (event: StreamEvent): boolean => {
    const dataType = typeof event.data?.type === "string" ? event.data.type.toLowerCase() : "";
    if (dataType === "todo_identified") {
      return true;
    }
    if (dataType === "tool_use") {
      const toolName = (event.data as any)?.tool_name;
      if (typeof toolName === "string" && toolName.toLowerCase() === "todowrite") {
        return true;
      }
    }
    const displays: Array<unknown> = [event.display, event.data?.display];
    return displays.some((value) =>
      typeof value === "string" && value.toLowerCase().includes("todo")
    );
  };

  const normalizeTodoDisplay = (value?: string): string => {
    if (!value) {
      return "";
    }
    return value
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
      .replace(/^\s*(todo update:|todo identified:)/i, "")
      .replace(/^\s*(todo:)/i, "")
      .replace(/^\s*(todo)/i, "")
      .trim();
  };

  const extractTodoContent = (event: StreamEvent): string => {
    const data = event.data as Record<string, unknown> | undefined;
    const candidates: Array<unknown> = [
      data?.todo_content,
      data?.input_summary,
      data?.result_summary,
      typeof event.display === "string" ? event.display : undefined,
      typeof data?.display === "string" ? (data?.display as string) : undefined,
      event.full_content,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "string") {
        const cleaned = normalizeTodoDisplay(candidate);
        if (cleaned) {
          const lower = cleaned.toLowerCase();
          if (lower === "managing task list" || lower === "todo list update" || lower === "todo update") {
            continue;
          }
          return cleaned;
        }
      }
    }
    return "";
  };

  // Calculate the index and timestamp of the last user message
  const lastUserMessageIndex = (() => {
    for (let i = conversationMessages.length - 1; i >= 0; i--) {
      if (conversationMessages[i].role === "user") return i;
    }
    return -1;
  })();
  const lastUserMessage =
    lastUserMessageIndex >= 0
      ? conversationMessages[lastUserMessageIndex]
      : null;
  const lastUserMessageId = lastUserMessage ? lastUserMessage.id : null;
  const lastUserMessageTimestamp: Date | null = lastUserMessage
    ? lastUserMessage.timestamp
    : null;

  // Limiter l'affichage des événements au tour courant (ceux postérieurs au dernier message utilisateur)
  const currentTurnEvents: StreamEvent[] = React.useMemo(() => {
    if (!lastUserMessageTimestamp) return events;
    const cutoff = lastUserMessageTimestamp.getTime();
    return events.filter((e) => {
      const t = new Date(e.timestamp).getTime();
      return !isNaN(t) && t >= cutoff;
    });
  }, [events, lastUserMessageTimestamp]);

  // Identifier un potentiel assistant_message d'événements à masquer quand la réponse finale arrive (tour courant)
  const latestFinalResponseIndex = (() => {
    for (let i = currentTurnEvents.length - 1; i >= 0; i--) {
      if (currentTurnEvents[i].type === "final_response") return i;
    }
    return -1;
  })();
  const assistantMessageToHideId = (() => {
    if (latestFinalResponseIndex < 0) return undefined;
    for (let i = latestFinalResponseIndex; i >= 0; i--) {
      const e = currentTurnEvents[i];
      if (
        e.type === "message" &&
        e.data?.type === "assistant_message" &&
        !!e.full_content
      ) {
        return e.id;
      }
    }
    return undefined;
  })();

  // Regrouper toutes les réponses finales par tour (ancrées au dernier message utilisateur précédent leur timestamp)
  const finalResponsesByUserId = React.useMemo(() => {
    const map = new Map<string, StreamEvent[]>();
    const userMessages = conversationMessages.filter((m) => m.role === "user");
    for (const e of events) {
      if (e.type !== "final_response") continue;
      const et = new Date(e.timestamp).getTime();
      if (isNaN(et)) continue;
      let anchorId: string | null = null;
      for (let i = 0; i < userMessages.length; i++) {
        const m = userMessages[i];
        const mt = m.timestamp.getTime();
        if (!isNaN(mt) && mt <= et) {
          anchorId = m.id;
        } else if (!isNaN(mt) && mt > et) {
          break;
        }
      }
      if (anchorId) {
        const arr = map.get(anchorId) || [];
        arr.push(e);
        map.set(anchorId, arr);
      }
    }
    return map;
  }, [events, conversationMessages]);

  const getEventIcon = (type: StreamEvent["type"]) => {
    switch (type) {
      case "connection":
        return <Zap className="h-3 w-3" />;
      case "message":
        return <MessageSquare className="h-3 w-3" />;
      case "log":
        return <Activity className="h-3 w-3" />;
      case "final_response":
        return <Bot className="h-3 w-3" />;
      default:
        return <div className="h-3 w-3 rounded-full bg-muted" />;
    }
  };

  const getEventBadgeVariant = (type: StreamEvent["type"]) => {
    switch (type) {
      case "connection":
        return "default" as const;
      case "message":
        return "secondary" as const;
      case "log":
        return "outline" as const;
      case "final_response":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const formatEventDisplay = (event: StreamEvent) => {
    const raw = event.display || "";
    if (event.data?.type === "tool_use" && typeof raw === "string") {
      return raw.replace(/mcp__netsuite_mcp__/g, "Request NetSuite: ");
    }
    return raw;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileDownload = async (
    sessionId: string | undefined,
    filename: string,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.preventDefault();
    }

    try {
      const url = `${API_BASE}/files/conversations/${encodeURIComponent(
        sessionId || ""
      )}/attachments/${encodeURIComponent(filename)}`;

      const response = await authorizedFetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const openFilePreview = (
    sessionId: string | undefined,
    pathOrName: string
  ) => {
    const id =
      sessionId || apiStreamingService.getCurrentSessionId() || undefined;
    if (!id) return;

    // Extract the filename from the path
    const name = pathOrName.split("/").pop() || pathOrName;

    // Set the file preview state to open the preview dialog
    setFilePreview({
      sessionId: id,
      filename: name,
      displayName: name
    });
  };

  useEffect(() => {
    setEvents(propEvents);
  }, [propEvents]);

  useEffect(() => {
    setConversationMessages(propConversationMessages);
  }, [propConversationMessages]);

  useEffect(() => {
    setIsStreaming(propIsStreaming);
  }, [propIsStreaming]);

  useEffect(() => {
    scrollToBottom();
  }, [events, conversationMessages]);

  const handleSubmit = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    try {
      if (onSubmit) {
        await onSubmit(trimmed);
      } else if (onStreamingStart) {
        onStreamingStart();
      }
    } finally {
      setSearchQuery("");
    }
  };


  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>

      {/* Messages and events */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {conversationMessages
            .filter((message, index) => {
              if (message.role !== "assistant") return true;

              // Detect the turn to which this assistant message belongs
              let prevUserIdx = -1;
              for (let i = index - 1; i >= 0; i--) {
                if (conversationMessages[i].role === "user") {
                  prevUserIdx = i;
                  break;
                }
              }
              if (prevUserIdx < 0) return true;

              // Is there a final response for this turn ?
              const hasFinalForTurn = (() => {
                // current turn
                if (prevUserIdx === lastUserMessageIndex) {
                  return currentTurnEvents.some(
                    (e) => e.type === "final_response"
                  );
                }
                // previous turns
                const prevUserId = conversationMessages[prevUserIdx]?.id;
                if (!prevUserId) return false;
                return (
                  (finalResponsesByUserId.get(prevUserId)?.length ?? 0) > 0
                );
              })();
              if (!hasFinalForTurn) return true;

              // Is this the LAST assistant message before the next user message ?
              let nextUserIdx = conversationMessages.length;
              for (let i = index + 1; i < conversationMessages.length; i++) {
                if (conversationMessages[i].role === "user") {
                  nextUserIdx = i;
                  break;
                }
              }
              const hasAssistantAfterInTurn = conversationMessages
                .slice(index + 1, nextUserIdx)
                .some((m) => m.role === "assistant");
              const isLastAssistantInTurn = !hasAssistantAfterInTurn;
              return !isLastAssistantInTurn;
            })
            .map((message) => {
              // Get the actual index in the original conversationMessages array
              const index = conversationMessages.findIndex(m => m.id === message.id);

              return (
              <React.Fragment key={message.id}>
                <div className="animate-fade-in">
                  {message.role === "user" ? (
                    <div className="flex items-start gap-3 justify-end">
                      <div className="flex-1 min-w-0 max-w-[85%]">
                        <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl p-4 ml-auto shadow-sm">
                          <div className="text-sm leading-relaxed">
                            {message.content}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 mr-2 text-right">
                          You • {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="flex-shrink-0 mt-1">
                        <User className="h-8 w-8 text-primary bg-primary/10 rounded-full p-1.5" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <Bot className="h-8 w-8 text-muted-foreground bg-muted/20 rounded-full p-1.5" />
                      </div>
                      <div className="flex-1 min-w-0 max-w-[85%]">
                        <div className="bg-background border rounded-2xl p-4 shadow-sm">
                          <MarkdownRenderer content={message.content} />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 ml-2">
                          Source • {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {message.role === "user" &&
                  clarificationSummary &&
                  lastUserMessageId &&
                  message.id === lastUserMessageId && (
                    <ClarificationResolvedContext
                      {...clarificationSummary}
                      className="mt-6"
                    />
                  )}

                {message.role === "user" &&
                  clarificationCard &&
                  lastUserMessageId &&
                  message.id === lastUserMessageId && (
                    <ClarificationQuestionCard {...clarificationCard} />
                  )}

                {/* Show intermediate assistant messages - first one as top-level wrapper containing subtasks */}
                {/* Show for all user messages that have events, not just the last one */}
                {message.role === "user" && (
                  (() => {

                    // Get events for this specific user message turn
                    const messageTimestamp = message.timestamp.getTime();

                    // Find the previous user message before the current one
                    let prevUserMessage = null;
                    for (let i = index - 1; i >= 0; i--) {
                      if (conversationMessages[i].role === "user") {
                        prevUserMessage = conversationMessages[i];
                        break;
                      }
                    }

                    // Find the next user message after the current one
                    let nextUserMessage = null;
                    for (let i = index + 1; i < conversationMessages.length; i++) {
                      if (conversationMessages[i].role === "user") {
                        nextUserMessage = conversationMessages[i];
                        break;
                      }
                    }


                    const nextUserTimestamp = nextUserMessage ? nextUserMessage.timestamp.getTime() : Date.now() + 1000000;


                    // Filter events that belong to this specific user message turn
                    // Events should be after this message but before the next user message
                    // For the second+ turn, we need to be more precise about filtering
                    const turnEvents = events.filter((e) => {
                      const eventTime = new Date(e.timestamp).getTime();

                      // For events, we need to be slightly more lenient with timing
                      // since they may arrive slightly before the user message is recorded
                      const eventStartTime = messageTimestamp - 1000; // Allow 1 second before
                      const inRange = eventTime >= eventStartTime && eventTime < nextUserTimestamp;

                      // Additional filtering for multi-turn conversations
                      if (inRange && prevUserMessage) {
                        const prevUserTime = prevUserMessage.timestamp.getTime();

                        // Skip events that are clearly from the previous turn
                        // Events from previous turns would be much closer to the previous user message
                        if (eventTime < messageTimestamp - 5000) {
                          // Event is more than 5 seconds before current message, likely from previous turn
                          return false;
                        }

                        // Also check if this event was created during the previous turn's response window
                        const prevTurnEndTime = messageTimestamp - 2000; // 2 seconds before current message
                        if (eventTime < prevTurnEndTime && eventTime > prevUserTime) {
                          // This event belongs to the previous turn
                          return false;
                        }
                      }

                      return inRange;
                    });



                    if (turnEvents.length === 0) {
                      return null;
                    }

                    // Only hide the last assistant message if this is the current turn and there's a final response
                    const shouldHideLastAssistant = message.id === lastUserMessageId && assistantMessageToHideId;

                    const normalizedAssistant: NormalizedTurnEvent[] = [];
                    const normalizedTodos: NormalizedTurnEvent[] = [];
                    const seenTodoContent = new Set<string>();

                    for (const event of turnEvents) {
                      if (
                        event.type === "message" &&
                        event.data?.type === "assistant_message" &&
                        !!event.full_content &&
                        !(shouldHideLastAssistant && event.id === assistantMessageToHideId)
                      ) {
                        normalizedAssistant.push({
                          event,
                          content: event.full_content,
                          isTodo: false,
                        });
                        continue;
                      }

                      if (event.type === "log" && isTodoLogEvent(event)) {
                        const content = extractTodoContent(event);
                        const key = content.trim().toLowerCase();
                        if (content && !seenTodoContent.has(key)) {
                          seenTodoContent.add(key);
                          normalizedTodos.push({
                            event,
                            content,
                            isTodo: true,
                          });
                        }
                      }
                    }

                    const normalizedEvents = [...normalizedAssistant, ...normalizedTodos].sort(
                      (a, b) =>
                        new Date(a.event.timestamp).getTime() -
                        new Date(b.event.timestamp).getTime()
                    );

                    if (normalizedEvents.length === 0) {
                      return null;
                    }

                    const firstAssistantIndex = normalizedEvents.findIndex((entry) => !entry.isTodo);
                    if (firstAssistantIndex > 0) {
                      const [firstAssistant] = normalizedEvents.splice(firstAssistantIndex, 1);
                      normalizedEvents.unshift(firstAssistant);
                    }

                    const [firstEvent, ...subtasks] = normalizedEvents;
                    const hasFinalResponse = turnEvents.some((e) => e.type === "final_response");
                    const wrapperId = `wrapper-${message.id}`;

                    const strippedFirstContent = stripJsonBlocks(firstEvent.content).trim();
                    const hasValidSubtasks = subtasks.some((task) =>
                      stripJsonBlocks(task.content).trim().length > 0
                    );

                    if (!strippedFirstContent && !hasValidSubtasks) {
                      return null; // Don't show empty wrapper
                    }

                    // Auto-expand while streaming for current turn, otherwise check stored state
                    const isCurrentTurn = message.id === lastUserMessageId;

                    const isExpanded = (isCurrentTurn && isStreaming) ||
                                      (isCurrentTurn && !hasFinalResponse) ||
                                      expandedWrappers.has(wrapperId);

                    const toggleExpanded = () => {
                      setExpandedWrappers(prev => {
                        const next = new Set(prev);
                        if (next.has(wrapperId)) {
                          next.delete(wrapperId);
                        } else {
                          next.add(wrapperId);
                        }
                        return next;
                      });
                    };

                    return (
                      <div className="animate-fade-in">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <Bot className="h-8 w-8 text-muted-foreground bg-muted/20 rounded-full p-1.5" />
                          </div>
                          <div className="flex-1 min-w-0 max-w-[85%]">
                            <div className="bg-background border rounded-2xl p-4 shadow-sm">
                              {/* Main content with toggle button */}
                              <div className="flex items-start gap-2">
                                {hasValidSubtasks && (
                                  <button
                                    onClick={toggleExpanded}
                                    className="flex-shrink-0 mt-1 text-muted-foreground hover:text-foreground transition-colors"
                                    title={isExpanded ? "Collapse details" : "Expand details"}
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </button>
                                )}
                                {strippedFirstContent && (
                                  <div className="flex-1">
                                    <MarkdownRenderer content={strippedFirstContent} />
                                  </div>
                                )}
                              </div>

                              {/* Subtasks inside the container - collapsible */}
                              {subtasks.length > 0 && isExpanded && (
                                <div className="mt-4 space-y-1">
                                  {subtasks.map((task, index) => {
                                    const strippedContent = stripJsonBlocks(task.content).trim();
                                    if (!strippedContent) return null; // Skip empty subtasks
                                    const isTodo = task.isTodo;
                                    const isLastStreamingSubtask =
                                      !isTodo &&
                                      isCurrentTurn &&
                                      isStreaming &&
                                      index === subtasks.length - 1;
                                    return (
                                      <div key={task.event.id || `subtask-${index}`} className="animate-fade-in pl-3">
                                        <div className="flex items-start gap-2">
                                          <div className="flex-shrink-0 mt-1">
                                            {/* Show spinner only if streaming and this is the last sub-task */}
                                            {isTodo ? (
                                              <ClipboardList className="h-4 w-4 text-amber-500" />
                                            ) : isLastStreamingSubtask ? (
                                              <div className="h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin [animation-duration:0.6s]" />
                                            ) : (
                                              <div className="h-3 w-3 bg-gray-300 dark:bg-gray-400 rounded-full flex items-center justify-center">
                                                <Check className="h-2 w-2 text-white stroke-[4]" />
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0 [&_*]:!text-[11px] text-muted-foreground">
                                            {isTodo && (
                                              <span className="uppercase tracking-wide text-[10px] font-medium text-amber-600 dark:text-amber-400 block mb-0.5">
                                                Action item
                                              </span>
                                            )}
                                            <MarkdownRenderer content={strippedContent} />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Show collapsed indicator */}
                              {hasValidSubtasks && !isExpanded && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  {subtasks.length} detail{subtasks.length > 1 ? 's' : ''} hidden
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 ml-2">
                              {firstEvent.isTodo ? 'Action item' : 'Assistant'} • {new Date(firstEvent.event.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* Show thinking indicator after the most recent message */}
                {lastUserMessageId &&
                  message.id === lastUserMessageId &&
                  isStreaming && (
                    <div className="animate-fade-in mt-6">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Thinking...
                        </span>
                        <div className="flex space-x-1 ml-2">
                          <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* last final response */}
                {lastUserMessageId &&
                  message.id === lastUserMessageId &&
                  currentTurnEvents
                    .filter((event) => event.type === "final_response")
                    .map((finalEvent, idx) => (
                      <div key={finalEvent.id} className="animate-fade-in">
                        {idx > 0 && (
                          <hr className="my-4 border-t border-border/60" />
                        )}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <Bot className="h-8 w-8 text-muted-foreground bg-muted/20 rounded-full p-1.5" />
                          </div>
                          <div className="flex-1 min-w-0 max-w-[85%]">
                            <div className="bg-background border rounded-2xl p-4 shadow-sm">
                              <MarkdownRenderer
                                content={
                                  finalEvent.full_content ||
                                  finalEvent.data.response ||
                                  ""
                                }
                              />

                              {(Array.isArray(finalEvent.data.attachments) &&
                                finalEvent.data.attachments.length > 0) ||
                              (Array.isArray(finalEvent.data.new_files) &&
                                finalEvent.data.new_files.length > 0) ||
                              (Array.isArray(finalEvent.data.updated_files) &&
                                finalEvent.data.updated_files.length > 0) ? (
                                <div className="mt-4 pt-3 border-t">
                                  {/* Attachments */}
                                  {Array.isArray(finalEvent.data.attachments) &&
                                    finalEvent.data.attachments.length > 0 && (
                                      <div className="mb-3">
                                        <ul className="space-y-1">
                                          {finalEvent.data.attachments.map(
                                            (att, idx) => {
                                              const name =
                                                att.path.split("/").pop() ||
                                                att.path;
                                              return (
                                                <li
                                                  key={`att-${idx}`}
                                                  className="flex items-center gap-2 text-sm"
                                                >
                                                  <Paperclip className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                                                  <a
                                                    href="#"
                                                    onClick={(e) =>
                                                      handleFileDownload(
                                                        finalEvent.data.session_id as string | undefined,
                                                        name,
                                                        e
                                                      )
                                                    }
                                                    className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:underline cursor-pointer"
                                                  >
                                                    {name}
                                                  </a>
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      openFilePreview(
                                                        finalEvent.data
                                                          .session_id as
                                                          | string
                                                          | undefined,
                                                        name
                                                      )
                                                    }
                                                    className="ml-2 px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 rounded transition-colors disabled:opacity-50"
                                                    disabled={
                                                      !finalEvent.data
                                                        .session_id
                                                    }
                                                  >
                                                    Preview
                                                  </button>
                                                </li>
                                              );
                                            }
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                </div>
                              ) : null}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 ml-2">
                              Assistant •{" "}
                              {new Date(
                                finalEvent.timestamp
                              ).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                {/* Final responses of previous turns (always visible) */}
                {lastUserMessageId &&
                  message.id !== lastUserMessageId &&
                  finalResponsesByUserId
                    .get(message.id)
                    ?.map((finalEvent, idx) => (
                      <div
                        key={`${finalEvent.id}-past`}
                        className="animate-fade-in"
                      >
                        {idx > 0 && (
                          <hr className="my-4 border-t border-border/60" />
                        )}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <Bot className="h-8 w-8 text-muted-foreground bg-muted/20 rounded-full p-1.5" />
                          </div>
                          <div className="flex-1 min-w-0 max-w-[85%]">
                            <div className="bg-background border rounded-2xl p-4 shadow-sm">
                              <MarkdownRenderer
                                content={
                                  finalEvent.full_content ||
                                  finalEvent.data.response ||
                                  ""
                                }
                              />

                              {Array.isArray(finalEvent.data.attachments) &&
                              finalEvent.data.attachments.length > 0 ? (
                                <div className="mt-4 pt-3 border-t">
                                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                                    <Paperclip className="h-4 w-4" />
                                    <span>Attachments</span>
                                  </div>

                                  <div className="mb-3">
                                    <ul className="space-y-1">
                                      {finalEvent.data.attachments.map(
                                        (att: any, idx: number) => {
                                          const name =
                                            (att.path || att.absolute_path || "")
                                              .toString()
                                              .split("/")
                                              .pop() ||
                                            att.path ||
                                            att.absolute_path ||
                                            `attachment-${idx + 1}`;
                                          return (
                                            <li
                                              key={`${name}-${idx}`}
                                              className="flex items-center gap-2 text-sm"
                                            >
                                              <FileText className="h-3.5 w-3.5 text-primary/80" />
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  openFilePreview(
                                                    finalEvent.data
                                                      .session_id as
                                                      | string
                                                      | undefined,
                                                    name
                                                  )
                                                }
                                                className="text-left text-gray-700 hover:text-gray-900 hover:underline dark:text-gray-300 dark:hover:text-gray-100 disabled:opacity-50"
                                                disabled={
                                                  !finalEvent.data.session_id
                                                }
                                                title={
                                                  finalEvent.data.session_id
                                                    ? "Click to preview"
                                                    : "Preview not available"
                                                }
                                              >
                                                {name}
                                              </button>
                                              {typeof att.size === "number" && (
                                                <span className="text-xs text-muted-foreground">
                                                  • {(
                                                    att.size / 1024
                                                  ).toFixed(1)} KB
                                                </span>
                                              )}
                                            </li>
                                          );
                                        }
                                      )}
                                    </ul>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 ml-2">
                              Assistant •{" "}
                              {new Date(
                                finalEvent.timestamp
                              ).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
              </React.Fragment>
            );
            })}

          {/* Étapes de progression actuelles */}
          {/* eslint-disable-next-line no-constant-condition, no-constant-binary-expression */}
          {false &&
            events.filter((e) => {
              const passesBaseFilter =
                e.type === "message" &&
                e.data?.type === "assistant_message" &&
                !!e.full_content;

              if (!passesBaseFilter) return false;

              // Cacher le dernier assistant_message quand la réponse finale est affichée
              if (
                e.type === "message" &&
                e.data?.type === "assistant_message" &&
                assistantMessageToHideId &&
                e.id === assistantMessageToHideId
              ) {
                return false;
              }
              return true;
            }).length > 0 && (
              <div className="animate-fade-in">
                {isStreaming && (
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Thinking...
                    </span>
                    <div className="flex space-x-1 ml-2">
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  {events
                    .filter((event) => {
                      const passesBaseFilter =
                        event.type === "message" &&
                        event.data?.type === "assistant_message" &&
                        !!event.full_content;

                      if (!passesBaseFilter) return false;

                      if (
                        event.type === "message" &&
                        event.data?.type === "assistant_message" &&
                        assistantMessageToHideId &&
                        event.id === assistantMessageToHideId
                      ) {
                        return false;
                      }

                      return true;
                    })
                    .map((event) => (
                      <div key={event.id} className="animate-fade-in">
                        {event.type === "connection" ? (
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {getEventIcon(event.type)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {event.display}
                            </div>
                            <div className="text-xs text-muted-foreground ml-auto">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                {getEventIcon(event.type)}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={getEventBadgeVariant(event.type)}
                                  className="text-xs"
                                >
                                  {event.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(
                                    event.timestamp
                                  ).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                            <div className="text-sm break-words ml-6">
                              {event.type === "message" && event.full_content
                                ? event.full_content
                                : event.type === "message"
                                ? "💬 Assistant"
                                : formatEventDisplay(event)}
                            </div>
                            {event.type === "log" &&
                              event.data?.type === "tool_use" &&
                              event.data?.details && (
                                <div className="ml-6 mt-2 p-3 bg-background rounded-lg border-l-2 border-primary">
                                  <div className="text-sm text-muted-foreground mb-1">
                                    Details
                                  </div>
                                  <div className="text-sm">
                                    <MarkdownRenderer
                                      content={
                                        typeof event.data.details === "string"
                                          ? (event.data.details as string)
                                          : "```json\n" +
                                            JSON.stringify(
                                              event.data.details,
                                              null,
                                              2
                                            ) +
                                            "\n```"
                                      }
                                    />
                                  </div>
                                </div>
                              )}
                            {event.type === "message" && event.full_content && (
                              <div className="ml-6 mt-2 p-3 bg-background rounded-lg border-l-2 border-primary">
                                <div className="text-sm">
                                  <MarkdownRenderer
                                    content={event.full_content || ""}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

          {/* Réponse finale - affichée après le bloc events */}
          {/* eslint-disable-next-line no-constant-condition, no-constant-binary-expression */}
          {false &&
            events
              .filter((event) => event.type === "final_response")
              .map((finalEvent, idx) => (
                <div key={finalEvent.id} className="animate-fade-in">
                  {idx > 0 && <hr className="my-4 border-t border-border/60" />}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <Bot className="h-8 w-8 text-muted-foreground bg-muted/20 rounded-full p-1.5" />
                    </div>
                    <div className="flex-1 min-w-0 max-w-[85%]">
                      <div className="bg-background border rounded-2xl p-4 shadow-sm">
                        <MarkdownRenderer
                          content={
                            finalEvent.full_content ||
                            finalEvent.data.response ||
                            ""
                          }
                        />

                        {/* eslint-disable-next-line no-constant-condition, no-constant-binary-expression */}
                        {false &&
                          ((Array.isArray(finalEvent.data.attachments) &&
                            finalEvent.data.attachments.length > 0) ||
                          (Array.isArray(finalEvent.data.new_files) &&
                            finalEvent.data.new_files.length > 0) ||
                          (Array.isArray(finalEvent.data.updated_files) &&
                            finalEvent.data.updated_files.length > 0)) ? (
                          <div className="mt-4 pt-3 border-t">
                            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                              <Paperclip className="h-4 w-4" />
                              <span>Generated files</span>
                              {finalEvent.data.file_changes_summary && (
                                <span className="text-xs text-muted-foreground">
                                  •{" "}
                                  {finalEvent.data.file_changes_summary
                                    .new_count ?? 0}{" "}
                                  new(s),{" "}
                                  {finalEvent.data.file_changes_summary
                                    .updated_count ?? 0}{" "}
                                  updated(s)
                                </span>
                              )}
                            </div>

                            {/* Pièces jointes */}
                            {Array.isArray(finalEvent.data.attachments) &&
                              finalEvent.data.attachments.length > 0 && (
                                <div className="mb-3">
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Pièces jointes
                                  </div>
                                  <ul className="space-y-1">
                                    {finalEvent.data.attachments.map(
                                      (att: any, idx: number) => {
                                        const name =
                                          (att.path || att.absolute_path || "")
                                            .toString()
                                            .split("/")
                                            .pop() ||
                                          att.path ||
                                          att.absolute_path ||
                                          `attachment-${idx + 1}`;
                                        return (
                                          <li
                                            key={`${name}-${idx}`}
                                            className="flex items-center gap-2 text-sm"
                                          >
                                            <FileText className="h-3.5 w-3.5 text-primary/80" />
                                            <button
                                              type="button"
                                              onClick={() =>
                                                openFilePreview(
                                                  finalEvent.data.session_id as
                                                    | string
                                                    | undefined,
                                                  name
                                                )
                                              }
                                              className="text-left text-gray-700 hover:text-gray-900 hover:underline dark:text-gray-300 dark:hover:text-gray-100 disabled:opacity-50"
                                              disabled={
                                                !finalEvent.data.session_id
                                              }
                                              title={
                                                finalEvent.data.session_id
                                                  ? "Open preview"
                                                  : "Session unavailable"
                                              }
                                            >
                                              {name}
                                            </button>
                                            {typeof att.size === "number" && (
                                              <span className="text-xs text-muted-foreground">
                                                • {(att.size / 1024).toFixed(1)}{" "}
                                                KB
                                              </span>
                                            )}
                                            {att.is_new && (
                                              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                                New
                                              </span>
                                            )}
                                            {att.is_updated && !att.is_new && (
                                              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                Updated
                                              </span>
                                            )}
                                          </li>
                                        );
                                      }
                                    )}
                                  </ul>
                                </div>
                              )}

                            {Array.isArray(finalEvent.data.new_files) &&
                              finalEvent.data.new_files.length > 0 && (
                                <div className="mb-3">
                                  <div className="text-xs text-muted-foreground mb-1">
                                    New files
                                  </div>
                                  <ul className="space-y-1">
                                    {finalEvent.data.new_files.map(
                                      (path: unknown, idx: number) => {
                                        const p = String(path);
                                        const name = p.split("/").pop() || p;
                                        return (
                                          <li
                                            key={`new-${idx}`}
                                            className="flex items-center gap-2 text-sm"
                                          >
                                            <FileText className="h-3.5 w-3.5 text-primary/80" />
                                            <button
                                              type="button"
                                              onClick={() =>
                                                openFilePreview(
                                                  finalEvent.data.session_id as
                                                    | string
                                                    | undefined,
                                                  name
                                                )
                                              }
                                              className="text-left text-gray-700 hover:text-gray-900 hover:underline dark:text-gray-300 dark:hover:text-gray-100 disabled:opacity-50"
                                              disabled={
                                                !finalEvent.data.session_id
                                              }
                                              title={
                                                finalEvent.data.session_id
                                                  ? "Open preview"
                                                  : "No session available"
                                              }
                                            >
                                              {name}
                                            </button>
                                          </li>
                                        );
                                      }
                                    )}
                                  </ul>
                                </div>
                              )}

                            {/* updated files */}
                            {Array.isArray(finalEvent.data.updated_files) &&
                              finalEvent.data.updated_files.length > 0 && (
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Updated files
                                  </div>
                                  <ul className="space-y-1">
                                    {finalEvent.data.updated_files.map(
                                      (path: unknown, idx: number) => {
                                        const p = String(path);
                                        const name = p.split("/").pop() || p;
                                        return (
                                          <li
                                            key={`upd-${idx}`}
                                            className="flex items-center gap-2 text-sm"
                                          >
                                            <FileText className="h-3.5 w-3.5 text-primary/80" />
                                            <button
                                              type="button"
                                              onClick={() =>
                                                openFilePreview(
                                                  finalEvent.data.session_id as
                                                    | string
                                                    | undefined,
                                                  name
                                                )
                                              }
                                              className="text-left text-gray-700 hover:text-gray-900 hover:underline dark:text-gray-300 dark:hover:text-gray-100 disabled:opacity-50"
                                              disabled={
                                                !finalEvent.data.session_id
                                              }
                                              title={
                                                finalEvent.data.session_id
                                                  ? "Open preview"
                                                  : "No session available"
                                              }
                                            >
                                              {name}
                                            </button>
                                          </li>
                                        );
                                      }
                                    )}
                                  </ul>
                                </div>
                              )}
                          </div>
                        ) : null}

                        {Array.isArray(finalEvent.data.attachments) &&
                          finalEvent.data.attachments.length > 0 && (
                          <div className="mt-4 pt-3 border-t">
                            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                              <Paperclip className="h-4 w-4" />
                              <span>Attachments</span>
                            </div>
                            <ul className="space-y-1">
                              {finalEvent.data.attachments.map(
                                (att: any, idx: number) => {
                                  const name =
                                    (att.path || att.absolute_path || "")
                                      .toString()
                                      .split("/")
                                      .pop() ||
                                    att.path ||
                                    att.absolute_path ||
                                    `attachment-${idx + 1}`;
                                  return (
                                    <li
                                      key={`${name}-${idx}`}
                                      className="flex items-center gap-2 text-sm"
                                    >
                                      <FileText className="h-3.5 w-3.5 text-primary/80" />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openFilePreview(
                                            finalEvent.data.session_id as
                                              | string
                                              | undefined,
                                            name
                                          )
                                        }
                                        className="text-left text-gray-700 hover:text-gray-900 hover:underline dark:text-gray-300 dark:hover:text-gray-100 disabled:opacity-50"
                                        disabled={!finalEvent.data.session_id}
                                        title={
                                          finalEvent.data.session_id
                                            ? "Click to preview"
                                            : "Preview not available"
                                        }
                                      >
                                        {name}
                                      </button>
                                      {typeof att.size === "number" && (
                                        <span className="text-xs text-muted-foreground">
                                          • {(att.size / 1024).toFixed(1)} KB
                                        </span>
                                      )}
                                    </li>
                                  );
                                }
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 ml-2">
                        Assistant •{" "}
                        {new Date(finalEvent.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input de conversation en bas */}
      <div className="border-t bg-background px-4 pt-2 pb-0">
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSubmit={handleSubmit}
          containerClassName="relative"
          thinkOutLoudEnabled={thinkOutLoudEnabled}
          onToggleThinkOutLoud={onToggleThinkOutLoud}
        />
      </div>
      {filePreview && (
        <FilePreviewSheet
          open={!!filePreview}
          onOpenChange={(open) => !open && setFilePreview(null)}
          conversationId={filePreview.sessionId}
          filename={filePreview.filename}
          displayName={filePreview.displayName}
        />
      )}
    </div>
  );
};

export default StreamingConversation;

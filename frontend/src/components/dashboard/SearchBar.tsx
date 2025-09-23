import { useConversation } from "@/contexts/ConversationContext";
import { apiStreamingService, StreamEvent } from "@/services/apiStreaming";
import { ArrowRight, Loader2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSubmit: (query: string) => void;
  onNavigateToConversation?: (message: string) => void;
  onOrderGeneration?: (query: string) => void;
  onStreamingEvent?: (event: StreamEvent) => void;
  onStreamingStart?: () => void;
  onStreamingEnd?: (finalResponse?: string) => void;
  onStreamingError?: (error: Error) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  onSubmit,
  onNavigateToConversation,
  onOrderGeneration,
  onStreamingEvent,
  onStreamingStart,
  onStreamingEnd,
  onStreamingError,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const conversation = useConversation();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [searchQuery]);

  // Auto-focus when streaming stops
  useEffect(() => {
    if (!conversation.isStreaming && !isProcessing && textareaRef.current) {
      // Small delay to ensure the DOM has updated
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [conversation.isStreaming, isProcessing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryToUse = searchQuery.trim();

    if (!queryToUse) return;

    // Vider le champ de texte immédiatement
    setSearchQuery("");

    // Ajouter le message utilisateur au store
    conversation.addUserMessage(queryToUse);
    conversation.setIsStreaming(true);

    // Naviguer vers la page de conversation
    navigate("/dashboard");

    setIsProcessing(true);

    try {
      // Démarrer le streaming
      // Always include critical requirements even if user clears system prompt
      const criticalRequirements = `CURRENT DATE: Thursday, September 18, 2025

CRITICAL REQUIREMENTS FOR ALL RESPONSES:
1. When creating a Purchase Order, your FINAL message MUST start with "Purchase Order #PO-2025-XXXX has been created"
2. ALWAYS use September 18, 2025 as today's date for any date calculations
3. PO numbers follow the format PO-2025-XXXX

`;

      const options = {
        prompt: queryToUse,
        model: "claude-sonnet-4-20250514",
        max_turns: 30,
        session_id: conversation.sessionId || undefined, // Inclure le session_id s'il existe
        ...(conversation.systemPrompt.trim() || criticalRequirements
          ? {
              // Always prepend critical requirements to any system prompt
              system_prompt: criticalRequirements + (conversation.systemPrompt.trim() || "")
            }
          : {}),
      } as const;

      // Debug logging
      const currentDate = new Date();
      console.log("Current date object:", currentDate);
      console.log("Formatted date:", currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
      console.log("Sending to API:", {
        ...options,
        system_prompt_length: options.system_prompt?.length || 0,
        system_prompt_preview: options.system_prompt?.substring(0, 200) || "none"
      });

      await apiStreamingService.streamQuery(
        options,
        (event: StreamEvent) => {
          conversation.addStreamingEvent(event);
        },
        (finalResponse?: string, sessionId?: string) => {
          setIsProcessing(false);
          conversation.setIsStreaming(false);

          // Focus the input field after response is complete
          setTimeout(() => {
            textareaRef.current?.focus();
            textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 500);

          // Conserver le session_id reçu pour les prochaines requêtes
          if (sessionId) {
            conversation.setSessionId(sessionId);
            console.log("Session ID conservé dans le contexte:", sessionId);
          }

          if (finalResponse) {
            conversation.setFinalResponse(finalResponse);
            // The final response is already displayed as a final_response event
            // No need to add it as an assistant message
          }
        },
        (error: Error) => {
          setIsProcessing(false);
          conversation.setIsStreaming(false);

          // Focus the input field after error
          setTimeout(() => {
            textareaRef.current?.focus();
            textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 500);

          // Ajouter l'erreur comme événement
          const errorEvent: StreamEvent = {
            id: Date.now().toString(),
            type: "log",
            timestamp: new Date().toISOString(),
            display: `❌ Erreur: ${error.message}`,
            data: { error: error.message },
          };
          conversation.addStreamingEvent(errorEvent);
        }
      );
    } catch (error) {
      setIsProcessing(false);
      conversation.setIsStreaming(false);

      const errorEvent: StreamEvent = {
        id: Date.now().toString(),
        type: "log",
        timestamp: new Date().toISOString(),
        display: `❌ Erreur: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`,
        data: {
          error: error instanceof Error ? error.message : "Erreur inconnue",
        },
      };
      conversation.addStreamingEvent(errorEvent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative mb-3">
      <div className={`relative transition-all duration-300`}>
        <textarea
          ref={textareaRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        placeholder='Type your message (e.g. "What do I need to know about today across my data?")'
          className="w-full min-h-[3rem] max-h-[12.5rem] pl-4 pr-12 pt-3 pb-3 text-base bg-white dark:bg-[#303030] border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white shadow-lg resize-none overflow-hidden"
          disabled={isProcessing}
          rows={1}
        />
        <button
          type="submit"
          className="absolute bottom-2 right-2 p-2 flex items-center group"
          disabled={isProcessing}
        >
          <div className={`p-1.5 rounded-lg transition-all duration-200 ${searchQuery.trim() ? 'bg-gray-700 dark:bg-gray-600 hover:bg-gray-800 dark:hover:bg-gray-700' : 'bg-gray-400 dark:bg-gray-500'} text-white disabled:opacity-50 disabled:cursor-not-allowed`}>
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </div>
        </button>
      </div>

      {/* Collapsible advanced options: systemPrompt input */}
      <Collapsible
        open={isAdvancedOpen}
        onOpenChange={setIsAdvancedOpen}
        className="mt-2"
     >
        <CollapsibleTrigger
          type="button"
          className="text-sm text-gray-600 dark:text-gray-300 underline decoration-dotted hover:decoration-solid"
          disabled={isProcessing}
        >
          {isAdvancedOpen ? "Hide advanced options" : "Advanced options"}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-[#303030] shadow-sm">
            <Label htmlFor="system-prompt" className="text-gray-700 dark:text-gray-200">
              System Prompt (optional)
            </Label>
            <textarea
              id="system-prompt"
              placeholder="Add a system prompt to guide the assistant"
              value={conversation.systemPrompt}
              onChange={(e) => {
                console.log("System prompt changed, length:", e.target.value.length);
                conversation.setSystemPrompt(e.target.value);
              }}
              disabled={isProcessing}
              className="mt-2 w-full min-h-[200px] p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-vertical"
              rows={10}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              If left empty, behavior remains unchanged. If filled, the
              "system_prompt" key is sent in the request body.
              Current length: {conversation.systemPrompt.length} characters
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </form>
  );
};

export default SearchBar;

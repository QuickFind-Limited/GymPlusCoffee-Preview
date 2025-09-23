/**
 * API Streaming Service - Gestion des conversations en streaming
 * 
 * Ce service gère la connexion à l'API de streaming pour les conversations.
 * Il envoie les requêtes au serveur et traite les événements SSE en temps réel..
*/

import { supabase } from '@/integrations/supabase/client';

export interface StreamEventData {
  status?: string;
  client_id?: string;
  type?: string;
  details?: string | Record<string, unknown>;
  display?: string;
  full_content?: string;
  user_message?: string;
  error?: string;
  session_id?: string;
  response?: string;
  // Fichiers et pièces jointes renvoyés dans l'événement "response"
  attachments?: Array<{
    path: string;
    absolute_path?: string;
    size?: number;
    modified?: string;
    is_new?: boolean;
    is_updated?: boolean;
  }>;
  new_files?: string[];
  updated_files?: string[];
  file_changes_summary?: {
    total_files?: number;
    new_count?: number;
    updated_count?: number;
  };
  [key: string]: unknown;
}

export interface StreamEvent {
  id: string;
  type: "connection" | "log" | "message" | "final_response";
  timestamp: string;
  display?: string;
  data: StreamEventData;
  full_content?: string;
}

export interface StreamingOptions {
  prompt: string;
  model: string;
  max_turns: number;
  session_id?: string;
  // Optional system prompt to guide the assistant behavior
  system_prompt?: string;
}

export class APIStreamingService {
  private readonly baseUrl = `${
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"
  }/query/stream`;
  private currentController: AbortController | null = null;
  private currentSessionId: string | null = null;
  private currentTimeoutHandle: ReturnType<typeof setTimeout> | null = null;

  // Allow long-running NetSuite jobs (10 minutes) before aborting the stream
  private static readonly STREAM_TIMEOUT_MS = 10 * 60 * 1000;

  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  async streamQuery(
    options: StreamingOptions,
    onEvent: (event: StreamEvent) => void,
    onComplete: (finalResponse?: string, sessionId?: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    // Annuler la requête précédente si elle existe
    if (this.currentController) {
      this.currentController.abort();
    }
    if (this.currentTimeoutHandle) {
      clearTimeout(this.currentTimeoutHandle);
      this.currentTimeoutHandle = null;
    }

    this.currentController = new AbortController();
    this.currentTimeoutHandle = setTimeout(() => {
      console.warn(
        `API streaming request exceeded ${APIStreamingService.STREAM_TIMEOUT_MS / 1000}s; aborting.`
      );
      this.currentController?.abort();
    }, APIStreamingService.STREAM_TIMEOUT_MS);

    // Debug logging for system prompt
    console.log("API Streaming - Sending request to:", this.baseUrl);
    console.log("API Streaming - Request body:", {
      ...options,
      system_prompt_length: options.system_prompt?.length || 0,
      system_prompt_first_100: options.system_prompt?.substring(0, 100) || "none"
    });

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error('Authentication required to start a streaming session');
      }

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(options),
        signal: this.currentController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("No response body received");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalResponse = "";
      let capturedSessionId: string | null = null;

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim() === "") continue;

            if (line.startsWith("event:")) {
              // On attend la ligne de données suivante
              continue;
            }

            if (line.startsWith("data:")) {
              try {
                const dataContent = line.slice(5).trim();
                if (dataContent === "") continue;

                const eventData = JSON.parse(dataContent);

                // Ne pas afficher/propager les événements de type user_message SAUF si c'est un assistant_message
                // Les événements assistant_message peuvent contenir user_message pour contexte
                if (typeof eventData?.type === "string" && eventData.type === "user_message") {
                  continue;
                }

                if (typeof eventData?.type === "string" && eventData.type === "completed") {
                  continue;
                }

                // Only filter out events with user_message field if they're NOT assistant messages
                if (
                  typeof eventData?.user_message === "string" &&
                  eventData.user_message.length > 0 &&
                  eventData.type !== "assistant_message"
                ) {
                  continue;
                }

                // Ignorer les assistant_message sans texte (details.has_text === false)
                if (
                  typeof eventData?.type === "string" &&
                  eventData.type === "assistant_message"
                ) {
                  const d: unknown = eventData.details as unknown;
                  if (
                    d &&
                    typeof d === "object" &&
                    (d as Record<string, unknown>).hasOwnProperty("has_text") &&
                    (d as Record<string, unknown>)["has_text"] === false
                  ) {
                    continue;
                  }
                }

                // Préparer l'affichage avec normalisation éventuelle
                let computedDisplay = eventData.display || this.formatEventDisplay(eventData);
                // Remplacement spécifique pour les événements tool_use
                if (
                  typeof eventData?.type === "string" &&
                  eventData.type === "tool_use" &&
                  typeof computedDisplay === "string"
                ) {
                  computedDisplay = computedDisplay.replace(
                    /mcp__netsuite_mcp__/g,
                    "Request NetSuite: "
                  );
                }

                const streamEvent: StreamEvent = {
                  id:
                    Date.now().toString() +
                    Math.random().toString(36).substr(2, 9),
                  type: this.determineEventType(eventData),
                  timestamp: new Date().toISOString(),
                  display: computedDisplay,
                  data: eventData,
                  full_content: eventData.full_content,
                };

                // Capturer la réponse finale et le session_id
                if (eventData.full_content && streamEvent.type === "message") {
                  finalResponse = eventData.full_content;
                }

                // Capturer le session_id quand il est présent dans la réponse
                if (eventData.session_id) {
                  capturedSessionId = eventData.session_id;
                  this.currentSessionId = capturedSessionId;
                  console.log("Session ID capturé:", capturedSessionId);
                }

                // Capturer aussi depuis le champ response si c'est la réponse finale
                if (eventData.response && eventData.session_id) {
                  finalResponse = eventData.response;
                  capturedSessionId = eventData.session_id;
                  this.currentSessionId = capturedSessionId;
                  console.log(
                    "Réponse finale avec Session ID:",
                    capturedSessionId
                  );
                }

                onEvent(streamEvent);
              } catch (parseError) {
                console.warn("Failed to parse SSE data:", parseError, line);
              }
            }
          }
        }

        onComplete(finalResponse, capturedSessionId);
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was aborted");
        return;
      }
      onError(
        error instanceof Error ? error : new Error("Unknown streaming error")
      );
    } finally {
      this.currentController = null;
      if (this.currentTimeoutHandle) {
        clearTimeout(this.currentTimeoutHandle);
        this.currentTimeoutHandle = null;
      }
    }
  }

  private determineEventType(data: StreamEventData): StreamEvent["type"] {
    if (data.status === "connected") {
      return "connection";
    }
    if (data.type) {
      if (data.type === "assistant_message" && data.full_content) {
        return "message";
      }
      return "log";
    }
    // Réponse finale : quand on a une réponse complète avec session_id
    if ((data.full_content || data.response) && data.session_id) {
      return "final_response";
    }
    // Message intermédiaire pendant le streaming
    if (data.full_content) {
      return "message";
    }
    return "log";
  }

  private formatEventDisplay(data: StreamEventData): string {
    if (data.status === "connected") {
      return `Connected (ID: ${data.client_id?.slice(0, 8)}...)`;
    }
    if (data.display) {
      return data.display;
    }
    if (data.type) {
      return `${data.type}: ${JSON.stringify(data.details || {}).slice(
        0,
        50
      )}...`;
    }
    return `Event: ${JSON.stringify(data).slice(0, 100)}...`;
  }

  abort(): void {
    if (this.currentController) {
      this.currentController.abort();
      this.currentController = null;
    }
    if (this.currentTimeoutHandle) {
      clearTimeout(this.currentTimeoutHandle);
      this.currentTimeoutHandle = null;
    }
  }
}

export const apiStreamingService = new APIStreamingService();

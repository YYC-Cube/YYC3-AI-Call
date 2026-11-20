/**
 * useAI - React hook for AI chat operations
 * Client-side wrapper around /api/ai/* endpoints
 */

"use client";

import { useState, useCallback, useRef } from "react";
import { getAuthHeaders } from "@/lib/auth-client";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface UseAIOptions {
  onError?: (error: Error) => void;
  onSuccess?: (response: unknown) => void;
}

export function useAI(hookOptions?: UseAIOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const handleSuccess = hookOptions?.onSuccess;
  const handleError = hookOptions?.onError;

  const chat = useCallback(
    async (
      messages: ChatMessage[],
      chatOptions?: {
        temperature?: number;
        max_tokens?: number;
        model?: string;
      },
    ) => {
      setLoading(true);
      setError(null);

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ messages, ...chatOptions }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        handleSuccess?.(data);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        handleError?.(error);
        throw error;
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [handleError, handleSuccess],
  );

  const classifyIntent = useCallback(
    async (message: string, intents?: string[]) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ai/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ message, intents }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        handleSuccess?.(data);
        return data; // { intent, confidence }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        handleError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [handleError, handleSuccess],
  );

  const analyzeSentiment = useCallback(
    async (text: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ai/sentiment", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        handleSuccess?.(data);
        return data; // { sentiment, score }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        handleError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [handleError, handleSuccess],
  );

  const healthCheck = useCallback(async () => {
    try {
      const response = await fetch("/api/ai/health");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error("Health check failed:", err);
      return null;
    }
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    chat,
    classifyIntent,
    analyzeSentiment,
    healthCheck,
    cancel,
  };
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  body: string;
  listingId?: string;
  transactionId?: string;
  createdAt: string;
  readAt?: string;
  sender: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  receiver: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  listing?: {
    id: string;
    title: string;
  };
}

interface UseMessagesOptions {
  conversationWith?: string;
  listingId?: string;
  transactionId?: string;
  pollingInterval?: number;
  enabled?: boolean;
}

interface UseMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (body: string) => Promise<boolean>;
  refreshMessages: () => Promise<void>;
  unreadCount: number;
}

export function useMessages(options: UseMessagesOptions = {}): UseMessagesReturn {
  const {
    conversationWith,
    listingId,
    transactionId,
    pollingInterval = 5000,
    enabled = true,
  } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastFetchRef = useRef<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!enabled) return;

    try {
      const params = new URLSearchParams();
      if (conversationWith) params.set("with", conversationWith);
      if (listingId) params.set("listingId", listingId);
      if (transactionId) params.set("transactionId", transactionId);

      const response = await fetch(`/api/messages?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      
      // Check if we have new messages
      const newLastId = data.length > 0 ? data[data.length - 1].id : null;
      if (newLastId !== lastFetchRef.current) {
        setMessages(data);
        lastFetchRef.current = newLastId;
      }

      // Count unread messages
      const unread = data.filter(
        (m: Message) => !m.readAt && m.receiverId !== conversationWith
      ).length;
      setUnreadCount(unread);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch messages");
    } finally {
      setIsLoading(false);
    }
  }, [conversationWith, listingId, transactionId, enabled]);

  const sendMessage = useCallback(
    async (body: string): Promise<boolean> => {
      if (!conversationWith) {
        setError("No recipient specified");
        return false;
      }

      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            receiverId: conversationWith,
            body,
            listingId,
            transactionId,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to send message");
        }

        // Refresh messages after sending
        await fetchMessages();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
        return false;
      }
    },
    [conversationWith, listingId, transactionId, fetchMessages]
  );

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Polling for new messages
  useEffect(() => {
    if (!enabled || pollingInterval <= 0) return;

    const interval = setInterval(fetchMessages, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchMessages, pollingInterval, enabled]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    refreshMessages: fetchMessages,
    unreadCount,
  };
}

/**
 * Hook to get unread message count across all conversations
 */
export function useUnreadMessageCount(pollingInterval = 30000): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch("/api/messages/unread-count", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setCount(data.count || 0);
        }
      } catch {
        // Silently fail
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, pollingInterval);
    return () => clearInterval(interval);
  }, [pollingInterval]);

  return count;
}

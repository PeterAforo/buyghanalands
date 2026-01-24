"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Search, MessageSquare, Filter } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface Conversation {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
  };
  lastMessage: {
    content: string;
    timestamp: Date;
    isOwn: boolean;
    isRead: boolean;
  };
  unreadCount: number;
  listing?: {
    id: string;
    title: string;
  };
}

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  className?: string;
}

type FilterType = "all" | "unread" | "listings" | "transactions";

function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  className,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filter, setFilter] = React.useState<FilterType>("all");

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diff = now.getTime() - messageDate.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) {
      return messageDate.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (days === 1) return "Yesterday";
    if (days < 7) {
      return messageDate.toLocaleDateString("en-GB", { weekday: "short" });
    }
    return messageDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  const filteredConversations = React.useMemo(() => {
    let filtered = conversations;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (conv) =>
          conv.user.name.toLowerCase().includes(query) ||
          conv.lastMessage.content.toLowerCase().includes(query) ||
          conv.listing?.title.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    switch (filter) {
      case "unread":
        filtered = filtered.filter((conv) => conv.unreadCount > 0);
        break;
      case "listings":
        filtered = filtered.filter((conv) => conv.listing);
        break;
      // Add more filters as needed
    }

    return filtered;
  }, [conversations, searchQuery, filter]);

  return (
    <div className={cn("flex flex-col h-full bg-white border-r border-gray-200", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Messages</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {(["all", "unread", "listings"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
                filter === f
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {f === "all" && "All"}
              {f === "unread" && `Unread (${conversations.filter((c) => c.unreadCount > 0).length})`}
              {f === "listings" && "Listings"}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">
              {searchQuery
                ? "No conversations found"
                : "No messages yet"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={cn(
                  "w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors",
                  activeConversationId === conversation.id && "bg-green-50",
                  conversation.unreadCount > 0 && "bg-green-50/50"
                )}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <Avatar
                    src={conversation.user.avatar}
                    fallback={conversation.user.name}
                    size="md"
                  />
                  {conversation.user.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p
                      className={cn(
                        "font-medium truncate",
                        conversation.unreadCount > 0
                          ? "text-gray-900"
                          : "text-gray-700"
                      )}
                    >
                      {conversation.user.name}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {formatTimestamp(conversation.lastMessage.timestamp)}
                    </span>
                  </div>

                  {/* Listing Context */}
                  {conversation.listing && (
                    <p className="text-xs text-green-600 truncate mb-0.5">
                      Re: {conversation.listing.title}
                    </p>
                  )}

                  {/* Last Message */}
                  <div className="flex items-center justify-between">
                    <p
                      className={cn(
                        "text-sm truncate",
                        conversation.unreadCount > 0
                          ? "text-gray-900 font-medium"
                          : "text-gray-500"
                      )}
                    >
                      {conversation.lastMessage.isOwn && (
                        <span className="text-gray-400">You: </span>
                      )}
                      {conversation.lastMessage.content}
                    </p>

                    {/* Unread Badge */}
                    {conversation.unreadCount > 0 && (
                      <span className="flex-shrink-0 ml-2 min-w-[20px] h-5 flex items-center justify-center px-1.5 text-xs font-bold text-white bg-green-600 rounded-full">
                        {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { ConversationList };
export type { Conversation };

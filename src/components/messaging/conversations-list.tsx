"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  User, 
  Loader2, 
  MessageCircle,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  listingId?: string;
  listingTitle?: string;
}

interface ConversationsListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedPartnerId?: string;
}

export function ConversationsList({ 
  onSelectConversation, 
  selectedPartnerId 
}: ConversationsListProps) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredConversations = conversations.filter((conv) =>
    conv.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.listingTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("en-GB", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    }
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
          {totalUnread > 0 && (
            <Badge className="bg-emerald-600">{totalUnread} new</Badge>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600">No conversations yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Start a conversation by messaging a seller
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <button
              key={conversation.partnerId}
              onClick={() => onSelectConversation(conversation)}
              className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b ${
                selectedPartnerId === conversation.partnerId ? "bg-emerald-50" : ""
              }`}
            >
              {/* Avatar */}
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                {conversation.partnerAvatar ? (
                  <img 
                    src={conversation.partnerAvatar} 
                    alt={conversation.partnerName} 
                    className="h-12 w-12 rounded-full object-cover" 
                  />
                ) : (
                  <User className="h-6 w-6 text-emerald-600" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold truncate ${
                    conversation.unreadCount > 0 ? "text-gray-900" : "text-gray-700"
                  }`}>
                    {conversation.partnerName}
                  </h3>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatTime(conversation.lastMessageAt)}
                  </span>
                </div>
                
                {conversation.listingTitle && (
                  <p className="text-xs text-emerald-600 truncate">
                    Re: {conversation.listingTitle}
                  </p>
                )}
                
                <p className={`text-sm truncate mt-0.5 ${
                  conversation.unreadCount > 0 ? "text-gray-900 font-medium" : "text-gray-500"
                }`}>
                  {conversation.lastMessage}
                </p>
              </div>

              {/* Unread badge */}
              {conversation.unreadCount > 0 && (
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-bold text-white bg-emerald-600 rounded-full">
                    {conversation.unreadCount}
                  </span>
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

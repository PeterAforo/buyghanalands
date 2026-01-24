"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  MoreVertical,
  Phone,
  Video,
  Check,
  CheckCheck,
  Clock,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  status: "sending" | "sent" | "delivered" | "read";
  attachments?: {
    type: "image" | "document";
    url: string;
    name?: string;
  }[];
}

interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

interface ChatInterfaceProps {
  currentUserId: string;
  otherUser: ChatUser;
  messages: Message[];
  onSendMessage: (content: string, attachments?: File[]) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  listingContext?: {
    id: string;
    title: string;
    image?: string;
  };
  className?: string;
}

function ChatInterface({
  currentUserId,
  otherUser,
  messages,
  onSendMessage,
  onLoadMore,
  hasMore,
  isLoading,
  listingContext,
  className,
}: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = React.useState("");
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    onSendMessage(newMessage.trim(), attachments);
    setNewMessage("");
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    
    return messageDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: messageDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  const getStatusIcon = (status: Message["status"]) => {
    switch (status) {
      case "sending":
        return <Clock className="h-3 w-3 text-gray-400" />;
      case "sent":
        return <Check className="h-3 w-3 text-gray-400" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-green-500" />;
    }
  };

  // Group messages by date
  const groupedMessages = React.useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";

    messages.forEach((message) => {
      const date = formatDate(message.timestamp);
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ date, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  }, [messages]);

  return (
    <div className={cn("flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar src={otherUser.avatar} fallback={otherUser.name} size="md" />
            {otherUser.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{otherUser.name}</h3>
            <p className="text-xs text-gray-500">
              {otherUser.isOnline
                ? "Online"
                : otherUser.lastSeen
                ? `Last seen ${formatTime(otherUser.lastSeen)}`
                : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Phone className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Video className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Listing Context */}
      {listingContext && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {listingContext.image && (
              <img
                src={listingContext.image}
                alt={listingContext.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Regarding listing:</p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {listingContext.title}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {hasMore && (
          <div className="text-center">
            <button
              onClick={onLoadMore}
              disabled={isLoading}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              {isLoading ? "Loading..." : "Load earlier messages"}
            </button>
          </div>
        )}

        {groupedMessages.map((group) => (
          <div key={group.date}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <span className="px-3 py-1 bg-white text-xs text-gray-500 rounded-full shadow-sm">
                {group.date}
              </span>
            </div>

            {/* Messages */}
            {group.messages.map((message) => {
              const isOwn = message.senderId === currentUserId;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    isOwn ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-2",
                      isOwn
                        ? "bg-green-600 text-white rounded-br-md"
                        : "bg-white text-gray-900 rounded-bl-md shadow-sm"
                    )}
                  >
                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mb-2 space-y-2">
                        {message.attachments.map((attachment, index) => (
                          <div key={index}>
                            {attachment.type === "image" ? (
                              <img
                                src={attachment.url}
                                alt="Attachment"
                                className="rounded-lg max-w-full"
                              />
                            ) : (
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded-lg",
                                  isOwn ? "bg-green-700" : "bg-gray-100"
                                )}
                              >
                                <Paperclip className="h-4 w-4" />
                                <span className="text-sm truncate">
                                  {attachment.name || "Document"}
                                </span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message Content */}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                    {/* Timestamp & Status */}
                    <div
                      className={cn(
                        "flex items-center gap-1 mt-1",
                        isOwn ? "justify-end" : "justify-start"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[10px]",
                          isOwn ? "text-green-200" : "text-gray-400"
                        )}
                      >
                        {formatTime(message.timestamp)}
                      </span>
                      {isOwn && getStatusIcon(message.status)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
          <div className="flex gap-2 overflow-x-auto">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-200"
              >
                {file.type.startsWith("image/") ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Paperclip className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl-lg"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-2.5 bg-gray-100 border-0 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              style={{ maxHeight: "120px" }}
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() && attachments.length === 0}
            size="icon"
            className="rounded-xl"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export { ChatInterface };
export type { Message, ChatUser };

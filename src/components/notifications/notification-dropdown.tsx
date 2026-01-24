"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Bell,
  MessageSquare,
  FileText,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  X,
  Settings,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

type NotificationType = 
  | "offer"
  | "transaction"
  | "message"
  | "verification"
  | "system"
  | "payment";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  link?: string;
  avatar?: string;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  className?: string;
}

const notificationIcons: Record<NotificationType, React.ElementType> = {
  offer: FileText,
  transaction: CreditCard,
  message: MessageSquare,
  verification: ShieldCheck,
  system: AlertTriangle,
  payment: CreditCard,
};

const notificationColors: Record<NotificationType, string> = {
  offer: "bg-blue-100 text-blue-600",
  transaction: "bg-green-100 text-green-600",
  message: "bg-purple-100 text-purple-600",
  verification: "bg-amber-100 text-amber-600",
  system: "bg-red-100 text-red-600",
  payment: "bg-emerald-100 text-emerald-600",
};

function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  className,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  Mark all as read
                </button>
              )}
              <Link
                href="/dashboard/notifications/settings"
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <Settings className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notification) => {
                  const Icon = notificationIcons[notification.type];
                  const colorClass = notificationColors[notification.type];

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "relative px-4 py-3 hover:bg-gray-50 transition-colors",
                        !notification.isRead && "bg-green-50/50"
                      )}
                    >
                      <Link
                        href={notification.link || "#"}
                        onClick={() => {
                          if (!notification.isRead) {
                            onMarkAsRead(notification.id);
                          }
                          setIsOpen(false);
                        }}
                        className="flex gap-3"
                      >
                        {/* Icon or Avatar */}
                        {notification.avatar ? (
                          <Avatar
                            src={notification.avatar}
                            fallback={notification.title}
                            size="sm"
                          />
                        ) : (
                          <div
                            className={cn(
                              "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
                              colorClass
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm",
                              !notification.isRead
                                ? "font-medium text-gray-900"
                                : "text-gray-700"
                            )}
                          >
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>

                        {/* Unread Indicator */}
                        {!notification.isRead && (
                          <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2" />
                        )}
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100">
              <Link
                href="/dashboard/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center py-3 text-sm text-green-600 hover:text-green-700 hover:bg-gray-50 font-medium transition-colors"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { NotificationDropdown };
export type { Notification, NotificationType };
